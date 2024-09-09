import { appRouter, createExpressMiddleware, createTRPCContext } from "@repo/api-server"
import { env } from "@repo/env/api"
import { lucia, type Session, type User } from "@repo/lucia"
import cors from "cors"
import express from "express"

import { githubLoginRouter } from "./oauth/github"
import { googleLoginRouter } from "./oauth/google"

const app = express()

app.use(
	cors({
		credentials: true,
		origin: env.FRONTEND_URL
	})
)

app.get("/health", (_req, res) => {
	res.json({ ok: true })
})

app.use(async (req, res, next) => {
	const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "")

	if (!sessionId) {
		res.locals.user = null
		res.locals.session = null
		return next()
	}

	const { session, user } = await lucia.validateSession(sessionId)

	if (session && session.fresh) {
		res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
	}

	if (!session) {
		res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize())
	}

	res.locals.user = user
	res.locals.session = session
	return next()
})

const trpcExpress = createExpressMiddleware({
	router: appRouter,
	createContext: createTRPCContext,
	onError: (opts) => {
		console.log("TRPC Error", {
			data: opts.error.name,
			code: opts.error.code,
			message: opts.error.message
		})
	}
})

app.use(githubLoginRouter, googleLoginRouter)

app.use("/trpc", trpcExpress)

app.listen(env.PORT)

declare global {
	namespace Express {
		interface Locals {
			user: User | null
			session: Session | null
		}
	}
}

import { trpcServer } from "@hono/trpc-server"
import { appRouter } from "@repo/trpc"
import { createTRPCContext } from "@repo/trpc/context"
import { Hono } from "hono"
import { contextStorage } from "hono/context-storage"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { poweredBy } from "hono/powered-by"
import { secureHeaders } from "hono/secure-headers"
import { z } from "zod"
import { env } from "@/environment/env"
import { auth } from "@/libs/auth"

const app = new Hono()

app.use(
	"*",
	secureHeaders(),
	contextStorage(),
	poweredBy({ serverName: "Monorepo Template" }),
	cors({ credentials: true, origin: env.FRONTEND_URL })
)

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (opts) => {
			return createTRPCContext({
				auth,
				request: opts.req,
				headers: opts.resHeaders,
				database: {
					redis: env.REDIS_URL,
					url: env.DATABASE_URL,
					token: env.DATABASE_AUTH_TOKEN
				},
				env: { node_env: env.NODE_ENV }
			})
		}
	})
)

app.get("/", (c) => {
	return c.text("OK")
})

app.onError((error, c) => {
	if (error instanceof HTTPException) {
		return c.text(error.message, error.status)
	}

	if (error instanceof z.ZodError) {
		return c.text(error.issues.map((err) => err.message).join(",\n"), 400)
	}

	return c.text("Something went wrong", 500)
})

export default {
	port: env.PORT,
	fetch: app.fetch
}

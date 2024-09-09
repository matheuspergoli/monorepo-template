import { db } from "@repo/db/client"
import { type Session, type User } from "@repo/lucia"
import { initTRPC, TRPCError } from "@trpc/server"
import { type CreateExpressContextOptions } from "@trpc/server/adapters/express"
import SuperJSON from "superjson"
import { ZodError } from "zod"

export const createTRPCContext = (opts: CreateExpressContextOptions) => {
	const user = opts.res.locals.user as User | null
	const session = opts.res.locals.session as Session | null

	const source = opts.req.headers["x-trpc-source"]
	console.log(">>> tRPC Request from", source ?? "Unknown")

	return {
		db,
		user,
		session,
		response: opts.res
	}
}

const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: SuperJSON,
	errorFormatter: ({ shape, error }) => ({
		...shape,
		data: {
			...shape.data,
			zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
		}
	})
})

const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now()

	if (t._config.isDev) {
		const waitMs = Math.floor(Math.random() * 400) + 100
		await new Promise((resolve) => setTimeout(resolve, waitMs))
	}

	const result = await next()

	const end = Date.now()
	console.log(`[TRPC] ${path} took ${end - start}ms to execute`)

	return result
})

export const publicProcedure = t.procedure.use(timingMiddleware)

export const protectedProcedure = publicProcedure
	.use(timingMiddleware)
	.use(async ({ ctx, next }) => {
		if (!ctx.user || !ctx.session) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to perform this action"
			})
		}

		return next({
			ctx: {
				user: { ...ctx.user },
				session: { ...ctx.session }
			}
		})
	})

export const {
	router: createTRPCRouter,
	createCallerFactory,
	middleware,
	mergeRouters
} = t

import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server"
import { createExpressMiddleware } from "@trpc/server/adapters/express"

import { authRouter } from "./routers/auth"
import { exampleRouter } from "./routers/example"
import { createCallerFactory, createTRPCContext, createTRPCRouter } from "./trpc"

const appRouter = createTRPCRouter({
	auth: authRouter,
	example: exampleRouter
})

const createCaller = createCallerFactory(appRouter)

export { createTRPCContext, createCaller, appRouter, createExpressMiddleware }
export type AppRouter = typeof appRouter
export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

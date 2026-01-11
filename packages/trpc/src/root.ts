import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server"
import { userRouter } from "./routers/user"
import { createTRPCRouter } from "./trpc"

export const appRouter = createTRPCRouter({
	user: userRouter
})

export type AppRouter = typeof appRouter
export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

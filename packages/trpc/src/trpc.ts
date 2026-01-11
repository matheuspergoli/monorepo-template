import { initTRPC } from "@trpc/server"
import SuperJSON from "superjson"
import z, { ZodError } from "zod"
import type { TRPCContext } from "./context"

const t = initTRPC.context<TRPCContext>().create({
	transformer: SuperJSON,
	errorFormatter: ({ shape, error }) => ({
		...shape,
		data: {
			...shape.data,
			zodError: error.cause instanceof ZodError ? z.flattenError(error.cause) : null
		}
	})
})

export const config = t._config
export const procedure = t.procedure
export const middleware = t.middleware
export const createTRPCRouter = t.router

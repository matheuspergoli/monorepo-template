import { loggingMiddleware } from "@/middlewares/logging-middleware"
import { procedure } from "@/trpc"

export const publicProcedure = procedure.use(loggingMiddleware)

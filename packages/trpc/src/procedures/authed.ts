import { authMiddleware } from "@/middlewares/auth-middleware"
import { loggingMiddleware } from "@/middlewares/logging-middleware"
import { procedure } from "@/trpc"

export const authedProcedure = procedure.use(loggingMiddleware).use(authMiddleware)

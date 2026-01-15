import { authMiddleware } from "@/middlewares/auth-middleware"
import { timingMiddleware } from "@/middlewares/timing-middleware"
import { procedure } from "@/trpc"

export const authedProcedure = procedure.use(timingMiddleware).use(authMiddleware)

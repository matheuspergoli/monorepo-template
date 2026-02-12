import { authMiddleware } from "@/middlewares/auth-middleware"
import { procedure } from "@/trpc"

export const authedProcedure = procedure.use(authMiddleware)

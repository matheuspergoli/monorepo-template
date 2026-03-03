import { authMiddleware } from "#src/middlewares/auth-middleware"
import { procedure } from "#src/trpc"

export const authedProcedure = procedure.use(authMiddleware)

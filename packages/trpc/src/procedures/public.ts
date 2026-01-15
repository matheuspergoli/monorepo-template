import { timingMiddleware } from "@/middlewares/timing-middleware"
import { procedure } from "@/trpc"

export const publicProcedure = procedure.use(timingMiddleware)

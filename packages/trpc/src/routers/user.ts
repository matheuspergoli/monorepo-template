import { authedProcedure } from "#src/procedures/authed"
import { createTRPCRouter } from "#src/trpc"

export const userRouter = createTRPCRouter({
	get: authedProcedure.query(({ ctx }) => {
		return ctx.session.subject.properties
	})
})

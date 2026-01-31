import { authedProcedure } from "@/procedures/authed"
import { createTRPCRouter } from "@/trpc"

export const userRouter = createTRPCRouter({
	get: authedProcedure.query(({ ctx }) => {
		return ctx.session.subject.properties.email
	})
})

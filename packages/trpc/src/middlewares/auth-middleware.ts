import { getAuthCookieOptions } from "@repo/auth/cookie"
import { subjects } from "@repo/auth/subjects"
import { TRPCError } from "@trpc/server"
import { middleware } from "@/trpc"

export const authMiddleware = middleware(async ({ ctx, next }) => {
	const access = ctx.cookies.get("access_token")
	const refresh = ctx.cookies.get("refresh_token")
	const options = getAuthCookieOptions({ secure: ctx.env.node_env === "production" })

	if (!access) {
		throw new TRPCError({
			code: "UNAUTHORIZED"
		})
	}

	const verified = await ctx.auth.verify(subjects, access, {
		refresh: refresh ?? ""
	})

	if (!verified.success) {
		throw new TRPCError({
			code: "UNAUTHORIZED"
		})
	}

	if (verified.data.tokens) {
		ctx.cookies.set("access_token", verified.data.tokens.access, options)
		ctx.cookies.set("refresh_token", verified.data.tokens.refresh, options)
	}

	return next({
		ctx: {
			user: verified.data.subject.properties
		}
	})
})

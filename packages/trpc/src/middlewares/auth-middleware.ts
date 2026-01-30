import { getAuthCookieOptions } from "@repo/auth/cookie"
import { subjects } from "@repo/auth/subjects"
import { getLogger } from "@repo/logger"
import { TRPCError } from "@trpc/server"
import { middleware } from "@/trpc"

const prodCookieOptions = getAuthCookieOptions({ secure: true })
const devCookieOptions = getAuthCookieOptions({ secure: false })

export const authMiddleware = middleware(async ({ ctx, next }) => {
	const logger = getLogger()

	const access = ctx.cookies.get("access_token")
	const refresh = ctx.cookies.get("refresh_token")
	const options = ctx.env.node_env === "production" ? prodCookieOptions : devCookieOptions

	const realIp = ctx.request.headers.get("x-real-ip")
	const forwardedFor = ctx.request.headers.get("x-forwarded-for")
	const clientIp = forwardedFor || realIp || "unknown"
	const userAgent = ctx.request.headers.get("user-agent") || "unknown"

	logger.addContext({
		client_ip: clientIp,
		user_agent: userAgent
	})

	if (!access) {
		logger.addContext({
			auth_status: "failed",
			auth_reason: "missing_token"
		})

		logger.error({
			has_refresh_token: !!refresh,
			message: "Authentication failed: missing access token"
		})

		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Token de acesso não encontrado"
		})
	}

	const verified = await ctx.auth.verify(subjects, access, {
		refresh: refresh ?? ""
	})

	if (!verified.success) {
		logger.addContext({
			auth_status: "failed",
			auth_reason: "invalid_token"
		})

		logger.error({
			has_refresh_token: !!refresh,
			message: "Authentication failed: invalid token"
		})

		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Verificação de usuário inválida"
		})
	}

	const tokenRefreshed = !!verified.data.tokens
	if (verified.data.tokens) {
		ctx.cookies.set("access_token", verified.data.tokens.access, options)
		ctx.cookies.set("refresh_token", verified.data.tokens.refresh, options)
	}

	logger.addContext({
		auth_status: "success",
		token_refreshed: tokenRefreshed,
		user_email: verified.data.subject.properties.email
	})

	return next({
		ctx: {
			user: verified.data.subject.properties
		}
	})
})

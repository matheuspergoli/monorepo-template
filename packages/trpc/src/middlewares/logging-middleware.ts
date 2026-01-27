import { getLogger, initializeRequestContext } from "@repo/logger"
import { middleware } from "@/trpc"

export const loggingMiddleware = middleware(async ({ next, path, type, ctx }) => {
	const logger = getLogger()

	return logger.isolate({
		fn: async () => {
			const startTime = Date.now()
			const requestContext = initializeRequestContext("TRPC", path)

			const forwardedFor = ctx.request.headers.get("x-forwarded-for")
			const realIp = ctx.request.headers.get("x-real-ip")
			const clientIp = forwardedFor || realIp || "unknown"
			const userAgent = ctx.request.headers.get("user-agent") || "unknown"

			logger.addContext({
				...requestContext,
				trpc_path: path,
				trpc_type: type,
				client_ip: clientIp,
				user_agent: userAgent
			})

			try {
				const result = await next()

				logger.info({
					status_code: 200,
					outcome: "success",
					duration_ms: Date.now() - startTime
				})

				return result
			} catch (error) {
				logger.error({
					status_code: 500,
					outcome: "error",
					duration_ms: Date.now() - startTime,
					error: {
						retriable: false,
						stack: error instanceof Error ? error.stack : undefined,
						type: error instanceof Error ? error.name : "UnknownError",
						message: error instanceof Error ? error.message : String(error)
					}
				})

				throw error
			}
		}
	})
})

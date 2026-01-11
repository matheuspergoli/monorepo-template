import { config, middleware } from "@/trpc"

export const timingMiddleware = middleware(async ({ next, path }) => {
	const start = Date.now()

	if (config.isDev) {
		const waitMs = Math.floor(Math.random() * 900) + 100
		await new Promise((resolve) => setTimeout(resolve, waitMs))
	}

	const result = await next()

	const end = Date.now()
	console.log(`[TRPC] ${path} took ${end - start}ms to execute`)

	return result
})

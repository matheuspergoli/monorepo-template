import { config, middleware } from "@/trpc"

export const timingMiddleware = middleware(async ({ next, path, signal }) => {
	const start = Date.now()

	if (config.isDev) {
		const waitMs = Math.floor(Math.random() * 900) + 100
		await new Promise((resolve, reject) => {
			const timeoutId = setTimeout(resolve, waitMs)

			signal?.addEventListener("abort", () => {
				clearTimeout(timeoutId)
				reject(new Error("Request aborted"))
			})
		})
	}

	const result = await next()

	const end = Date.now()
	console.log(`[TRPC] ${path} took ${end - start}ms to execute`)

	return result
})

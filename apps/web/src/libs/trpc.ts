import { AppRouter } from "@repo/api-client"
import { env } from "@repo/env/web"
import { QueryClient } from "@tanstack/react-query"
import {
	createTRPCQueryUtils,
	createTRPCReact,
	httpBatchLink,
	loggerLink
} from "@trpc/react-query"
import superjson from "superjson"

export const api = createTRPCReact<AppRouter>()

export const queryClient = new QueryClient()

export const trpcClient = api.createClient({
	links: [
		loggerLink({
			enabled: (opts) =>
				import.meta.env.NODE_ENV === "development" ||
				(opts.direction === "down" && opts.result instanceof Error),
			colorMode: "ansi"
		}),
		httpBatchLink({
			transformer: superjson,
			url: env.VITE_API_URL + "/trpc",
			fetch(url, opts) {
				return fetch(url, {
					...opts,
					credentials: "include"
				})
			},
			headers() {
				const headers = new Map<string, string>()
				headers.set("x-trpc-source", "vite-react")

				return Object.fromEntries(headers)
			}
		})
	]
})

export const trpcQueryUtils = createTRPCQueryUtils({ queryClient, client: trpcClient })

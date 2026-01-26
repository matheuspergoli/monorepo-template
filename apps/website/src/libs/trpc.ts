import type { AppRouter } from "@repo/trpc"
import { createTRPCClient, httpBatchLink } from "@repo/trpc/client"
import { hydratorLink } from "@repo/trpc/links/hydrator"
import { createIsomorphicFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import SuperJSON from "superjson"
import { env } from "@/environment/env"

export const trpc = createIsomorphicFn()
	.server(() => {
		return createTRPCClient<AppRouter>({
			links: [
				hydratorLink,
				httpBatchLink({
					transformer: SuperJSON,
					url: `${env.VITE_BACKEND_URL}/trpc`,
					headers: () => {
						const headers = new Headers(getRequestHeaders())
						headers.set("x-trpc-source", "monorepo-app-server")
						return headers
					},
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: "include"
						})
					}
				})
			]
		})
	})
	.client(() => {
		return createTRPCClient<AppRouter>({
			links: [
				hydratorLink,
				httpBatchLink({
					transformer: SuperJSON,
					url: `${env.VITE_BACKEND_URL}/trpc`,
					headers() {
						const headers = new Headers()
						headers.set("x-trpc-source", "monorepo-app-client")
						return headers
					},
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: "include"
						})
					}
				})
			]
		})
	})()

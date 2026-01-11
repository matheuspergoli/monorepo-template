import type { AppRouter } from "@repo/trpc"
import { createTRPCClient, httpBatchLink } from "@repo/trpc/client"
import SuperJSON from "superjson"
import { env } from "@/environment/env"

export const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			transformer: SuperJSON,
			url: `${env.VITE_BACKEND_URL}/trpc`,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include"
				})
			}
		})
	]
})

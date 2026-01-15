import { appRouter } from "@repo/trpc"
import { fetchRequestHandler } from "@repo/trpc/adapters/fetch"
import { createTRPCContext } from "@repo/trpc/context"
import { env } from "@/environment/env"
import { auth } from "./libs/auth"

const port = Number(process.env.PORT ?? 4000)

Bun.serve({
	port,
	async fetch(req: Request) {
		const url = new URL(req.url)

		const allowMethods = ["GET", "POST", "OPTIONS"]
		const allowHeaders = ["Content-Type", "Authorization", "trpc-accept", "x-trpc-source"]

		const headers = {
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Allow-Origin": env.FRONTEND_URL,
			"Access-Control-Allow-Methods": allowMethods.join(", "),
			"Access-Control-Allow-Headers": allowHeaders.join(", ")
		}

		if (req.method === "OPTIONS") {
			return new Response(null, { headers })
		}

		if (url.pathname.startsWith("/trpc")) {
			const response = await fetchRequestHandler({
				req,
				endpoint: "/trpc",
				router: appRouter,
				createContext: (opts) => {
					return createTRPCContext({
						auth,
						request: opts.req,
						headers: opts.resHeaders,
						database: {
							redis: env.REDIS_URL,
							url: env.DATABASE_URL,
							token: env.DATABASE_AUTH_TOKEN
						},
						env: { node_env: env.NODE_ENV }
					})
				}
			})

			Object.entries(headers).forEach(([key, value]) => {
				response.headers.set(key, value)
			})

			return response
		}

		if (url.pathname === "/") {
			return new Response("OK", {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": env.FRONTEND_URL
				}
			})
		}

		return new Response("Not Found", { status: 404 })
	}
})

console.log(`Server running at http://localhost:${port}`)

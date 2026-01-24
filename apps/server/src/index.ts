import { trpcServer } from "@hono/trpc-server"
import { appRouter } from "@repo/trpc"
import { createTRPCContext } from "@repo/trpc/context"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { poweredBy } from "hono/powered-by"
import { secureHeaders } from "hono/secure-headers"
import { env } from "@/environment/env"
import { auth } from "./libs/auth"

const app = new Hono()

app.use(
	"*",
	secureHeaders(),
	poweredBy({ serverName: "Monorepo Template" }),
	cors({ credentials: true, origin: env.FRONTEND_URL })
)

app.use(
	"/trpc/*",
	trpcServer({
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
)

app.get("/", (c) => {
	return c.text("OK")
})

export default {
	fetch: app.fetch,
	port: process.env.PORT ?? 4000
}

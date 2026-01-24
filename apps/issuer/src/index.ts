import { Hono } from "hono"
import { cors } from "hono/cors"
import { poweredBy } from "hono/powered-by"
import { secureHeaders } from "hono/secure-headers"
import { auth } from "./auth"

const app = new Hono()

app.use("*", cors(), secureHeaders(), poweredBy({ serverName: "Monorepo Template" }))

app.route("/", auth)

app.get("/", (c) => {
	return c.text("OK")
})

export default {
	fetch: app.fetch,
	port: process.env.PORT ?? 3000
}

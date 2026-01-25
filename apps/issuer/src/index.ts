import { Hono } from "hono"
import { contextStorage } from "hono/context-storage"
import { cors } from "hono/cors"
import { poweredBy } from "hono/powered-by"
import { secureHeaders } from "hono/secure-headers"
import { auth } from "@/libs/auth"

const app = new Hono()

app.use(
	"*",
	cors(),
	secureHeaders(),
	contextStorage(),
	poweredBy({ serverName: "Monorepo Template" })
)

app.route("/", auth)

app.get("/", (c) => {
	return c.text("OK")
})

export default {
	fetch: app.fetch,
	port: process.env.PORT ?? 3000
}

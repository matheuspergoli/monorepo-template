import { Hono } from "hono"
import { contextStorage } from "hono/context-storage"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { poweredBy } from "hono/powered-by"
import { secureHeaders } from "hono/secure-headers"
import { z } from "zod"
import { env } from "@/environment/env"
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

app.onError((error, c) => {
	if (error instanceof HTTPException) {
		return c.text(error.message, error.status)
	}

	if (error instanceof z.ZodError) {
		return c.text(error.issues.map((err) => err.message).join(",\n"), 400)
	}

	return c.text("Something went wrong", 500)
})

export default {
	port: env.PORT,
	fetch: app.fetch
}

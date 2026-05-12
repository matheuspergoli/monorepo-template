import { createDatabase } from "@repo/db/client"
import { env } from "@/environment/env"

export const db = createDatabase({
	redis: env.REDIS_URL,
	url: env.DATABASE_URL,
	token: env.DATABASE_AUTH_TOKEN,
	env: { node_env: env.NODE_ENV }
})

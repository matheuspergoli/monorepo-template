import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		REDIS_URL: z.url(),
		FRONTEND_URL: z.url(),
		DATABASE_URL: z.url(),
		AUTH_ISSUER_URL: z.url(),
		DATABASE_AUTH_TOKEN: z.string(),
		PORT: z.coerce.number().positive()
	},
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"]).default("development")
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
	skipValidation: process.env.SKIP_ENV_VALIDATION === "true"
})

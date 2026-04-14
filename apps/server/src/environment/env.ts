import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		REDIS_URL: z.string(),
		FRONTEND_URL: z.string(),
		DATABASE_URL: z.string(),
		AUTH_ISSUER_URL: z.string(),
		DATABASE_AUTH_TOKEN: z.string(),
		PORT: z.coerce.number().positive().default(4000)
	},
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"]).default("development")
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
	skipValidation: process.env.SKIP_ENV_VALIDATION === "true"
})

import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		REDIS_URL: z.string()
	},
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"])
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
	skipValidation: process.env.SKIP_ENV_VALIDATION === "true"
})

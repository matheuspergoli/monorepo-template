import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		TURSO_AUTH_TOKEN: z.string(),
		TURSO_CONNECTION_URL: z.string()
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true
})

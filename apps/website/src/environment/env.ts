import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	client: {
		VITE_BACKEND_URL: z.string(),
		VITE_AUTH_ISSUER_URL: z.string()
	},
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"]).default("development")
	},
	clientPrefix: "VITE_",
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true
})

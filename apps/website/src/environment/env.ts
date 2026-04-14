import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	client: {
		VITE_BACKEND_URL: z.string(),
		VITE_AUTH_ISSUER_URL: z.string()
	},
	clientPrefix: "VITE_",
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true
})

export const isProduction = import.meta.env.PROD

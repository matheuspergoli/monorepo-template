import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	client: {
		VITE_API_URL: z.string()
	},
	server: {
		BASE_URL: z.string(),
		MODE: z.string(),
		DEV: z.boolean(),
		PROD: z.boolean(),
		SSR: z.boolean()
	},
	clientPrefix: "VITE_",
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true
})

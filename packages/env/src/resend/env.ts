import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		EMAIL_HOST: z.string(),
		RESEND_API_KEY: z.string()
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true
})

import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		PORT: z.number().default(3030),
		FRONTEND_URL: z.string()
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true
})

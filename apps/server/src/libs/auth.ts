import { createAuthClient } from "@repo/auth/client"
import { env } from "@/environment/env"

export const auth = createAuthClient({
	issuer: env.AUTH_ISSUER_URL
})

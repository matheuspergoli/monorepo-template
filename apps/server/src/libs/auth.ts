import { makeAuthClient } from "@repo/auth/client"
import { env } from "@/environment/env"

export const auth = makeAuthClient({
	issuer: env.AUTH_ISSUER_URL
})

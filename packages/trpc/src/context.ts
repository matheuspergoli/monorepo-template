import type { AuthClient } from "@repo/auth/client"
import type { Database } from "@repo/db/client"
import type { CookieStore } from "#src/libs/cookies"

interface TRPCContextConfig {
	db: Database
	auth: AuthClient
	request: Request
	headers: Headers
	cookies: CookieStore
	env: {
		node_env: "production" | "development" | "test"
	}
}

export const createTRPCContext = async (context: TRPCContextConfig) => {
	return {
		db: context.db,
		env: context.env,
		auth: context.auth,
		cookies: context.cookies,
		request: context.request,
		headers: context.headers
	}
}

export type { CookieOptions, CookieStore } from "#src/libs/cookies"

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

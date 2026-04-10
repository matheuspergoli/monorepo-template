import type { AuthClient } from "@repo/auth/client"
import { createDatabase } from "@repo/db/client"
import type { CookieStore } from "#src/libs/cookies"

interface TRPCContextConfig {
	request: Request
	headers: Headers
	cookies: CookieStore
	auth: AuthClient
	env: {
		node_env: "production" | "development" | "test"
	}
	database: {
		url: string
		token: string
		redis: string
	}
}

export const createTRPCContext = async (context: TRPCContextConfig) => {
	const db = createDatabase({
		env: context.env,
		url: context.database.url,
		redis: context.database.redis,
		token: context.database.token
	})

	return {
		db,
		env: context.env,
		auth: context.auth,
		cookies: context.cookies,
		request: context.request,
		headers: context.headers
	}
}

export type { CookieOptions, CookieStore } from "#src/libs/cookies"

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

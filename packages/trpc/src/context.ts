import type { AuthClient } from "@repo/auth/client"
import { createDatabase } from "@repo/db/client"
import { Cookies } from "#src/libs/cookies"

interface TRPCContextConfig {
	request: Request
	headers: Headers
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
	const cookies = new Cookies(context.request.headers, context.headers)

	const db = createDatabase({
		env: context.env,
		url: context.database.url,
		redis: context.database.redis,
		token: context.database.token
	})

	return {
		db,
		cookies,
		env: context.env,
		auth: context.auth,
		request: context.request,
		headers: context.headers
	}
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

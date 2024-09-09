import { lucia } from "@repo/lucia"
import { type CreateExpressContextOptions } from "@trpc/server/adapters/express"

type Response = CreateExpressContextOptions["res"]

export const setSession = async ({ userId, res }: { userId: string; res: Response }) => {
	const session = await lucia.createSession(userId, {})
	const sessionCookie = lucia.createSessionCookie(session.id)
	res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
}

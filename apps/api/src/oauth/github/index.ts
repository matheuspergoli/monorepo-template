import { generateState, github, OAuth2RequestError } from "@repo/arctic"
import { eq } from "@repo/db"
import { db } from "@repo/db/client"
import { oauthAccount, users } from "@repo/db/schema"
import { env as apiEnv } from "@repo/env/api"
import { env as sharedEnv } from "@repo/env/shared"
import { generateIdFromEntropySize, lucia } from "@repo/lucia"
import { parseCookies, serializeCookie } from "@repo/oslo"
import express, { Router } from "express"

export const githubLoginRouter: Router = express.Router()

interface GitHubUser {
	id: number
	login: string
	avatar_url: string
	email: string
}

const STATE_COOKIE = "github_oauth_state"

githubLoginRouter.get("/login/github", async (_, res) => {
	const state = generateState()
	const url = await github.createAuthorizationURL(state)

	res
		.appendHeader(
			"Set-Cookie",
			serializeCookie(STATE_COOKIE, state, {
				path: "/",
				secure: sharedEnv.NODE_ENV === "production",
				httpOnly: true,
				maxAge: 60 * 10,
				sameSite: "lax"
			})
		)
		.redirect(url.toString())
})

githubLoginRouter.get("/login/github/callback", async (req, res) => {
	const code = req.query.code?.toString() ?? null
	const state = req.query.state?.toString() ?? null
	const storedState = parseCookies(req.headers.cookie ?? "").get(STATE_COOKIE) ?? null

	if (!code || !state || !storedState || state !== storedState) {
		res.status(400).end()
		return
	}

	try {
		const tokens = await github.validateAuthorizationCode(code)
		const githubUserResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		})
		const githubUser: GitHubUser = await githubUserResponse.json()

		const existingUser = await db
			.select({
				id: users.id,
				username: users.username,
				email: users.email,
				emailVerified: users.emailVerified
			})
			.from(users)
			.innerJoin(oauthAccount, eq(users.id, oauthAccount.userId))
			.where(eq(oauthAccount.providerUserId, githubUser.id.toString()))
			.limit(1)
			.then((res) => res[0] ?? null)

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {})
			return res
				.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
				.redirect(apiEnv.FRONTEND_URL)
		}

		const userId = generateIdFromEntropySize(10)
		await db.insert(users).values({
			id: userId,
			username: githubUser.login,
			email: githubUser.email,
			emailVerified: true
		})
		await db.insert(oauthAccount).values({
			userId,
			providerId: "github",
			providerUserId: githubUser.id.toString()
		})

		const session = await lucia.createSession(userId, {})
		return res
			.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
			.redirect(apiEnv.FRONTEND_URL)
	} catch (e) {
		if (e instanceof OAuth2RequestError && e.message === "bad_verification_code") {
			res.status(400).end()
			return
		}
		res.status(500).end()
		return
	}
})

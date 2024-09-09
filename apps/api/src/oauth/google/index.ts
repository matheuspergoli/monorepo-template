import {
	generateCodeVerifier,
	generateState,
	google,
	OAuth2RequestError
} from "@repo/arctic"
import { eq } from "@repo/db"
import { db } from "@repo/db/client"
import { oauthAccount, users } from "@repo/db/schema"
import { env as apiEnv } from "@repo/env/api"
import { env as sharedEnv } from "@repo/env/shared"
import { generateIdFromEntropySize, lucia } from "@repo/lucia"
import { parseCookies, serializeCookie } from "@repo/oslo"
import express, { Router } from "express"

export const googleLoginRouter: Router = express.Router()

interface GoogleUser {
	sub: string
	name: string
	email: string
}

const STATE_COOKIE = "google_oauth_state"
const VERIFIER_COOKIE = "google_code_verifier"

googleLoginRouter.get("/login/google", async (_, res) => {
	const state = generateState()
	const codeVerifier = generateCodeVerifier()
	const url = await google.createAuthorizationURL(state, codeVerifier, {
		scopes: ["profile", "email"]
	})

	res.appendHeader(
		"Set-Cookie",
		serializeCookie(STATE_COOKIE, state, {
			path: "/",
			secure: sharedEnv.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: "lax"
		})
	)

	res.appendHeader(
		"Set-Cookie",
		serializeCookie(VERIFIER_COOKIE, codeVerifier, {
			path: "/",
			secure: sharedEnv.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: "lax"
		})
	)

	res.redirect(url.toString())
})

googleLoginRouter.get("/login/google/callback", async (req, res) => {
	const code = req.query.code?.toString() ?? null
	const state = req.query.state?.toString() ?? null
	const storedState = parseCookies(req.headers.cookie ?? "").get(STATE_COOKIE) ?? null
	const codeVerifier = parseCookies(req.headers.cookie ?? "").get(VERIFIER_COOKIE) ?? null

	if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
		res.status(400).end()
		return
	}

	try {
		const oauthUrl = "https://openidconnect.googleapis.com/v1/userinfo"
		const tokens = await google.validateAuthorizationCode(code, codeVerifier)
		const googleUserResponse = await fetch(oauthUrl, {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		})

		const googleUser: GoogleUser = await googleUserResponse.json()

		const existingUser = await db
			.select({
				id: users.id,
				username: users.username,
				email: users.email,
				emailVerified: users.emailVerified
			})
			.from(users)
			.innerJoin(oauthAccount, eq(users.id, oauthAccount.userId))
			.where(eq(oauthAccount.providerUserId, googleUser.sub))
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
			username: googleUser.name,
			email: googleUser.email,
			emailVerified: true
		})
		await db.insert(oauthAccount).values({
			userId,
			providerId: "github",
			providerUserId: googleUser.sub
		})

		const session = await lucia.createSession(userId, {})
		return res
			.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
			.redirect(apiEnv.FRONTEND_URL)
	} catch (e) {
		if (e instanceof OAuth2RequestError) {
			res.status(400).end()
			return
		}
		res.status(500).end()
		return
	}
})

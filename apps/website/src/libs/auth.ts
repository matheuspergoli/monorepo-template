import { createAuthClient } from "@repo/auth/client"
import { getAuthCookieOptions } from "@repo/auth/cookie"
import { subjects } from "@repo/auth/subjects"
import { redirect } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import {
	deleteCookie,
	getCookie,
	getRequestUrl,
	setCookie
} from "@tanstack/react-start/server"
import { env, isProduction } from "@/environment/env"

export const auth = createAuthClient({
	issuer: env.VITE_AUTH_ISSUER_URL
})

export const ACCESS_TOKEN_NAME = "access_token"
export const REFRESH_TOKEN_NAME = "refresh_token"

const cookieOptions = getAuthCookieOptions({ secure: isProduction })

export const $login = createServerFn({ method: "POST" }).handler(async () => {
	const accessToken = getCookie(ACCESS_TOKEN_NAME)
	const refreshToken = getCookie(REFRESH_TOKEN_NAME)

	if (accessToken) {
		const verified = await auth.verify(subjects, accessToken, {
			refresh: refreshToken
		})

		if (verified.success && verified.data.tokens) {
			setCookie(ACCESS_TOKEN_NAME, verified.data.tokens.access, cookieOptions)
			setCookie(REFRESH_TOKEN_NAME, verified.data.tokens.refresh, cookieOptions)

			throw redirect({ to: "/" })
		}
	}

	const requestUrl = getRequestUrl({ xForwardedHost: true, xForwardedProto: true })
	const callbackUrl = new URL("/auth/callback", requestUrl).toString()
	const result = await auth.authorize(callbackUrl, "code")

	if (result.success) {
		throw redirect({ href: result.data.url })
	}

	throw redirect({ to: "/" })
})

export const $logout = createServerFn({ method: "POST" }).handler(async () => {
	deleteCookie(ACCESS_TOKEN_NAME)
	deleteCookie(REFRESH_TOKEN_NAME)

	throw redirect({ to: "/" })
})

export const useAuth = () => {
	const login = useServerFn($login)
	const logout = useServerFn($logout)

	return { login, logout, auth }
}

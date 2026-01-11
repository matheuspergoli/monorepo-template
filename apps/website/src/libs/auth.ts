import { makeAuthClient } from "@repo/auth/client"
import { getAuthCookieOptions } from "@repo/auth/cookie"
import { subjects } from "@repo/auth/subjects"
import { redirect } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import {
	deleteCookie,
	getCookie,
	getRequestHeader,
	setCookie
} from "@tanstack/react-start/server"
import { env } from "@/environment/env"

export const auth = makeAuthClient({
	issuer: env.VITE_AUTH_ISSUER_URL
})

const cookieOptions = getAuthCookieOptions({ secure: env.NODE_ENV === "production" })

export const $login = createServerFn({ method: "POST" }).handler(async () => {
	const accessToken = getCookie("access_token")
	const refreshToken = getCookie("refresh_token")

	if (accessToken) {
		const verified = await auth.verify(subjects, accessToken, {
			refresh: refreshToken
		})

		if (verified.success && verified.data.tokens) {
			setCookie("access_token", verified.data.tokens.access, cookieOptions)
			setCookie("refresh_token", verified.data.tokens.refresh, cookieOptions)

			throw redirect({ to: "/" })
		}
	}

	const host = getRequestHeader("Host")
	const protocol = host?.includes("localhost") ? "http" : "https"
	const result = await auth.authorize(`${protocol}://${host}/auth/callback`, "code")

	if (result.success) {
		throw redirect({ href: result.data.url })
	}

	throw redirect({ to: "/" })
})

export const $logout = createServerFn({ method: "POST" }).handler(async () => {
	const refreshToken = getCookie("refresh_token")

	if (refreshToken) {
		const revoke = await auth.revoke(refreshToken, {
			tokenTypeHint: "refresh_token"
		})

		if (!revoke.success) {
			console.warn("Failed to revoke token on logout:", revoke.error)
		}
	}

	deleteCookie("access_token")
	deleteCookie("refresh_token")

	throw redirect({ to: "/" })
})

export const useAuth = () => {
	const login = useServerFn($login)
	const logout = useServerFn($logout)

	return { login, logout, auth }
}

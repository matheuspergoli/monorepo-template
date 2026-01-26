import { getAuthCookieOptions } from "@repo/auth/cookie"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { setCookie } from "@tanstack/react-start/server"
import { env } from "@/environment/env"
import { ACCESS_TOKEN_NAME, auth, REFRESH_TOKEN_NAME } from "@/libs/auth"

const cookieOptions = getAuthCookieOptions({ secure: env.NODE_ENV === "production" })

export const Route = createFileRoute("/auth/callback")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url)
				const code = url.searchParams.get("code")

				if (!code) {
					return Response.json({ error: "no_code" }, { status: 400 })
				}

				const exchanged = await auth.exchange(code, `${url.origin}/auth/callback`)

				if (!exchanged.success) {
					return Response.json(exchanged.error, { status: 400 })
				}

				setCookie(ACCESS_TOKEN_NAME, exchanged.data.access, cookieOptions)
				setCookie(REFRESH_TOKEN_NAME, exchanged.data.refresh, cookieOptions)

				throw redirect({ to: "/" })
			}
		}
	}
})

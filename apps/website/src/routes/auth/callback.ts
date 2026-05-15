import { createFileRoute, redirect } from "@tanstack/react-router"
import { setCookie } from "@tanstack/react-start/server"
import {
	ACCESS_TOKEN_NAME,
	auth,
	authCookieOptions,
	getAuthCallbackUrl,
	REFRESH_TOKEN_NAME
} from "@/libs/auth"

export const Route = createFileRoute("/auth/callback")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url)
				const code = url.searchParams.get("code")

				if (!code) {
					return Response.json({ error: "no_code" }, { status: 400 })
				}

				const exchanged = await auth.exchange(code, getAuthCallbackUrl(request))

				if (!exchanged.success) {
					return Response.json(exchanged.error, { status: 400 })
				}

				setCookie(ACCESS_TOKEN_NAME, exchanged.data.access, authCookieOptions)
				setCookie(REFRESH_TOKEN_NAME, exchanged.data.refresh, authCookieOptions)

				throw redirect({ to: "/" })
			}
		}
	}
})

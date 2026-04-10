import type { CookieStore } from "@repo/trpc/context"
import type { Context } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

export const createCookieStore = (context: Context): CookieStore => {
	return {
		get: (name) => getCookie(context, name),
		set: (name, value, options) => {
			setCookie(context, name, value, options)
		},
		delete: (name, options) => {
			deleteCookie(context, name, options)
		}
	}
}

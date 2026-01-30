export interface CookieOptions {
	path?: string
	expires?: Date
	domain?: string
	maxAge?: number
	secure?: boolean
	httpOnly?: boolean
	sameSite?: "lax" | "strict" | "none"
}

const COOKIE_NAME_REGEX = /^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/

const capitalize = (value: string) => {
	return value.charAt(0).toUpperCase() + value.slice(1)
}

const parseRequestCookies = (cookieHeader: string | null) => {
	const cookies = new Map<string, string>()
	if (!cookieHeader) return cookies

	for (const part of cookieHeader.split(/;\s*/)) {
		const index = part.indexOf("=")
		if (index === -1) continue

		const name = part.slice(0, index).trim()
		const value = part.slice(index + 1)

		if (!COOKIE_NAME_REGEX.test(name)) continue

		try {
			cookies.set(name, decodeURIComponent(value))
		} catch {
			cookies.set(name, value)
		}
	}

	return cookies
}

const serializeCookie = (name: string, value: string, options: CookieOptions) => {
	if (!COOKIE_NAME_REGEX.test(name)) {
		throw new Error(`Invalid cookie name: ${name}`)
	}

	if (options.sameSite === "none" && !options.secure) {
		throw new Error("SameSite=None requires Secure")
	}

	const parts = [`${name}=${encodeURIComponent(value)}`]

	if (options.secure) parts.push("Secure")
	if (options.httpOnly) parts.push("HttpOnly")
	if (options.path) parts.push(`Path=${options.path}`)
	if (options.domain) parts.push(`Domain=${options.domain}`)
	if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`)
	if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`)
	if (options.sameSite) parts.push(`SameSite=${capitalize(options.sameSite)}`)

	return parts.join("; ")
}

export class Cookies {
	private readonly responseHeaders: Headers
	private readonly requestCookies: Map<string, string>

	constructor(requestHeaders: Headers, responseHeaders?: Headers) {
		this.responseHeaders = responseHeaders ?? new Headers()
		this.requestCookies = parseRequestCookies(requestHeaders.get("cookie"))
	}

	get(name: string) {
		return this.requestCookies.get(name)
	}

	has(name: string) {
		return this.requestCookies.has(name)
	}

	getAll() {
		return this.requestCookies
	}

	set(name: string, value: string, options: CookieOptions = {}) {
		const serialized = serializeCookie(name, value, options)
		this.responseHeaders.append("Set-Cookie", serialized)
	}

	delete(name: string, options: Pick<CookieOptions, "path" | "domain"> = {}) {
		this.set(name, "", {
			...options,
			maxAge: 0,
			expires: new Date(0)
		})
	}

	applyTo(headers: Headers) {
		for (const [key, value] of this.responseHeaders) {
			headers.append(key, value)
		}
	}

	toHeaders() {
		return new Headers(this.responseHeaders)
	}
}

export interface CookieOptions {
	path?: string
	expires?: Date
	domain?: string
	maxAge?: number
	secure?: boolean
	httpOnly?: boolean
	sameSite?: "lax" | "strict" | "none"
}

export interface CookieStore {
	get(name: string): string | undefined
	set(name: string, value: string, options?: CookieOptions): void
	delete(name: string, options?: Pick<CookieOptions, "path" | "domain">): void
}

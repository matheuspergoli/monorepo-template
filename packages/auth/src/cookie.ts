export const getAuthCookieOptions = ({ secure }: { secure: boolean }) => {
	return {
		secure,
		path: "/",
		httpOnly: true,
		sameSite: "lax" as const,
		maxAge: 60 * 60 * 24 * 7
	}
}

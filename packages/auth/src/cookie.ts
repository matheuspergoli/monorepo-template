export const getAuthCookieOptions = ({
	secure,
	domain
}: {
	secure: boolean
	domain?: string
}) => {
	return {
		secure,
		domain,
		path: "/",
		httpOnly: true,
		sameSite: "lax" as const,
		maxAge: 60 * 60 * 24 * 7
	}
}

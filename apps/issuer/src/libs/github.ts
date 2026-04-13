import { z } from "zod"

const GithubUser = z.object({
	name: z.string(),
	avatar_url: z.string(),
	email: z.email().nullable(),
	id: z.number().transform((arg) => String(arg))
})

export const getGithubUser = async ({ accessToken }: { accessToken: string }) => {
	const [userResponse, emailsResponse] = await Promise.all([
		fetch("https://api.github.com/user", {
			headers: { Authorization: `Bearer ${accessToken}` }
		}),
		fetch("https://api.github.com/user/emails", {
			headers: { Authorization: `token ${accessToken}` }
		})
	])

	const [unparsedUser, emails] = await Promise.all([
		userResponse.json(),
		emailsResponse.json() as Promise<{ email: string; primary: boolean }[]>
	])

	const parsed = GithubUser.safeParse(unparsedUser)
	if (!parsed.success) {
		throw new Error("Error parsing github user")
	}

	const primaryEmail = emails.find((e) => e.primary)?.email

	if (!parsed.data.email && !primaryEmail) {
		throw new Error("Primary email not found")
	}

	const email = (parsed.data.email ?? primaryEmail) as string

	return { ...parsed.data, email }
}

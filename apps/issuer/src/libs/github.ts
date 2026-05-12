import { z } from "zod"

const GithubUser = z.object({
	name: z.string(),
	avatar_url: z.string(),
	email: z.email().nullable(),
	id: z.number().transform((arg) => String(arg))
})

const GithubEmails = z.array(
	z.object({
		email: z.email(),
		primary: z.boolean()
	})
)

const REQUEST_TIMEOUT_MS = 10_000

const assertGithubResponse = async (response: Response, resource: string) => {
	if (response.ok) {
		return
	}

	throw new Error(`GitHub request failed for ${resource} with status ${response.status}`)
}

export const getGithubUser = async ({ accessToken }: { accessToken: string }) => {
	const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)

	const [userResponse, emailsResponse] = await Promise.all([
		fetch("https://api.github.com/user", {
			headers: { Authorization: `Bearer ${accessToken}` },
			signal
		}),
		fetch("https://api.github.com/user/emails", {
			headers: { Authorization: `token ${accessToken}` },
			signal
		})
	])

	await Promise.all([
		assertGithubResponse(userResponse, "user"),
		assertGithubResponse(emailsResponse, "user/emails")
	])

	const [unparsedUser, emails] = await Promise.all([
		userResponse.json(),
		emailsResponse.json()
	])

	const parsed = GithubUser.safeParse(unparsedUser)
	if (!parsed.success) {
		throw new Error("Error parsing github user")
	}

	const parsedEmails = GithubEmails.safeParse(emails)
	if (!parsedEmails.success) {
		throw new Error("Error parsing github emails")
	}

	const primaryEmail = parsedEmails.data.find((email) => email.primary)?.email

	if (!parsed.data.email && !primaryEmail) {
		throw new Error("Primary email not found")
	}

	const email = (parsed.data.email ?? primaryEmail) as string

	return { ...parsed.data, email }
}

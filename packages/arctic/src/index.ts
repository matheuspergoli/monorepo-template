import { env } from "@repo/env/arctic"
import {
	generateCodeVerifier,
	generateState,
	GitHub,
	Google,
	OAuth2RequestError
} from "arctic"

import { getBaseUrl } from "./utils"

export { generateState, OAuth2RequestError, generateCodeVerifier }

export const github = new GitHub(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET)

export const google = new Google(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	`${getBaseUrl()}/login/google/callback`
)

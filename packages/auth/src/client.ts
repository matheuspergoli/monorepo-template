import { type ClientInput, createClient } from "@draftlab/auth/client"

interface AuthClientConfig {
	fetch?: ClientInput["fetch"]
	issuer: ClientInput["issuer"]
	clientID?: ClientInput["clientID"]
}

export const makeAuthClient = (config: AuthClientConfig) => {
	return createClient({
		fetch: config.fetch,
		issuer: config.issuer,
		clientID: config.clientID ?? "monorepo-app"
	})
}

export type AuthClient = ReturnType<typeof makeAuthClient>

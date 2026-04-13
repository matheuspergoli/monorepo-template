import { issuer } from "@repo/auth/issuer"
import { GithubProvider } from "@repo/auth/providers/github"
import { UnStorage } from "@repo/auth/storages/unstorage"
import { subjects } from "@repo/auth/subjects"
import { env } from "@/environment/env"
import { driver } from "@/libs/storage"
import { getGithubUser } from "./github"

export const auth = issuer({
	subjects,
	theme: {
		font: {
			family: "sans-serif"
		},
		radius: "none",
		title: "Monorepo Template",
		background: {
			dark: "black",
			light: "white"
		},
		primary: {
			dark: "white",
			light: "black"
		}
	},
	ttl: {
		reuse: 60,
		access: 3600,
		refresh: 604800,
		retention: 1209600
	},
	storage: UnStorage({ driver }),
	providers: {
		github: GithubProvider({
			scopes: ["user:email", "read:user"],
			clientID: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET
		})
	},
	success: async (ctx, value) => {
		if (value.provider !== "github") throw new Error("Unknown provider")

		const user = await getGithubUser({ accessToken: value.tokenset.access })

		return ctx.subject("user", {
			id: user.id,
			email: user.email
		})
	}
})

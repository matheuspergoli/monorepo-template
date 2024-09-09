import { type AppRouter } from "@repo/api-client"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import { createTRPCQueryUtils } from "@trpc/react-query"

import { api, queryClient } from "@/libs/trpc"
import { ActiveLink } from "@/shared/components/active-link"
import { OAuthLoginButton } from "@/shared/components/oauth-login-button"

export const Route = createRootRouteWithContext<{
	api: typeof api
	queryClient: typeof queryClient
	trpcQueryUtils: ReturnType<typeof createTRPCQueryUtils<AppRouter>>
}>()({
	component: () => {
		return (
			<main>
				<nav className="flex gap-2 p-2">
					<ActiveLink to="/">Home</ActiveLink>
					<ActiveLink to="/about">About</ActiveLink>
					<OAuthLoginButton provider="github">Login with github</OAuthLoginButton>
					<OAuthLoginButton provider="google">Login with google</OAuthLoginButton>
				</nav>
				<hr />
				<Outlet />
				<TanStackRouterDevtools />
			</main>
		)
	}
})

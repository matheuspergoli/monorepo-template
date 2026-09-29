import type { QueryKey } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { routerWithDbClient } from "@tanstack/react-router-with-db"
import { routeTree } from "@/routeTree.gen"
import { DefaultCatchBoundary } from "@/shared/components/default-catch-boundary"
import { DefaultNotFound } from "@/shared/components/default-not-found"
import { createDbClient } from "./libs/db"
import { getQueryClient } from "./libs/query"
import { DefaultPending } from "./shared/components/default-pending"

export const getRouter = () => {
	const queryClient = getQueryClient()
	const dbClient = createDbClient(queryClient)

	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		context: { dbClient, queryClient },
		scrollRestorationBehavior: "smooth",
		defaultHashScrollIntoView: { behavior: "smooth" },
		defaultPendingComponent: () => <DefaultPending />,
		defaultNotFoundComponent: () => <DefaultNotFound />,
		defaultErrorComponent: (error) => <DefaultCatchBoundary {...error} />
	})

	setupRouterSsrQueryIntegration({ router, queryClient })

	return routerWithDbClient(router, dbClient)
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}

declare module "@tanstack/react-query" {
	interface Register {
		mutationMeta: {
			invalidates?: Array<QueryKey>
		}
	}
}

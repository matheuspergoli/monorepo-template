import { QueryClientProvider, type QueryKey } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { routeTree } from "@/routeTree.gen"
import { DefaultCatchBoundary } from "@/shared/components/default-catch-boundary"
import { DefaultNotFound } from "@/shared/components/default-not-found"
import { getQueryClient } from "./libs/query"
import { DefaultPending } from "./shared/components/default-pending"

export const getRouter = () => {
	const queryClient = getQueryClient()

	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		context: { queryClient },
		defaultPreloadStaleTime: 0,
		scrollRestorationBehavior: "smooth",
		defaultHashScrollIntoView: { behavior: "smooth" },
		defaultPendingComponent: () => <DefaultPending />,
		defaultNotFoundComponent: () => <DefaultNotFound />,
		defaultErrorComponent: (error) => <DefaultCatchBoundary {...error} />,
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)
	})

	setupRouterSsrQueryIntegration({ router, queryClient })

	return router
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

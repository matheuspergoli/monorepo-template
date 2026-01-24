import { toast } from "@repo/ui/components/sonner"
import type { Query } from "@tanstack/react-query"
import { MutationCache, matchQuery, QueryCache, QueryClient } from "@tanstack/react-query"
import SuperJSON from "superjson"

const makeQueryClient = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				refetchOnMount: false,
				refetchOnWindowFocus: false,
				staleTime: Number.POSITIVE_INFINITY
			},
			dehydrate: { serializeData: SuperJSON.serialize },
			hydrate: { deserializeData: SuperJSON.deserialize }
		},
		queryCache: new QueryCache({
			onError: (error, query) => {
				if (query.state.data !== undefined) {
					toast.error(error.message, {
						action: {
							label: "Tentar novamente",
							onClick: () => {
								query.fetch()
							}
						}
					})
				}
			}
		}),
		mutationCache: new MutationCache({
			onSuccess: (_data, _variables, _context, mutation) => {
				queryClient.invalidateQueries({
					predicate: (query: Query) => {
						return (
							mutation.meta?.invalidates?.some((queryKey) => {
								return matchQuery({ queryKey }, query)
							}) ?? true
						)
					}
				})
			},
			onError: (error) => {
				toast.error(error.message, {
					action: {
						label: "Tentar novamente",
						onClick: () => {
							queryClient.invalidateQueries()
						}
					}
				})
			}
		})
	})

	return queryClient
}

let browserQueryClient: QueryClient | undefined

export const getQueryClient = () => {
	if (typeof window === "undefined") {
		return makeQueryClient()
	}

	if (!browserQueryClient) {
		browserQueryClient = makeQueryClient()
	}

	return browserQueryClient
}

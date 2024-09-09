import { QueryClientProvider } from "@tanstack/react-query"

import { api, queryClient, trpcClient } from "@/libs/trpc"

export { type RouterInputs, type RouterOutputs } from "@repo/api-client"

export function TRPCProvider(props: { children: React.ReactNode }) {
	return (
		<api.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
		</api.Provider>
	)
}

import { createFileRoute } from "@tanstack/react-router"

import { api } from "@/libs/trpc"
import { run } from "@/libs/utils"

export const Route = createFileRoute("/")({
	component: Index,
	loader: async ({ context: { trpcQueryUtils } }) => {
		await trpcQueryUtils.example.message.ensureData({ from: "Home" })
	}
})

function Index() {
	const { data, isLoading, isError } = api.example.message.useQuery({ from: "Home" })

	return (
		<section className="p-2">
			{run(() => {
				if (isLoading) {
					return <p>Loading...</p>
				}

				if (isError) {
					return <p>Error</p>
				}

				return <h3>{data}</h3>
			})}
		</section>
	)
}

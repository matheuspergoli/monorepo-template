import { createFileRoute } from "@tanstack/react-router"

import { api } from "@/libs/trpc"
import { run } from "@/libs/utils"

export const Route = createFileRoute("/about")({
	component: About,
	loader: async ({ context: { trpcQueryUtils } }) => {
		await trpcQueryUtils.example.message.ensureData({ from: "About" })
	}
})

function About() {
	const { data, isLoading, isError } = api.example.message.useQuery({ from: "About" })

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

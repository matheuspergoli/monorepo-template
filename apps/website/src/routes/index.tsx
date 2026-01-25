import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<main className="flex h-screen w-screen items-center justify-center">
			<h1>Hello World!</h1>
		</main>
	)
}

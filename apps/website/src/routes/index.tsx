import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<main
			className="flex h-screen w-screen items-center justify-center"
			style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
		>
			<h1>Hello World!</h1>
		</main>
	)
}

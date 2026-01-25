import { Button } from "@repo/ui/components/button"
import { createFileRoute } from "@tanstack/react-router"
import { useAuth } from "@/libs/auth"

export const Route = createFileRoute("/")({
	component: RouteComponent
})

function RouteComponent() {
	const { login } = useAuth()

	return (
		<main className="flex h-screen w-screen items-center justify-center">
			<h1>Hello World!</h1>

			<Button onClick={async () => await login()}>Login</Button>
		</main>
	)
}

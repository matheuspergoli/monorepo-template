import { Button } from "@repo/ui/components/button"
import { createFileRoute } from "@tanstack/react-router"
import { useAuth } from "@/libs/auth"

export const Route = createFileRoute("/")({
	component: RouteComponent
})

function RouteComponent() {
	const { login, logout } = useAuth()

	return (
		<main className="flex h-screen w-screen items-center justify-center">
			<Button onClick={async () => await login()}>Login</Button>
			<Button onClick={async () => await logout()}>Logout</Button>
		</main>
	)
}

import { Button } from "@repo/ui/components/button"
import { IconArrowLeft, IconHome, IconRefresh } from "@tabler/icons-react"
import {
	type ErrorComponentProps,
	Link,
	rootRouteId,
	useMatch,
	useRouter
} from "@tanstack/react-router"

export const DefaultCatchBoundary = ({ error }: ErrorComponentProps) => {
	const router = useRouter()
	const isRoot = useMatch({
		strict: false,
		select: (state) => state.id === rootRouteId
	})

	const errorMessage = error?.message || "Ocorreu um erro inesperado"

	return (
		<div className="flex min-h-100 w-full flex-col items-center justify-center gap-6 bg-background p-8 text-center">
			<div className="max-w-md space-y-4">
				<div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
					<svg
						className="h-8 w-8"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>image</title>
						<path
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
						/>
					</svg>
				</div>
				<h2 className="font-bold text-2xl">Ops...</h2>
				<p>{errorMessage}</p>

				{error?.stack && import.meta.env.DEV && (
					<div className="mt-4 overflow-x-auto rounded-md bg-gray-100 p-4 text-left">
						<pre className="whitespace-pre-wrap text-red-600 text-xs">{error.stack}</pre>
					</div>
				)}
			</div>

			<div className="mt-2 flex flex-wrap items-center justify-center gap-3">
				<Button
					className="flex items-center gap-2"
					onClick={() => void router.invalidate()}
					variant="default"
				>
					<IconRefresh className="h-4 w-4" />
					<span>Tentar novamente</span>
				</Button>

				{isRoot ? (
					<Button className="flex items-center gap-2" variant="outline">
						<Link to="/">
							<IconHome className="h-4 w-4" />
							<span>Página inicial</span>
						</Link>
					</Button>
				) : (
					<Button className="flex items-center gap-2" variant="outline">
						<Link
							onClick={(e) => {
								e.preventDefault()
								window.history.back()
							}}
							to="/"
						>
							<IconArrowLeft className="h-4 w-4" />
							<span>Voltar</span>
						</Link>
					</Button>
				)}
			</div>
		</div>
	)
}

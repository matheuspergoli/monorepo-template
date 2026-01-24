import { Button } from "@repo/ui/components/button"
import { IconAlertTriangle, IconArrowLeft, IconHome, IconRefresh } from "@tabler/icons-react"
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
		<div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background p-8 text-center">
			<div className="max-w-md space-y-4">
				<div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
					<IconAlertTriangle className="h-8 w-8" aria-label="Ícone de erro" />
				</div>
				<h2 className="font-bold text-2xl tracking-tight">Ops...</h2>
				<p className="text-muted-foreground">{errorMessage}</p>

				{error?.stack && import.meta.env.DEV && (
					<div className="mt-4 overflow-x-auto rounded-md border bg-muted p-4 text-left">
						<pre className="whitespace-pre-wrap text-destructive text-xs">{error.stack}</pre>
					</div>
				)}
			</div>

			<div className="mt-2 flex flex-wrap items-center justify-center gap-3">
				<Button
					className="flex cursor-pointer items-center gap-2"
					onClick={() => void router.invalidate()}
					variant="default"
				>
					<IconRefresh className="h-4 w-4" aria-hidden="true" />
					<span>Tentar novamente</span>
				</Button>

				{isRoot ? (
					<Button
						className="flex items-center gap-2"
						variant="outline"
						render={<Link to="/" />}
					>
						<IconHome className="h-4 w-4" aria-hidden="true" />
						<span>Página inicial</span>
					</Button>
				) : (
					<Button
						className="flex items-center gap-2"
						variant="outline"
						render={<Link to="/" />}
						onClick={(e) => {
							e.preventDefault()
							window.history.back()
						}}
					>
						<IconArrowLeft className="h-4 w-4" aria-hidden="true" />
						<span>Voltar</span>
					</Button>
				)}
			</div>
		</div>
	)
}

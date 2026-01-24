import { Button } from "@repo/ui/components/button"
import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

export const DefaultNotFound = ({ children }: { children?: ReactNode }) => (
	<main className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background">
		<div className="text-muted-foreground">
			{children ?? <p>A página que você estava procurando não existe.</p>}
		</div>
		<nav aria-label="Navegação de erro">
			<Button render={<Link to="/" />}>Página inicial</Button>
		</nav>
	</main>
)

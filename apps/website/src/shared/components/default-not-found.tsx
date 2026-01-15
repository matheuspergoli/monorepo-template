import { Button } from "@repo/ui/components/button"
import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

export const DefaultNotFound = ({ children }: { children?: ReactNode }) => (
	<main className="flex h-screen w-screen flex-col items-center justify-center gap-3">
		<div className="text-gray-600 dark:text-gray-400">
			{children ?? <p>A página que você estava procurando não existe.</p>}
		</div>
		<nav className="flex flex-wrap items-center gap-2" aria-label="Navegação de erro">
			<Button onClick={() => window.history.back()}>Voltar</Button>
			<Button render={<Link to="/" />}>Página inicial</Button>
		</nav>
	</main>
)

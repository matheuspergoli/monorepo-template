import { Toaster } from "@repo/ui/components/sonner"
import { getThemeScript, ThemeProvider } from "@repo/ui/components/theming"
import type { QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import type { ReactNode } from "react"
import css from "@/styles/index.css?url"

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient
}>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8"
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				title: "Monorepo Template"
			}
		],
		scripts: [{ children: getThemeScript() }],
		links: [
			{ rel: "stylesheet", href: css },
			{ rel: "icon", href: "/favicon.svg" }
		]
	}),
	shellComponent: RootDocument
})

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					{children}
					<Toaster />
					<TanStackRouterDevtools position="bottom-left" />
					<ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	)
}

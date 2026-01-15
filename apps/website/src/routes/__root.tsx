import { Toaster } from "@repo/ui/components/sonner"
import { getThemeScript, ThemeProvider } from "@repo/ui/components/theming"
import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
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
			},
			{
				name: "theme-color",
				content: "#ffffff",
				media: "(prefers-color-scheme: light)"
			},
			{
				name: "theme-color",
				content: "#0a0a0a",
				media: "(prefers-color-scheme: dark)"
			},
			{
				name: "color-scheme",
				content: "light dark"
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
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	)
}

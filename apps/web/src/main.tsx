import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./styles/globals.css"

import { App } from "./app"
import { router } from "./router"

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>
)

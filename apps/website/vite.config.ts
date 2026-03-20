import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	server: {
		port: 5000
	},
	resolve: {
		tsconfigPaths: true
	},
	plugins: [
		tailwindcss(),
		tanstackStart({
			router: {
				quoteStyle: "double",
				routeToken: "layout"
			}
		}),
		viteReact()
	]
})

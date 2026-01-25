import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import tsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	server: {
		port: 5000
	},
	plugins: [
		tailwindcss(),
		tsConfigPaths(),
		tanstackStart({
			router: {
				quoteStyle: "double",
				routeToken: "layout"
			}
		}),
		nitro({ output: { dir: "dist" } }),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"]
			}
		})
	]
})

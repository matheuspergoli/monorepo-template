import baseConfig from "@repo/tailwind-config/web"
import type { Config } from "tailwindcss"

export default {
	content: ["./src/**/*.tsx"],
	presets: [baseConfig]
} satisfies Config

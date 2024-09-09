import baseConfig from "@repo/tailwind-config/web"
import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

export default {
	content: [...baseConfig.content, "../../packages/ui/**/*.{ts,tsx}"],
	presets: [baseConfig],
	theme: {
		extend: {
			fontFamily: {
				sans: [...fontFamily.sans],
				mono: [...fontFamily.mono]
			}
		}
	}
} satisfies Config

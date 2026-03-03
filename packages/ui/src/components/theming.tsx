import React from "react"
import { z } from "zod"
import { type BaseTheme, baseThemes } from "#src/libs/themes"

const ColorModeSchema = z.enum(["dark", "light", "system"])
const ThemeNameSchema = z.enum(["default", ...baseThemes.slice(1).map((c) => c.name)] as const)

export type ThemeName = BaseTheme["name"]
export type ColorMode = z.infer<typeof ColorModeSchema>
export type ResolvedColorMode = Exclude<ColorMode, "system">

interface ThemeProviderProps {
	children: React.ReactNode
}

interface ThemeContextValue {
	theme: ThemeName
	colorMode: ColorMode
	resolvedColorMode: ResolvedColorMode
	setTheme: (theme: ThemeName) => void
	setColorMode: (mode: ColorMode) => void
	toggleColorMode: () => void
}

const THEME_STORAGE_KEY = "app-theme"
const COLOR_MODE_STORAGE_KEY = "app-color-mode"

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

const getSystemColorMode = (): ResolvedColorMode => {
	if (typeof window === "undefined") return "dark"
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

const getStoredTheme = (): ThemeName => {
	if (typeof window === "undefined") return "default"
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY)
		return ThemeNameSchema.parse(stored)
	} catch {
		return "default"
	}
}

const getStoredColorMode = (): ColorMode => {
	if (typeof window === "undefined") return "system"
	try {
		const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY)
		return ColorModeSchema.parse(stored)
	} catch {
		return "system"
	}
}

const setStoredTheme = (theme: ThemeName) => {
	const parsed = ThemeNameSchema.parse(theme)
	localStorage.setItem(THEME_STORAGE_KEY, parsed)
}

const setStoredColorMode = (mode: ColorMode) => {
	const parsed = ColorModeSchema.parse(mode)
	localStorage.setItem(COLOR_MODE_STORAGE_KEY, parsed)
}

const updateColorModeClass = (colorMode: ColorMode) => {
	const root = document.documentElement
	root.classList.remove("light", "dark")
	const resolved = colorMode === "system" ? getSystemColorMode() : colorMode
	root.classList.add(resolved)
}

const updateThemeClass = (theme: ThemeName) => {
	const body = document.body
	for (const className of Array.from(body.classList)) {
		if (className.startsWith("theme-")) body.classList.remove(className)
	}
	body.classList.add(`theme-${theme}`)
	if (theme.endsWith("-scaled")) body.classList.add("theme-scaled")
}

const setupSystemPreferenceListener = () => {
	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
	const handler = () => updateColorModeClass("system")
	mediaQuery.addEventListener("change", handler)
	return () => mediaQuery.removeEventListener("change", handler)
}

const getNextColorMode = (current: ColorMode): ColorMode => {
	const forDark: ColorMode[] = ["system", "light", "dark"]
	const forLight: ColorMode[] = ["system", "dark", "light"]
	const modes = getSystemColorMode() === "dark" ? forDark : forLight
	return modes[(modes.indexOf(current) + 1) % modes.length] ?? "system"
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	const [theme, setThemeState] = React.useState(getStoredTheme)
	const [colorMode, setColorModeState] = React.useState(getStoredColorMode)

	React.useEffect(() => {
		if (colorMode !== "system") return
		return setupSystemPreferenceListener()
	}, [colorMode])

	const resolvedColorMode = colorMode === "system" ? getSystemColorMode() : colorMode

	const setColorMode = React.useCallback((mode: ColorMode) => {
		setColorModeState(mode)
		setStoredColorMode(mode)
		updateColorModeClass(mode)
	}, [])

	const setTheme = React.useCallback((newTheme: ThemeName) => {
		setThemeState(newTheme)
		setStoredTheme(newTheme)
		updateThemeClass(newTheme)
	}, [])

	const toggleColorMode = React.useCallback(() => {
		setColorMode(getNextColorMode(colorMode))
	}, [colorMode, setColorMode])

	const value = React.useMemo(
		() => ({
			colorMode,
			resolvedColorMode,
			setColorMode,
			theme,
			setTheme,
			toggleColorMode
		}),
		[colorMode, resolvedColorMode, setColorMode, theme, setTheme, toggleColorMode]
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const getThemeScript = () => {
	const validThemes = baseThemes.map((c) => c.name)

	const script = (themes: string[]) => {
		const isValidColorMode = (mode: string): mode is ColorMode => {
			const validModes = ["light", "dark", "system"] as const
			return validModes.includes(mode as ColorMode)
		}

		const isValidTheme = (theme: string) => themes.includes(theme)

		const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
		const storedColorMode = localStorage.getItem("app-color-mode") ?? "system"
		const validColorMode = isValidColorMode(storedColorMode) ? storedColorMode : "system"

		const systemMode = prefersDarkMode ? "dark" : "light"
		const effectiveMode = validColorMode === "system" ? systemMode : validColorMode

		document.documentElement.classList.add(effectiveMode)

		const storedTheme = localStorage.getItem("app-theme") ?? "default"
		const validTheme = isValidTheme(storedTheme) ? storedTheme : "default"

		document.body?.classList.add(`theme-${validTheme}`)
		if (validTheme.endsWith("-scaled")) document.body.classList.add("theme-scaled")
	}

	return `(${script.toString()})(${JSON.stringify(validThemes)})`
}

export const useTheme = () => {
	const context = React.useContext(ThemeContext)

	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider")
	}

	return context
}

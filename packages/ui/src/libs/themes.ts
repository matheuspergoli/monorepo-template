export const baseThemes = [
	{
		name: "claude",
		label: "Claude"
	},
	{
		name: "default",
		label: "Standard"
	},
	{
		name: "caffeine",
		label: "Caffeine"
	},
	{
		name: "perpetuity",
		label: "Perpetuity"
	},
	{
		name: "cosmic-night",
		label: "Cosmic Night"
	},
	{
		name: "retro-arcade",
		label: "Retro Arcade"
	},
	{
		name: "kodama-grove",
		label: "Kodama Grove"
	},
	{
		name: "claymorphism",
		label: "Claymorphism"
	},
	{
		name: "vintage-paper",
		label: "Vintage Paper"
	},
	{
		name: "modern-minimal",
		label: "Modern Minimal"
	}
] as const

export type BaseTheme = (typeof baseThemes)[number]

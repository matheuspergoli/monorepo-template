import {
	IconAlertOctagon,
	IconAlertTriangle,
	IconCircleCheck,
	IconInfoCircle,
	IconLoader
} from "@tabler/icons-react"
import { Toaster as Sonner, type ToasterProps, toast } from "sonner"
import { useTheme } from "./theming"

const Toaster = ({ ...props }: ToasterProps) => {
	const { colorMode } = useTheme()

	return (
		<Sonner
			theme={colorMode}
			className="toaster group"
			icons={{
				info: <IconInfoCircle className="size-4" />,
				error: <IconAlertOctagon className="size-4" />,
				success: <IconCircleCheck className="size-4" />,
				warning: <IconAlertTriangle className="size-4" />,
				loading: <IconLoader className="size-4 animate-spin" />
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--border-radius": "var(--radius)",
					"--normal-border": "var(--border)",
					"--normal-text": "var(--popover-foreground)"
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: "cn-toast"
				}
			}}
			{...props}
		/>
	)
}

export { Toaster, toast }

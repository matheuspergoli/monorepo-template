import { env } from "@repo/env/web"
import { cn } from "@repo/ui"
import { buttonVariants } from "@repo/ui/button"

interface OAuthLoginButtonProps {
	children: React.ReactNode
	provider: "github" | "google"
}

export const OAuthLoginButton = (props: OAuthLoginButtonProps) => {
	const { children, provider } = props

	return (
		<a href={`${env.VITE_API_URL}/login/${provider}`} className={cn(buttonVariants())}>
			{children}
		</a>
	)
}

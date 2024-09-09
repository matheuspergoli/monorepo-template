import React from "react"

import { cn } from "@repo/ui"
import { buttonVariants, type ButtonProps } from "@repo/ui/button"
import { Link, useRouterState, type LinkProps } from "@tanstack/react-router"

interface ActiveLinkProps extends LinkProps {
	className?: string
}

export const ActiveLink = React.forwardRef<HTMLAnchorElement, ActiveLinkProps>(
	(props, ref) => {
		const { className, to } = props

		const {
			location: { pathname }
		} = useRouterState()

		const isActive = pathname === to?.toString()
		const variant: ButtonProps["variant"] = isActive ? "default" : "ghost"

		return (
			<Link {...props} ref={ref} className={cn(buttonVariants({ variant }), className)} />
		)
	}
)
ActiveLink.displayName = "ActiveLink"

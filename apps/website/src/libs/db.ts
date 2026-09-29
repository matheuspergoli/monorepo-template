import { DbClient } from "@tanstack/db"
import type { QueryClient } from "@tanstack/react-query"
import { trpc } from "./trpc"

export const createDbClient = (queryClient: QueryClient) => {
	return new DbClient({
		trpc,
		queryClient,
		runtime: typeof window === "undefined" ? "server" : "browser"
	})
}

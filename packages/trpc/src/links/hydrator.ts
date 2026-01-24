import { hydrateDeep } from "@repo/result/hydrate"
import type { TRPCLink } from "@trpc/client"
import { observable } from "@trpc/server/observable"
import type { AppRouter } from "@/root"

export const hydratorLink: TRPCLink<AppRouter> = () => {
	return ({ next, op }) => {
		return observable((observer) => {
			const unsubscribe = next(op).subscribe({
				next(value) {
					if (value.result?.type === "data" && "data" in value.result) {
						observer.next({
							...value,
							result: {
								...value.result,
								data: hydrateDeep(value.result.data)
							}
						})
					} else {
						observer.next(value)
					}
				},
				error(err) {
					observer.error(err)
				},
				complete() {
					observer.complete()
				}
			})

			return unsubscribe
		})
	}
}

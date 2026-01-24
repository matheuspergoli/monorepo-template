import { err, ok, type Result } from "./result"

export type Serialized<T> = T extends (...args: unknown[]) => unknown
	? never
	: T extends object
		? {
				[K in keyof T as K extends symbol
					? never
					: T[K] extends (...args: unknown[]) => unknown
						? never
						: K]: Serialized<T[K]>
			}
		: T

export type PlainResult<A, E> =
	| { kind: "Ok"; value: A; isOk: true; isErr: false }
	| { kind: "Err"; error: E; isOk: false; isErr: true }

export const hydrate = <A, E>(plain: PlainResult<A, E>): Result<A, E> => {
	if (plain.kind === "Ok") {
		return ok(plain.value)
	}

	return err(plain.error)
}

const isPlainResult = (value: unknown): value is PlainResult<unknown, unknown> => {
	if (typeof value !== "object" || value === null) {
		return false
	}

	const obj = value as Record<string, unknown>

	if (obj.kind === "Ok" && obj.isOk === true && obj.isErr === false && "value" in obj) {
		return true
	}

	if (obj.kind === "Err" && obj.isOk === false && obj.isErr === true && "error" in obj) {
		return true
	}

	return false
}

export const hydrateDeep = <T>(value: T): T => {
	if (isPlainResult(value)) {
		return hydrate(value) as T
	}

	if (Array.isArray(value)) {
		return value.map(hydrateDeep) as T
	}

	if (typeof value === "object" && value !== null) {
		const result: Record<string, unknown> = {}
		for (const [key, val] of Object.entries(value)) {
			result[key] = hydrateDeep(val)
		}
		return result as T
	}

	return value
}

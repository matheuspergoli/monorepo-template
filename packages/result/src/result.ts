export type Ok<A> = Readonly<{
	value: A
	kind: "Ok"

	readonly isOk: true
	readonly isErr: false

	unwrap(): A

	tap(fn: (a: A) => void): Ok<A>

	map<B>(fn: (_: A) => B): Ok<B>

	bind<B, E>(fn: (_: A) => Result<B, E>): Result<B, E>

	match<B>(obj: { ok: (_: A) => B; err: (_: never) => B }): B
}>

export type Err<E> = Readonly<{
	error: E
	kind: "Err"

	readonly isOk: false
	readonly isErr: true

	unwrap(): never

	tap(_: (a: never) => void): Err<E>

	map<B>(fn: (_: never) => B): Err<E>

	bind<B>(fn: (_: never) => Result<B, E>): Err<E>

	match<B>(fn: { ok: (_: never) => B; err: (_: E) => B }): B
}>

export type Result<O, E> = Ok<O> | Err<E>

export const ok = <A>(a: A): Ok<A> => {
	return {
		value: a,
		kind: "Ok",

		isOk: true,
		isErr: false,

		unwrap() {
			return a
		},

		tap(fn) {
			fn(a)
			return this
		},

		map(fn) {
			return ok(fn(a))
		},

		bind(fn) {
			return fn(a)
		},

		match(obj) {
			return obj.ok(a)
		}
	}
}

export const err = <E>(e: E): Err<E> => {
	const self: Err<E> = {
		error: e,
		kind: "Err",

		isOk: false,
		isErr: true,

		unwrap() {
			throw e
		},

		tap() {
			return self
		},

		map() {
			return self
		},

		bind() {
			return self
		},

		match(obj) {
			return obj.err(e)
		}
	}

	return self
}

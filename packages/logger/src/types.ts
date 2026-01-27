export type LogLevel = "info" | "error"

export interface EnvironmentContext {
	service: string
	version: string
	region?: string
	commit_hash?: string
	deployment_id?: string
	node_env: "development" | "production" | "test"
}

export interface RequestContext {
	path: string
	method: string
	timestamp: string
	request_id: string
}

export interface ErrorContext {
	type: string
	code?: string
	stack?: string
	message: string
	retriable?: boolean
}

export interface BusinessContext {
	[key: string]: unknown
}

export type WideEvent = EnvironmentContext &
	RequestContext & {
		status_code?: number
		duration_ms?: number
		error?: ErrorContext
		outcome?: "success" | "error"
	} & BusinessContext

export interface LoggerConfig {
	service: string
	version: string
	region?: string
	commit_hash?: string
	deployment_id?: string
	node_env: "development" | "production" | "test"
	sampling?: {
		errorRate: number
		defaultRate: number
		slowRequestThresholdMs: number
	}
}

export interface Logger {
	info(event: Omit<WideEvent, keyof EnvironmentContext>): void
	error(event: Omit<WideEvent, keyof EnvironmentContext>): void
	addContext(context: BusinessContext): void
	isolate<T>(options: { context?: BusinessContext; fn: () => T | Promise<T> }): Promise<T>
}

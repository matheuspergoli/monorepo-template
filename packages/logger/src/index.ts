import { AsyncLocalStorage } from "node:async_hooks"
import { nanoid } from "nanoid"
import pino from "pino"
import type {
	BusinessContext,
	EnvironmentContext,
	ErrorContext,
	Logger,
	LoggerConfig,
	LogLevel,
	RequestContext,
	WideEvent
} from "./types"

const asyncLocalStorage = new AsyncLocalStorage<BusinessContext>()

const DEFAULT_SAMPLING = {
	errorRate: 1.0,
	defaultRate: 1.0,
	slowRequestThresholdMs: 2000
}

const getCommitHash = (): string | undefined => {
	try {
		const result = Bun.spawnSync({
			stdout: "pipe",
			stderr: "pipe",
			cmd: ["git", "rev-parse", "HEAD"]
		})
		return result.stdout.toString().trim() || undefined
	} catch {
		return undefined
	}
}

const shouldSample = (event: WideEvent, config: LoggerConfig): boolean => {
	const sampling = config.sampling ?? DEFAULT_SAMPLING

	if (event.outcome === "error" || (event.status_code && event.status_code >= 500)) {
		return Math.random() < sampling.errorRate
	}

	if (event.duration_ms && event.duration_ms > sampling.slowRequestThresholdMs) {
		return true
	}

	return Math.random() < sampling.defaultRate
}

const createLogger = (config: LoggerConfig): Logger => {
	const env: EnvironmentContext = {
		region: config.region,
		service: config.service,
		version: config.version,
		node_env: config.node_env,
		deployment_id: config.deployment_id,
		commit_hash: config.commit_hash ?? getCommitHash()
	}

	const configDev = {
		level: "debug",
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				ignore: "pid,hostname",
				translateTime: "HH:MM:ss Z"
			}
		}
	}

	const configProd = {
		level: "info"
	}

	const isProd = config.node_env === "production"

	const pinoLogger = pino(isProd ? configProd : configDev)

	const log = (
		level: LogLevel,
		partialEvent: Omit<WideEvent, keyof EnvironmentContext>
	): void => {
		const currentContext = asyncLocalStorage.getStore() || {}

		const event: WideEvent = {
			...env,
			...currentContext,
			...partialEvent
		} as WideEvent

		if (!shouldSample(event, config)) {
			return
		}

		switch (level) {
			case "trace":
				pinoLogger.trace(event)
				break
			case "debug":
				pinoLogger.debug(event)
				break
			case "info":
				pinoLogger.info(event)
				break
			case "warn":
				pinoLogger.warn(event)
				break
			case "error":
				pinoLogger.error(event)
				break
			case "fatal":
				pinoLogger.fatal(event)
				break
		}
	}

	return {
		info: (event: Omit<WideEvent, keyof EnvironmentContext>) => log("info", event),
		warn: (event: Omit<WideEvent, keyof EnvironmentContext>) => log("warn", event),
		trace: (event: Omit<WideEvent, keyof EnvironmentContext>) => log("trace", event),
		debug: (event: Omit<WideEvent, keyof EnvironmentContext>) => log("debug", event),
		error: (event: Omit<WideEvent, keyof EnvironmentContext>) => log("error", event),
		fatal: (event: Omit<WideEvent, keyof EnvironmentContext>) => log("fatal", event),

		addContext: (context: BusinessContext) => {
			const store = asyncLocalStorage.getStore()
			if (store) {
				Object.assign(store, context)
			}
		},

		isolate: async <T>(options: {
			context?: BusinessContext
			fn: () => T | Promise<T>
		}): Promise<T> => {
			const initialContext = options.context || {}
			return asyncLocalStorage.run(initialContext, async () => {
				return await options.fn()
			})
		}
	}
}

const globalForLogger = globalThis as unknown as {
	logger: Logger | undefined
}

export const getLogger = (config?: LoggerConfig): Logger => {
	if (!config) {
		if (!globalForLogger.logger) {
			throw new Error("Logger not initialized. Call getLogger(config) first.")
		}
		return globalForLogger.logger
	}

	if (globalForLogger.logger) {
		return globalForLogger.logger
	}

	globalForLogger.logger = createLogger(config)
	return globalForLogger.logger
}

export const generateRequestId = (): string => {
	return `req_${nanoid(16)}`
}

export const initializeRequestContext = (method: string, path: string): RequestContext => {
	return {
		path,
		method,
		request_id: generateRequestId(),
		timestamp: new Date().toISOString()
	}
}

export { createLogger }
export type {
	EnvironmentContext,
	LoggerConfig,
	RequestContext,
	WideEvent,
	ErrorContext,
	Logger
}

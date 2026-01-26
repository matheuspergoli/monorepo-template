import { type Client, createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import fsDriver from "unstorage/drivers/fs"
import redisDriver from "unstorage/drivers/redis"
import { UnstorageDriverCache } from "./libs/cache"
import { DEV_CACHE_PATH, DEV_DATABASE_URL } from "./libs/path"
import * as schema from "./schema"

interface DatabaseConfig {
	url: string
	redis: string
	token: string
	env: {
		node_env: "production" | "development" | "test"
	}
}

const globalForDb = globalThis as unknown as {
	client: Client | undefined
	db: ReturnType<typeof drizzle> | undefined
}

export const createDatabase = (config: DatabaseConfig) => {
	if (globalForDb.db) {
		return globalForDb.db
	}

	const cacheConfig = (() => {
		if (config.env.node_env === "production") {
			return new UnstorageDriverCache({
				defaultTtl: 1800,
				strategy: "all",
				namespace: "drizzle:prod",
				driver: redisDriver({
					base: "drizzle",
					url: config.redis
				})
			})
		}

		return new UnstorageDriverCache({
			defaultTtl: 900,
			strategy: "all",
			namespace: "drizzle:dev",
			driver: fsDriver({
				base: DEV_CACHE_PATH
			})
		})
	})()

	const dbConfig = (() => {
		if (config.env.node_env === "production") {
			return {
				url: config.url,
				authToken: config.token
			}
		}

		return { url: DEV_DATABASE_URL }
	})()

	const client = globalForDb.client ?? createClient(dbConfig)
	globalForDb.client = client

	const db = drizzle(client, { schema, cache: cacheConfig, casing: "snake_case" })
	globalForDb.db = db

	return db
}

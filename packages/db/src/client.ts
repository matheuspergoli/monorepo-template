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
}

export const createDatabase = (config: DatabaseConfig) => {
	const cacheConfig = (() => {
		if (config.env.node_env === "production") {
			return new UnstorageDriverCache({
				defaultTtl: 600,
				strategy: "all",
				namespace: "drizzle:prod",
				driver: redisDriver({
					base: "drizzle",
					url: config.redis
				})
			})
		}

		return new UnstorageDriverCache({
			defaultTtl: 300,
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

	if (config.env.node_env === "production") {
		globalForDb.client = client
	}

	return drizzle(client, { schema, cache: cacheConfig })
}

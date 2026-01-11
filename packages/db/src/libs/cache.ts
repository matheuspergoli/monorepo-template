import { entityKind, getTableName, is, Table } from "drizzle-orm"
import { Cache, type MutationOption } from "drizzle-orm/cache/core"
import type { CacheConfig } from "drizzle-orm/cache/core/types"
import type { Driver, StorageValue, Storage as UnstorageStorage } from "unstorage"
import { createStorage, prefixStorage } from "unstorage"

/** JSON-serializable value types. */
type JsonObject = { [Key in string]: JsonValue }
type JsonArray = JsonValue[] | readonly JsonValue[]
type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonArray

/**
 * Drizzle query cache payload type.
 * Always an array - matches Drizzle Cache interface `Promise<any[] | undefined>`.
 */
type CachePayload = JsonValue[]

/** Cache strategy types. */
type CacheStrategy = "explicit" | "all"

/** Configuration options for UnstorageDriverCache. */
interface UnstorageDriverCacheConfig {
	/** Unstorage driver instance. Defaults to memory. */
	driver?: Driver
	/** Default TTL in seconds. Defaults to 300. */
	defaultTtl?: number
	/** Cache strategy. Defaults to "all". */
	strategy?: CacheStrategy
	/** Namespace prefix. Defaults to "drizzle". */
	namespace?: string
}

/** Internal cache entry structure. */
interface CacheEntry {
	/** Cached query result (JSON-serializable). */
	value: CachePayload
	/** Expiration timestamp in ms. Fallback for drivers without native TTL. */
	expiresAt?: number
	/** Tables for auto-invalidation. */
	tables?: string[]
	/** Column order for object-to-array conversion. */
	columnOrder?: string[]
	/** Flag indicating if cached data are mapped objects. */
	isObjectArray?: boolean
}

/** Fallback TTL (5 minutes). Aligned with defaultTtl default. */
const DEFAULT_TTL_MS = 5 * 60 * 1000

/** Prefix for auto-invalidation cache values: `__CT__:<tables>:<type>:<key>` */
const VALUE_AUTO_PREFIX = "__CT__"

/** Prefix for non-auto-invalidation values: `__NAI__:<type>:<key>` */
const VALUE_NON_AUTO_PREFIX = "__NAI__"

/** Prefix for table index keys: `__CTS__:<table>:<tables>:<type>:<key>` */
const INDEX_PREFIX = "__CTS__"

/** Prefix for tag maps: `__tagsMap__:<tag>` */
const TAG_MAP_PREFIX = "__tagsMap__"

/** Encodes string for safe storage key use. */
const encode = (value: string): string => {
	return encodeURIComponent(value)
}

/**
 * Creates deterministic sorted tables key.
 * Example: ["users", "posts"] → "posts,users"
 */
const makeTablesKey = (tables: string[]): string => {
	if (!tables.length) return ""
	return tables
		.map((table) => encode(table))
		.sort()
		.join(",")
}

/** Decodes tables key to array. */
const decodeTablesKey = (tablesKey: string | undefined): string[] => {
	if (!tablesKey) return []
	return tablesKey.split(",").filter(Boolean).map(decodeURIComponent)
}

/** Normalizes Drizzle table input (Table objects or strings) to strings. */
const normalizeTables = (tables: MutationOption["tables"]): string[] => {
	if (!tables) return []
	const list = Array.isArray(tables) ? tables : [tables]
	return list.map((table) => (is(table, Table) ? getTableName(table) : String(table)))
}

/** Normalizes tag input to string array. */
const normalizeTags = (tags: MutationOption["tags"]): string[] => {
	if (!tags) return []
	const list = Array.isArray(tags) ? tags : [tags]
	return list.map((tag) => `${tag}`)
}

/** Creates index key for table-to-cache tracking. */
const makeIndexKey = (
	table: string,
	tablesKey: string,
	isTag: boolean,
	keyEnc: string
): string => {
	return `${INDEX_PREFIX}:${encode(table)}:${tablesKey}:${isTag ? "t" : "q"}:${keyEnc}`
}

/** Parses index key. Returns undefined if invalid. */
const parseIndexKey = (
	indexKey: string
):
	| {
			tableEnc: string
			tablesKey: string
			isTag: boolean
			keyEnc: string
	  }
	| undefined => {
	const parts = indexKey.split(":")
	if (parts.length !== 5) return undefined
	if (parts[0] !== INDEX_PREFIX) return undefined
	const [, tableEnc, tablesKey, kind, keyEnc] = parts
	if (!tableEnc || !tablesKey || !keyEnc) return undefined
	if (kind !== "q" && kind !== "t") return undefined
	return { tableEnc, tablesKey, isTag: kind === "t", keyEnc }
}

/** Checks if config has TTL fields (vs just keepTtl). */
const pickConfigWithTtl = (config?: CacheConfig): CacheConfig | undefined => {
	if (!config) return undefined
	if (
		config.ex !== undefined ||
		config.px !== undefined ||
		config.exat !== undefined ||
		config.pxat !== undefined
	) {
		return config
	}
	return undefined
}

/**
 * Drizzle ORM cache implementation using Unstorage.
 *
 * Supports: Redis, Cloudflare KV, Vercel KV, Memory, Filesystem, and all Unstorage drivers.
 *
 * Features:
 * - Tag support with automatic invalidation
 * - Storage-based tracking (no memory leaks)
 * - Batch writes when driver supports it
 * - keepTtl for cache updates
 * - Dual TTL (driver + timestamp fallback)
 *
 * Error Handling:
 * - Uses console.error (cache failures don't break app)
 * - Queries fall through to DB on cache errors
 *
 * @example
 * ```ts
 * import { UnstorageDriverCache } from "./libs/cache"
 * import redisDriver from "unstorage/drivers/redis"
 *
 * const cache = new UnstorageDriverCache({
 *   driver: redisDriver({ host: "localhost", port: 6379 }),
 *   defaultTtl: 300,
 *   strategy: "all",
 *   namespace: "drizzle"
 * })
 *
 * const db = drizzle(client, { cache })
 * ```
 */
class UnstorageDriverCache extends Cache {
	static override readonly [entityKind]: string = "UnstorageDriverCache"

	private readonly storage: UnstorageStorage<CacheEntry>
	private readonly defaultTtl: number
	private readonly _strategy: CacheStrategy

	constructor(config: UnstorageDriverCacheConfig = {}) {
		super()
		const baseStorage = createStorage<CacheEntry>({
			driver: config.driver
		})
		const namespace = config.namespace ?? "drizzle"
		this.storage = prefixStorage(baseStorage, namespace)
		this.defaultTtl = config.defaultTtl ?? 300
		this._strategy = config.strategy ?? "all"
	}

	strategy(): CacheStrategy {
		return this._strategy
	}

	/**
	 * Detects if payload contains mapped objects.
	 */
	private isObjectArray(payload: CachePayload): boolean {
		if (!Array.isArray(payload) || payload.length === 0) {
			return false
		}
		const first = payload[0]
		return typeof first === "object" && first !== null && !Array.isArray(first)
	}

	/**
	 * Extracts column order from first object.
	 */
	private extractColumnOrder(payload: CachePayload): string[] | undefined {
		if (!this.isObjectArray(payload)) {
			return undefined
		}
		const first = payload[0] as JsonObject
		return Object.keys(first)
	}

	/**
	 * Converts array of objects to array of arrays.
	 * Example: [{ id: 1, title: "test" }] → [[1, "test"]]
	 */
	private convertToArrays(payload: CachePayload, columnOrder: string[]): CachePayload {
		return payload.map((obj) => {
			if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
				return obj
			}
			const objTyped = obj as JsonObject
			return columnOrder.map((col) => objTyped[col]) as JsonValue
		}) as CachePayload
	}

	/**
	 * Retrieves cached data.
	 *
	 * For tags: looks up tag map to find table dependencies.
	 * For queries: uses tables directly to construct key.
	 * Automatically converts cached objects back to arrays.
	 */
	async get(
		key: string,
		tables: string[],
		isTag: boolean,
		isAutoInvalidate?: boolean
	): Promise<CachePayload | undefined> {
		const keyEnc = encode(key)

		try {
			// TAG LOOKUP PATH
			if (isTag) {
				const mapValue = await this.storage.getItem<string>(this.tagMapKey(keyEnc))
				if (!mapValue) {
					return undefined
				}

				const autoInvalidate = mapValue !== "NAI"
				const tablesKey = autoInvalidate ? mapValue : undefined
				const valueKey = this.valueKey(autoInvalidate, true, keyEnc, tablesKey)

				const entry = await this.storage.getItem<CacheEntry>(valueKey)
				if (!entry) {
					return undefined
				}

				if (this.isExpired(entry)) {
					const fallbackTables = tablesKey ? decodeTablesKey(tablesKey) : []
					await this.dropEntry({
						autoInvalidate,
						isTag,
						keyEnc,
						tablesKey: tablesKey ?? undefined,
						entry,
						fallbackTables,
						removeTagMap: true
					})
					return undefined
				}

				// Convert objects back to arrays if needed
				if (entry.isObjectArray && entry.columnOrder) {
					return this.convertToArrays(entry.value, entry.columnOrder)
				}

				return entry.value
			}

			// QUERY LOOKUP PATH
			const autoInvalidate = isAutoInvalidate ?? tables.length > 0
			const tablesKey = autoInvalidate ? makeTablesKey(tables) : undefined
			const valueKey = this.valueKey(autoInvalidate, false, keyEnc, tablesKey)

			const entry = await this.storage.getItem<CacheEntry>(valueKey)
			if (!entry) {
				return undefined
			}

			if (this.isExpired(entry)) {
				await this.dropEntry({
					autoInvalidate,
					isTag: false,
					keyEnc,
					tablesKey: tablesKey ?? undefined,
					entry,
					fallbackTables: tables
				})
				return undefined
			}

			// Convert objects back to arrays if needed
			if (entry.isObjectArray && entry.columnOrder) {
				return this.convertToArrays(entry.value, entry.columnOrder)
			}

			return entry.value
		} catch (error) {
			console.error(`[UnstorageDriverCache] GET failed for key ${key}:`, error)
			return undefined
		}
	}

	/**
	 * Stores query results or tags in cache.
	 * Creates value entry, index keys, and tag map if needed.
	 */
	async put(
		key: string,
		response: CachePayload,
		tables: string[],
		isTag: boolean,
		config?: CacheConfig
	): Promise<void> {
		const autoInvalidate = tables.length > 0
		const keyEnc = encode(key)
		const tablesKey = autoInvalidate ? makeTablesKey(tables) : undefined
		const valueKey = this.valueKey(autoInvalidate, isTag, keyEnc, tablesKey)

		const now = Date.now()

		try {
			// Handle keepTtl
			const keepTtl = config?.keepTtl === true
			const existing = keepTtl ? await this.storage.getItem<CacheEntry>(valueKey) : undefined
			const expiresAt = this.toExpiresAt(now, config, existing?.expiresAt)

			// Skip if already expired
			if (expiresAt !== undefined && expiresAt <= now) {
				await this.dropEntry({
					autoInvalidate,
					isTag,
					keyEnc,
					tablesKey: tablesKey ?? undefined,
					fallbackTables: tables
				})
				return
			}

			const ttlSeconds =
				expiresAt !== undefined ? Math.max(1, Math.ceil((expiresAt - now) / 1000)) : undefined

			// Detect and store metadata for object conversion
			const isObjectArray = this.isObjectArray(response)
			const columnOrder = isObjectArray ? this.extractColumnOrder(response) : undefined

			const entry: CacheEntry = {
				value: response,
				...(expiresAt !== undefined ? { expiresAt } : {}),
				...(autoInvalidate ? { tables } : {}),
				...(isObjectArray ? { isObjectArray: true } : {}),
				...(columnOrder ? { columnOrder } : {})
			}

			// Batch writes
			const writes: { key: string; value: StorageValue }[] = [{ key: valueKey, value: entry }]

			if (autoInvalidate && tablesKey) {
				const indexKeys = tables.map((table) => this.indexKey(table, tablesKey, isTag, keyEnc))
				for (const indexKey of indexKeys) {
					writes.push({ key: indexKey, value: expiresAt ?? 1 })
				}

				if (isTag) {
					writes.push({ key: this.tagMapKey(keyEnc), value: tablesKey })
				}
			} else if (isTag) {
				writes.push({ key: this.tagMapKey(keyEnc), value: "NAI" })
			}

			await this.setMany(writes, ttlSeconds)
		} catch (error) {
			console.error(`[UnstorageDriverCache] PUT failed for key ${key}:`, error)
		}
	}

	/**
	 * Invalidates cache when mutations occur.
	 * Handles both explicit tags and auto-invalidated tags.
	 */
	async onMutate(params: MutationOption): Promise<void> {
		const tags = normalizeTags(params.tags)
		const tables = Array.from(new Set(normalizeTables(params.tables)))

		await Promise.all([this.invalidateTags(tags), this.invalidateTables(tables)])
	}

	/** Invalidates single tag and dependencies. */
	private async invalidateTag(tag: string): Promise<void> {
		const keyEnc = encode(tag)
		const mapValue = await this.storage.getItem<string>(this.tagMapKey(keyEnc))

		if (!mapValue || mapValue === "NAI") {
			await Promise.all([
				this.storage.removeItem(this.valueKey(false, true, keyEnc)),
				this.storage.removeItem(this.tagMapKey(keyEnc))
			])
			return
		}

		const tablesKey = mapValue
		const tables = decodeTablesKey(tablesKey)
		const valueKey = this.valueKey(true, true, keyEnc, tablesKey)

		await Promise.all([
			this.storage.removeItem(valueKey),
			...tables.map((table) =>
				this.storage.removeItem(this.indexKey(table, tablesKey, true, keyEnc))
			),
			this.storage.removeItem(this.tagMapKey(keyEnc))
		])
	}

	private async invalidateTags(tags: string[]): Promise<void> {
		if (!tags.length) return
		await Promise.all(tags.map((tag) => this.invalidateTag(tag)))
	}

	/** Invalidates all cache entries depending on given tables. */
	private async invalidateTables(tables: string[]): Promise<void> {
		if (!tables.length) return

		const indexKeys = new Set<string>()
		for (const table of tables) {
			const tableEnc = encode(table)
			const prefix = `${INDEX_PREFIX}:${tableEnc}:`
			const keys = await this.storage.getKeys(prefix)
			for (const k of keys) {
				indexKeys.add(k)
			}
		}

		if (!indexKeys.size) return

		const valueKeys = new Set<string>()
		for (const indexKey of indexKeys) {
			const parsed = parseIndexKey(indexKey)
			if (!parsed) continue
			valueKeys.add(this.valueKey(true, parsed.isTag, parsed.keyEnc, parsed.tablesKey))
		}

		await Promise.all([
			...Array.from(indexKeys).map((k) => this.storage.removeItem(k)),
			...Array.from(valueKeys).map((k) => this.storage.removeItem(k))
		])
	}

	/** Drops cache entry and associated metadata. */
	private async dropEntry(params: {
		autoInvalidate: boolean
		isTag: boolean
		keyEnc: string
		tablesKey?: string | undefined
		entry?: CacheEntry | null | undefined
		fallbackTables?: string[]
		removeTagMap?: boolean
	}): Promise<void> {
		const { autoInvalidate, isTag, keyEnc, tablesKey, entry, fallbackTables, removeTagMap } =
			params
		const tables =
			entry?.tables ?? fallbackTables ?? (tablesKey ? decodeTablesKey(tablesKey) : [])
		const resolvedTablesKey = autoInvalidate ? (tablesKey ?? makeTablesKey(tables)) : undefined

		const deletePromises: Promise<void>[] = [
			this.storage.removeItem(this.valueKey(autoInvalidate, isTag, keyEnc, resolvedTablesKey))
		]

		if (isTag && removeTagMap) {
			deletePromises.push(this.storage.removeItem(this.tagMapKey(keyEnc)))
		}

		if (autoInvalidate && tables.length && resolvedTablesKey) {
			deletePromises.push(
				...tables.map((table) =>
					this.storage.removeItem(this.indexKey(table, resolvedTablesKey, isTag, keyEnc))
				)
			)
		}

		await Promise.allSettled(deletePromises)
	}

	/** Constructs value key with appropriate prefix. */
	private valueKey(
		autoInvalidate: boolean,
		isTag: boolean,
		keyEnc: string,
		tablesKey?: string
	): string {
		const kind = isTag ? "t" : "q"
		if (!autoInvalidate) {
			return `${VALUE_NON_AUTO_PREFIX}:${kind}:${keyEnc}`
		}
		return `${VALUE_AUTO_PREFIX}:${tablesKey ?? ""}:${kind}:${keyEnc}`
	}

	/** Constructs index key. */
	private indexKey(table: string, tablesKey: string, isTag: boolean, keyEnc: string): string {
		return makeIndexKey(table, tablesKey, isTag, keyEnc)
	}

	/** Constructs tag map key. */
	private tagMapKey(tagEnc: string): string {
		return `${TAG_MAP_PREFIX}:${tagEnc}`
	}

	/** Checks if entry expired based on timestamp. */
	private isExpired(entry: CacheEntry): boolean {
		return entry.expiresAt !== undefined && entry.expiresAt <= Date.now()
	}

	/** Calculates expiration timestamp. Supports keepTtl. */
	private toExpiresAt(
		now: number,
		config?: CacheConfig,
		existingExpiresAt?: number
	): number | undefined {
		// Reuse existing expiration if keepTtl
		if (config?.keepTtl && existingExpiresAt && existingExpiresAt > now) {
			return existingExpiresAt
		}

		const source = pickConfigWithTtl(config) ?? pickConfigWithTtl({ ex: this.defaultTtl })
		if (!source) {
			return now + DEFAULT_TTL_MS
		}

		if (source.px !== undefined) return now + source.px
		if (source.ex !== undefined) return now + source.ex * 1000
		if (source.pxat !== undefined) return source.pxat
		if (source.exat !== undefined) return source.exat * 1000

		return now + DEFAULT_TTL_MS
	}

	/** Batch write helper. Uses driver's setItems if available. */
	private async setMany(
		items: { key: string; value: StorageValue }[],
		ttlSeconds?: number
	): Promise<void> {
		const ttlOptions = ttlSeconds ? { ttl: ttlSeconds } : undefined
		const rawStorage = this.storage as UnstorageStorage

		if (rawStorage.setItems) {
			await rawStorage.setItems(
				items.map((item) => ({ key: item.key, value: item.value })),
				ttlOptions ?? {}
			)
			return
		}

		await Promise.all(
			items.map((item) => rawStorage.setItem(item.key, item.value, ttlOptions))
		)
	}
}

export { UnstorageDriverCache }

import { createClient } from "@libsql/client"
import { env } from "@repo/env/db"
import { drizzle } from "drizzle-orm/libsql"

import * as schemas from "./schema"

const client = createClient({
	url: env.TURSO_CONNECTION_URL,
	authToken: env.TURSO_AUTH_TOKEN
})

export const db = drizzle(client, {
	schema: schemas
})

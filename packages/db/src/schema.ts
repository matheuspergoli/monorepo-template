import { sql } from "drizzle-orm"
import { sqliteTable, text } from "drizzle-orm/sqlite-core"

export const userTable = sqliteTable("users", {
	id: text().notNull().primaryKey(),
	email: text().notNull().unique(),
	createdAt: text().notNull().default(sql`(CURRENT_TIMESTAMP)`)
})

import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	username: text("username").notNull(),
	email: text("email").unique().notNull(),
	passwordHash: text("password_hash"),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false)
})

export const oauthAccount = sqliteTable(
	"oauth_account",
	{
		providerId: text("provider_id").notNull(),
		providerUserId: text("provider_user_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" })
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.providerId, table.providerUserId] })
		}
	}
)

export const emailVerificationCode = sqliteTable("email_verification_code", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	code: text("code").notNull(),
	userId: text("user_id").notNull().unique(),
	email: text("email").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull()
})

export const passwordResetToken = sqliteTable("password_reset_token", {
	tokenHash: text("token_hash").unique(),
	userId: text("user_id").notNull().unique(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull()
})

export const sessions = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expiresAt: integer("expires_at").notNull()
})

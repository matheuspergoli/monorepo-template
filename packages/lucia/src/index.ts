import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle"
import { db } from "@repo/db/client"
import { sessions, users } from "@repo/db/schema"
import { env } from "@repo/env/shared"
import {
	generateIdFromEntropySize,
	Lucia,
	verifyRequestOrigin,
	type Session,
	type User
} from "lucia"

export const adapter = new DrizzleSQLiteAdapter(db, sessions, users)

export { verifyRequestOrigin, generateIdFromEntropySize }

export type DatabaseUser = Omit<typeof users.$inferSelect, "passwordHash">

export type { Session, User }

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		name: "session",
		attributes: {
			secure: env.NODE_ENV === "production"
		}
	},
	getSessionAttributes: () => ({}),
	getUserAttributes: (attr): DatabaseUser => {
		return {
			id: attr.id,
			email: attr.email,
			username: attr.username,
			emailVerified: attr.emailVerified
		}
	}
})

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia
		DatabaseUserAttributes: DatabaseUser
		DatabaseSessionAttributes: Record<string, never>
	}
}

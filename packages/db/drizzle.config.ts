import { defineConfig } from "drizzle-kit"
import { DEV_DATABASE_URL } from "./src/libs/path"

const isProd = process.env.NODE_ENV === "production"

const validate = (key: string): string => {
	const value = process.env[key]
	if (!value) {
		throw new Error(`Missing env var: ${key}`)
	}
	return value
}
const configDev = defineConfig({
	schema: "./src/schema.ts",
	out: "./src/migrations",
	dialect: "sqlite",
	dbCredentials: {
		url: DEV_DATABASE_URL
	}
})

const configProd = defineConfig({
	schema: "./src/schema.ts",
	out: "./src/migrations",
	dialect: "turso",
	dbCredentials: {
		url: validate("DATABASE_URL"),
		authToken: validate("DATABASE_AUTH_TOKEN")
	}
})

export default isProd ? configProd : configDev

import { defineConfig } from "drizzle-kit"
import { DEV_DATABASE_URL } from "./src/libs/path"

const validate = (key: string): string => {
	const value = process.env[key]
	if (!value) {
		throw new Error(`Missing env var: ${key}`)
	}
	return value
}

const env = {
	DATABASE_URL: validate("DATABASE_URL"),
	AUTH_TOKEN: validate("DATABASE_AUTH_TOKEN")
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
		url: env.DATABASE_URL,
		authToken: env.AUTH_TOKEN
	}
})

const isProd = process.env.NODE_ENV === "production"

export default isProd ? configProd : configDev

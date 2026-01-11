import path from "node:path"

const DEV_SQLITE_PATH = path.resolve(__dirname, "..", "..", "db.sqlite")

export const DEV_DATABASE_URL = `file:${DEV_SQLITE_PATH}`

import { join } from "node:path"
import fsDriver from "unstorage/drivers/fs"
import redisDriver from "unstorage/drivers/redis"
import { env } from "@/env"

export const getDriver = () => {
	if (env.NODE_ENV === "production") {
		return redisDriver({
			base: "auth",
			url: env.REDIS_URL
		})
	}

	return fsDriver({
		base: join(process.cwd(), ".auth")
	})
}

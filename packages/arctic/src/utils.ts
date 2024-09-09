import { env as envApi } from "@repo/env/api"
import { env as envShared } from "@repo/env/shared"

export const getBaseUrl = () => {
	if (envShared.NODE_ENV === "development") {
		return "http://localhost:3030"
	}

	return `https://${envApi.PORT}`
}

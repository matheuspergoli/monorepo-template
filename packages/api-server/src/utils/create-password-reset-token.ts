import { eq } from "@repo/db"
import { db } from "@repo/db/client"
import { passwordResetToken } from "@repo/db/schema"
import { generateIdFromEntropySize } from "@repo/lucia"
import { createDate, encodeHex, sha256, TimeSpan } from "@repo/oslo"

export const createPasswordResetToken = async ({ userId }: { userId: string }) => {
	await db.delete(passwordResetToken).where(eq(passwordResetToken.userId, userId))

	const tokenId = generateIdFromEntropySize(25)
	const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)))

	await db.insert(passwordResetToken).values({
		userId,
		tokenHash,
		expiresAt: createDate(new TimeSpan(2, "h"))
	})

	return tokenId
}

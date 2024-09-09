import { eq } from "@repo/db"
import { db } from "@repo/db/client"
import { emailVerificationCode } from "@repo/db/schema"
import { alphabet, createDate, generateRandomString, TimeSpan } from "@repo/oslo"

export const createEmailVerificationCode = async ({
	userId,
	email
}: {
	userId: string
	email: string
}) => {
	await db.delete(emailVerificationCode).where(eq(emailVerificationCode.userId, userId))

	const code = generateRandomString(8, alphabet("0-9", "A-Z"))

	await db.insert(emailVerificationCode).values({
		userId,
		email,
		code,
		expiresAt: createDate(new TimeSpan(15, "m"))
	})

	return code
}

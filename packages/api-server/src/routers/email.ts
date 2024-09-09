import { eq } from "@repo/db"
import { emailVerificationCode, passwordResetToken, users } from "@repo/db/schema"
import { resend } from "@repo/emails"
import { ResetPasswordEmail } from "@repo/emails/reset-password-email"
import { VerificationCodeEmail } from "@repo/emails/verification-code-email"
import { env as apiEnv } from "@repo/env/api"
import { env as resendEnv } from "@repo/env/resend"
import { lucia } from "@repo/lucia"
import { encodeHex, isWithinExpirationDate, sha256 } from "@repo/oslo"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import {
	createEmailVerificationCode,
	createPasswordResetToken,
	setSession
} from "../utils"

export const emailRouter = createTRPCRouter({
	verifyEmailVerificationCode: protectedProcedure
		.input(z.object({ code: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const databaseCode = await ctx.db.query.emailVerificationCode.findFirst({
				where: eq(emailVerificationCode.userId, ctx.user.id)
			})

			if (!databaseCode || databaseCode.code !== input.code) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid code"
				})
			}

			await ctx.db
				.delete(emailVerificationCode)
				.where(eq(emailVerificationCode.id, databaseCode.id))

			if (!isWithinExpirationDate(databaseCode.expiresAt)) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Code expired"
				})
			}

			if (databaseCode.email !== ctx.user.email) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid code"
				})
			}

			await lucia.invalidateUserSessions(ctx.user.id)
			await ctx.db
				.update(users)
				.set({ emailVerified: true })
				.where(eq(users.id, ctx.user.id))

			await setSession({ userId: ctx.user.id, res: ctx.response })
		}),

	verifyPasswordResetToken: publicProcedure
		.input(z.object({ receivedToken: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const tokenHash = encodeHex(
				await sha256(new TextEncoder().encode(input.receivedToken))
			)

			const token = await ctx.db.query.passwordResetToken.findFirst({
				where: eq(passwordResetToken.tokenHash, tokenHash)
			})

			if (token) {
				await ctx.db
					.delete(passwordResetToken)
					.where(eq(passwordResetToken.tokenHash, tokenHash))
			}

			if (!token || !isWithinExpirationDate(token.expiresAt)) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid token"
				})
			}

			return token
		}),

	sendPasswordResetEmail: publicProcedure
		.input(z.object({ email: z.string().email() }))
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.query.users.findFirst({
				where: eq(users.email, input.email)
			})

			if (!user) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid email"
				})
			}

			const isValidEmail = user.email === input.email

			if (!isValidEmail) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid email"
				})
			}

			const verificationToken = await createPasswordResetToken({
				userId: user.id
			})

			if (!verificationToken) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to create token"
				})
			}

			const verificationLink = `${apiEnv.FRONTEND_URL}/reset-password?token=${verificationToken}`

			const { error } = await resend.emails.send({
				from: resendEnv.EMAIL_HOST,
				to: input.email,
				subject: "Reset password",
				react: ResetPasswordEmail({ link: verificationLink })
			})

			if (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to send email"
				})
			}
		}),

	sendEmailVerificationCode: protectedProcedure.mutation(async ({ ctx }) => {
		const code = await createEmailVerificationCode({
			email: ctx.user.email,
			userId: ctx.user.id
		})

		if (!code) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Failed to create code"
			})
		}

		const { error } = await resend.emails.send({
			from: resendEnv.EMAIL_HOST,
			to: ctx.user.email,
			subject: "Email verification code",
			react: VerificationCodeEmail({ code })
		})

		if (error) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Failed to send email"
			})
		}
	})
})

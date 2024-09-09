import { hash, verify } from "@node-rs/argon2"
import { eq } from "@repo/db"
import { users } from "@repo/db/schema"
import { generateIdFromEntropySize, lucia } from "@repo/lucia"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, publicProcedure } from "../trpc"
import { checkPasswordLeaks, checkPasswordStrength, setSession } from "../utils"

export const authRouter = createTRPCRouter({
	signupWithEmailAndPassword: publicProcedure
		.input(
			z.object({
				username: z.string().min(3).max(31),
				email: z.string().email(),
				password: z.string().min(6).max(255)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existingUser = await ctx.db.query.users.findFirst({
				where: eq(users.email, input.email)
			})

			if (existingUser) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Signup failed. Check your information or try another email."
				})
			}

			const passwordFeedbackWarning = checkPasswordStrength(input.password)

			if (passwordFeedbackWarning) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: passwordFeedbackWarning.feedback.warning
				})
			}

			const checkForPasswordLeaks = await checkPasswordLeaks(input.password)

			if (checkForPasswordLeaks) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This password has been leaked in a data breach"
				})
			}

			const userId = generateIdFromEntropySize(10) // 16 characters
			const passwordHash = await hash(input.password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			})

			const user = await ctx.db
				.insert(users)
				.values({
					id: userId,
					username: input.username,
					email: input.email,
					passwordHash: passwordHash,
					emailVerified: false
				})
				.returning()
				.then((res) => res[0] ?? null)

			if (!user) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create user"
				})
			}

			await setSession({ userId, res: ctx.response })
		}),

	loginWithEmailAndPassword: publicProcedure
		.input(z.object({ email: z.string().email(), password: z.string().min(6).max(255) }))
		.mutation(async ({ input, ctx }) => {
			const existingUser = await ctx.db.query.users.findFirst({
				where: eq(users.email, input.email)
			})

			if (!existingUser || !existingUser.passwordHash) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Incorrect username or password"
				})
			}

			const validPassword = await verify(input.password, existingUser.passwordHash)

			if (!validPassword) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Incorrect username or password"
				})
			}

			await setSession({ userId: existingUser.id, res: ctx.response })
		}),

	logout: publicProcedure.mutation(async ({ ctx }) => {
		if (!ctx.session) {
			throw new TRPCError({
				code: "UNAUTHORIZED"
			})
		}

		await lucia.invalidateSession(ctx.session.id)

		ctx.response.setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize())
	}),

	resetPassword: publicProcedure
		.input(
			z.object({
				password: z.string().min(6).max(255),
				token: z.object({
					userId: z.string(),
					expiresAt: z.date(),
					tokenHash: z.string().nullable()
				})
			})
		)
		.mutation(async ({ ctx, input }) => {
			const passwordFeedbackWarning = checkPasswordStrength(input.password).feedback
				.warning

			if (passwordFeedbackWarning) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: passwordFeedbackWarning
				})
			}

			const checkForPasswordLeaks = await checkPasswordLeaks(input.password)

			if (checkForPasswordLeaks) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This password has been leaked in a data breach"
				})
			}

			await lucia.invalidateUserSessions(input.token.userId)
			const passwordHash = await hash(input.password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			})

			const updatedUser = await ctx.db
				.update(users)
				.set({ passwordHash })
				.where(eq(users.id, input.token.userId))
				.returning()
				.then((res) => res[0] ?? null)

			if (!updatedUser) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update user"
				})
			}

			await setSession({ userId: input.token.userId, res: ctx.response })
		})
})

import { createSubjects } from "@draftlab/auth/subject"
import z from "zod"

export const subjects = createSubjects({
	user: z.object({
		email: z.email()
	})
})

export type { InferSubjectProperties } from "@draftlab/auth/subject"

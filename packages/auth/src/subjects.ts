import { createSubjects } from "@draftlab/auth/subject"
import z from "zod"

export const subjects = createSubjects({
	user: z.object({
		id: z.string(),
		email: z.email()
	})
})

export type { InferSubjectProperties } from "@draftlab/auth/subject"

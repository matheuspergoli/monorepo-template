import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const run = <T>(fn: () => T): T => fn()

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

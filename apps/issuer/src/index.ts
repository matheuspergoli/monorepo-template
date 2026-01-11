import { issuer } from "@repo/auth/issuer"
import { PasswordProvider, PasswordUI } from "@repo/auth/providers/password"
import { Select } from "@repo/auth/select"
import { UnStorage } from "@repo/auth/storages/unstorage"
import { subjects } from "@repo/auth/subjects"
import { getDriver } from "./storage"

const driver = getDriver()

export default issuer({
	subjects,
	theme: {
		font: {
			family: "sans-serif"
		},
		radius: "none",
		title: "Monorepo Template",
		background: {
			dark: "black",
			light: "white"
		},
		primary: {
			dark: "white",
			light: "black"
		}
	},
	ttl: {
		reuse: 0,
		access: 3600,
		refresh: 604800,
		retention: 1209600
	},
	select: Select({
		copy: { button_provider: " " },
		displays: {
			password: "Email/Senha"
		}
	}),
	storage: UnStorage({ driver }),
	providers: {
		password: PasswordProvider(
			PasswordUI({
				copy: {
					code_return: "",
					login: "Entrar",
					input_code: "XXXXXX",
					input_email: "Email",
					register: "Cadastre-se",
					input_password: "Senha",
					button_continue: "Continuar",
					code_resend: "Reenviar código",
					login_prompt: "Já tem uma conta ?",
					change_prompt: "Esqueceu a senha ?",
					error_invalid_code: "Código incorreto",
					register_prompt: "Não tem uma conta ?",
					error_invalid_email: "Email incorreto",
					input_repeat: "Digite a senha novamente",
					error_invalid_password: "Senha incorreta",
					error_password_mismatch: "Senhas não coincidem",
					error_email_taken: "Já existe uma conta com esse email"
				},
				validatePassword: (password) => {
					if (password.length < 6) return "Senha deve ter no mínimo 6 caracteres"
					return undefined
				},
				async sendCode(email, code, context) {
					console.log(`[${context}] Code for ${email}: ${code}`)
				}
			})
		)
	},
	success: (ctx, value) => {
		if (value.provider === "password") {
			return ctx.subject("user", {
				email: value.email
			})
		}

		throw new Error("Unknown provider")
	}
})

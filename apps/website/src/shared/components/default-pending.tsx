import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from "@repo/ui/components/empty"
import { Spinner } from "@repo/ui/components/spinner"

export const DefaultPending = () => {
	return (
		<Empty className="flex h-screen w-screen items-center justify-center">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Spinner />
				</EmptyMedia>
				<EmptyTitle>Carregando seus dados.</EmptyTitle>
				<EmptyDescription>
					Por favor espere um pouco enquanto carregamos seus dados.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	)
}

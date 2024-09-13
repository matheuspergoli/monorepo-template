import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Section,
	Tailwind,
	Text
} from "@react-email/components"

export const VerificationCodeEmail = ({ code }: { code: string }) => (
	<Html>
		<Tailwind>
			<Head />
			<Body className="bg-[#f6f9fc] font-sans">
				<Container className="mx-auto mb-16 bg-white py-5">
					<Section className="px-12">
						<Hr className="my-5 border-[#e6ebf1]" />
						<Text className="text-center text-2xl font-semibold leading-6 text-[#525f7f]">
							Email Verification
						</Text>
						<Text className="text-center text-base leading-6 text-[#525f7f]">
							Copy and paste the following code into your app to verify your email.
						</Text>
						<Button className="block w-full rounded bg-[#656ee8] py-2.5 text-center text-base font-bold text-white no-underline">
							{code}
						</Button>
						<Text className="text-left text-base leading-6 text-[#525f7f]">
							— The Team
						</Text>
						<Hr className="my-5 border-[#e6ebf1]" />
						<Text className="text-xs leading-4 text-[#8898aa]">Our App.</Text>
					</Section>
				</Container>
			</Body>
		</Tailwind>
	</Html>
)

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface InviteEmailProps {
  organizationName: string;
  role: string;
  inviteLink: string;
}

export const InviteEmail = ({
  organizationName,
  role,
  inviteLink,
}: InviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Join {organizationName} on OurMenu OS</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans my-auto mx-auto px-2 pt-5 pb-12">
          <Container className="border border-solid border-[#eaeaea] rounded-xl my-10 mx-auto p-10 max-w-lg bg-white shadow-lg">
            
            <Section className="text-center mb-6">
              <Heading className="text-black text-2xl font-bold text-center p-0 mb-4 mt-0 mx-0">
                You&apos;ve been invited!
              </Heading>
              <Text className="text-gray-600 text-base mt-0">
                You have been invited to join <strong>{organizationName}</strong> as a <strong>{role}</strong> on OurMenu OS.
              </Text>
            </Section>

            <Section className="text-center mb-8">
              <Button
                href={inviteLink}
                className="bg-black text-white rounded-lg px-6 py-3 font-semibold text-sm no-underline"
              >
                Accept Invitation
              </Button>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-6 mx-0 w-full" />
            
            <Section>
              <Text className="text-gray-500 text-xs text-center m-0">
                Powered by OurMenu OS
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteEmail;

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface InvoiceEmailProps {
  organizationName: string;
  amountCredits: number;
  userName: string;
}

export const InvoiceEmail = ({
  organizationName,
  amountCredits,
  userName,
}: InvoiceEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Invoice for {organizationName} - Credits Purchased</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans my-auto mx-auto px-2 pt-5 pb-12">
          <Container className="border border-solid border-[#eaeaea] rounded-xl my-10 mx-auto p-10 max-w-lg bg-white shadow-lg">
            
            <Section className="text-center">
              <Heading className="text-black text-2xl font-bold text-center p-0 mb-4 mt-0 mx-0">
                OurMenu OS
              </Heading>
              <Text className="text-gray-500 text-sm mt-0">
                Payment Receipt for {organizationName}
              </Text>
            </Section>

            <Section className="bg-blue-50 rounded-lg p-6 my-6 border border-blue-200">
              <Text className="text-blue-800 text-base font-medium text-center m-0">
                Credits Successfully Purchased
              </Text>
              <Text className="text-4xl font-black text-center text-blue-950 m-0 mt-2">
                +{amountCredits} Credits
              </Text>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-6 mx-0 w-full" />

            <Section>
              <Text className="text-black text-sm font-bold uppercase tracking-wider mb-4">
                Billed To
              </Text>
              <Row className="mb-4">
                <Text className="text-black text-sm m-0">
                  <span className="font-semibold">User:</span> {userName}
                </Text>
                <Text className="text-gray-500 text-sm m-0">
                  <span className="font-semibold">Organization:</span> {organizationName}
                </Text>
              </Row>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-6 mx-0 w-full" />
            
            <Section>
              <Text className="text-gray-500 text-xs text-center m-0">
                This is a transactional receipt generated automatically.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InvoiceEmail;

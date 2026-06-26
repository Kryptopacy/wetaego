import {
  Body,
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
import { formatCurrency } from '@/lib/utils/currency';

interface FallbackEmailProps {
  organizationName: string;
  tableIdentifier: string;
  amountMinor: number;
  message: string;
}

export const FallbackEmail = ({
  organizationName,
  tableIdentifier,
  amountMinor,
  message,
}: FallbackEmailProps) => {
  const formattedTotal = formatCurrency(amountMinor);

  return (
    <Html>
      <Head />
      <Preview>URGENT: Missed Order Alert for {organizationName}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans my-auto mx-auto px-2 pt-5 pb-12">
          <Container className="border border-solid border-[#eaeaea] rounded-xl my-10 mx-auto p-10 max-w-lg bg-white shadow-lg">
            
            <Section className="text-center mb-6">
              <Heading className="text-red-600 text-2xl font-bold text-center p-0 mb-4 mt-0 mx-0">
                CRITICAL ALERT
              </Heading>
              <Text className="text-gray-600 text-base mt-0 font-medium">
                The Dashboard/WhatsApp notification failed to deliver for a recent paid order.
              </Text>
            </Section>

            <Section className="bg-red-50 rounded-lg p-6 my-6 border border-red-200">
              <Text className="text-red-800 text-sm font-bold m-0 mb-2">
                Table: {tableIdentifier}
              </Text>
              <Text className="text-red-800 text-sm font-bold m-0 mb-4">
                Amount: {formattedTotal}
              </Text>
              <Text className="text-black text-sm m-0 bg-white p-3 rounded border border-red-100">
                {message}
              </Text>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-6 mx-0 w-full" />
            
            <Section>
              <Text className="text-gray-500 text-xs text-center m-0">
                Please check your OurMenu dashboard immediately.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default FallbackEmail;

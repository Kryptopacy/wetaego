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
import { formatCurrency } from '@/lib/utils/currency';

interface ReceiptEmailProps {
  organizationName: string;
  orderId: string;
  totalAmountMinor: number;
  items: Array<{
    name: string;
    quantity: number;
    priceMinor: number;
  }>;
}

export const ReceiptEmail = ({
  organizationName,
  orderId,
  totalAmountMinor,
  items,
}: ReceiptEmailProps) => {
  const formattedTotal = formatCurrency(totalAmountMinor);
  const shortOrderId = orderId.substring(0, 8);

  return (
    <Html>
      <Head />
      <Preview>Your receipt from {organizationName} - {formattedTotal}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans my-auto mx-auto px-2 pt-5 pb-12">
          <Container className="border border-solid border-[#eaeaea] rounded-xl my-10 mx-auto p-10 max-w-lg bg-white shadow-lg">
            
            <Section className="text-center">
              <Heading className="text-black text-2xl font-bold text-center p-0 mb-4 mt-0 mx-0">
                {organizationName}
              </Heading>
              <Text className="text-gray-500 text-sm mt-0">
                Order #{shortOrderId}
              </Text>
            </Section>

            <Section className="bg-green-50 rounded-lg p-6 my-6 border border-green-200">
              <Text className="text-green-800 text-base font-medium text-center m-0">
                Payment Successful
              </Text>
              <Text className="text-4xl font-black text-center text-green-950 m-0 mt-2">
                {formattedTotal}
              </Text>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-6 mx-0 w-full" />

            <Section>
              <Text className="text-black text-sm font-bold uppercase tracking-wider mb-4">
                Order Details
              </Text>
              {items.map((item, index) => (
                <Row key={index} className="mb-4">
                  <Text className="text-black text-sm m-0">
                    <span className="font-semibold">{item.quantity}x</span> {item.name}
                  </Text>
                  <Text className="text-gray-500 text-sm m-0">
                    {formatCurrency(item.priceMinor)}
                  </Text>
                </Row>
              ))}
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

export default ReceiptEmail;

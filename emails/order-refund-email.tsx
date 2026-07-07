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

interface OrderRefundEmailProps {
  organizationName: string;
  orderId: string;
  refundAmountMinor?: number;
}

export const OrderRefundEmail = ({
  organizationName,
  orderId,
  refundAmountMinor,
}: OrderRefundEmailProps) => {
  const shortOrderId = orderId.substring(0, 8);
  const refundText = refundAmountMinor ? ` of ${formatCurrency(refundAmountMinor)}` : '';

  return (
    <Html>
      <Head />
      <Preview>Refund initiated for your order from {organizationName}</Preview>
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

            <Section className="bg-blue-50 rounded-lg p-6 my-6 border border-blue-200 text-center">
              <Text className="text-blue-800 text-lg font-bold m-0">
                Refund Initiated
              </Text>
            </Section>

            <Section>
              <Text className="text-black text-base leading-relaxed">
                We have successfully processed a refund{refundText} for your order.
              </Text>
              <Text className="text-black text-sm mt-4">
                Please note that it may take a few business days for the funds to reflect in your original payment method, depending on your bank's processing times. 
                If you have any questions, please contact {organizationName}.
              </Text>
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

export default OrderRefundEmail;

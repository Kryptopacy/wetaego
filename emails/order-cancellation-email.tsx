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

interface OrderCancellationEmailProps {
  organizationName: string;
  orderId: string;
  reason?: string;
}

export const OrderCancellationEmail = ({
  organizationName,
  orderId,
  reason,
}: OrderCancellationEmailProps) => {
  const shortOrderId = orderId.substring(0, 8);

  return (
    <Html>
      <Head />
      <Preview>Your order from {organizationName} has been cancelled</Preview>
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

            <Section className="bg-red-50 rounded-lg p-6 my-6 border border-red-200 text-center">
              <Text className="text-red-800 text-lg font-bold m-0">
                Order Cancelled
              </Text>
            </Section>

            <Section>
              <Text className="text-black text-base leading-relaxed">
                We're sorry, but your order has been cancelled. 
              </Text>
              {reason && (
                <Text className="text-gray-600 text-sm mt-2 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                  "{reason}"
                </Text>
              )}
              <Text className="text-black text-sm mt-4">
                If you have already paid for this order, you will be refunded according to the restaurant's refund policy. 
                If you have any questions, please contact {organizationName} directly.
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

export default OrderCancellationEmail;

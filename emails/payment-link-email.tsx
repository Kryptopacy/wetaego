import {
  Body,
  Button,
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

interface PaymentLinkEmailProps {
  organizationName: string;
  orderId: string;
  totalAmountMinor: number;
  paymentUrl: string;
  items: Array<{
    name: string;
    quantity: number;
    priceMinor: number;
  }>;
}

export const PaymentLinkEmail = ({
  organizationName = "WETAEGO Partner",
  orderId = "12345678",
  totalAmountMinor = 1500000,
  paymentUrl = "https://paystack.com/pay/xyz",
  items = [
    { name: "Sample Item", quantity: 1, priceMinor: 1500000 }
  ],
}: PaymentLinkEmailProps) => {
  const formattedTotal = formatCurrency(totalAmountMinor);
  const shortOrderId = orderId.substring(0, 8);

  return (
    <Html>
      <Head />
      <Preview>Complete your payment for {organizationName} - {formattedTotal}</Preview>
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

            <Section className="bg-blue-50 rounded-lg p-6 my-6 border border-blue-200">
              <Text className="text-blue-800 text-base font-medium text-center m-0">
                Payment Required
              </Text>
              <Text className="text-4xl font-black text-center text-blue-950 m-0 mt-2 mb-4">
                {formattedTotal}
              </Text>
              <div className="text-center">
                <Button 
                  href={paymentUrl}
                  className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg mx-auto"
                >
                  Pay Now
                </Button>
              </div>
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
                Powered by WETAEGO
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PaymentLinkEmail;

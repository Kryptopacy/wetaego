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

interface DailyReportEmailProps {
  organizationName: string;
  totalOrders: number;
  totalRevenueMinor: number;
  dateString: string;
}

export const DailyReportEmail = ({
  organizationName,
  totalOrders,
  totalRevenueMinor,
  dateString,
}: DailyReportEmailProps) => {
  const formattedRevenue = formatCurrency($1);

  return (
    <Html>
      <Head />
      <Preview>Daily Sales Report for {organizationName}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans my-auto mx-auto px-2 pt-5 pb-12">
          <Container className="border border-solid border-[#eaeaea] rounded-xl my-10 mx-auto p-10 max-w-lg bg-white shadow-lg">
            
            <Section className="text-center">
              <Heading className="text-black text-2xl font-bold text-center p-0 mb-4 mt-0 mx-0">
                {organizationName}
              </Heading>
              <Text className="text-gray-500 text-sm mt-0">
                Daily Sales Report - {dateString}
              </Text>
            </Section>

            <Section className="bg-violet-50 rounded-lg p-6 my-6 border border-violet-200">
              <Text className="text-violet-800 text-base font-medium text-center m-0">
                Total Revenue
              </Text>
              <Text className="text-4xl font-black text-center text-violet-950 m-0 mt-2">
                {formattedRevenue}
              </Text>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-6 mx-0 w-full" />

            <Section>
              <Row className="mb-4">
                <Text className="text-black text-base m-0">
                  <span className="font-semibold">Total Orders Processed:</span> {totalOrders}
                </Text>
              </Row>
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

export default DailyReportEmail;

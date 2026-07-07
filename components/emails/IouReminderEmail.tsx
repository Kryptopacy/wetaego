import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface IouReminderEmailProps {
  customerName: string
  organizationName: string
  balanceDueMinor: number
  minimumRepaymentPercentage: number
  paymentLink: string
}

export const IouReminderEmail = ({
  customerName,
  organizationName,
  balanceDueMinor,
  minimumRepaymentPercentage,
  paymentLink,
}: IouReminderEmailProps) => {
  const balanceStr = (balanceDueMinor / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
  })
  
  const minRepaymentMinor = Math.ceil(balanceDueMinor * (minimumRepaymentPercentage / 100))
  const minRepaymentStr = (minRepaymentMinor / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
  })

  return (
    <Html>
      <Head />
      <Preview>Your outstanding balance with {organizationName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Reminder</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            This is a friendly reminder that you have an outstanding IOU balance of <strong>{balanceStr}</strong> at {organizationName}.
          </Text>
          
          <Section style={balanceSection}>
            <Text style={balanceLabel}>Outstanding Balance</Text>
            <Text style={balanceAmount}>{balanceStr}</Text>
          </Section>

          {minimumRepaymentPercentage < 100 && (
            <Text style={text}>
              Note: You can make a partial payment. A minimum payment of <strong>{minRepaymentStr}</strong> ({minimumRepaymentPercentage}% of your balance) is required per transaction.
            </Text>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={paymentLink}>
              Pay Now
            </Button>
          </Section>

          <Text style={footer}>
            If you have already settled this balance or believe this is an error, please reach out to the staff at {organizationName}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default IouReminderEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '1.5',
  marginBottom: '16px',
}

const balanceSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '24px',
  border: '1px solid #e2e8f0',
}

const balanceLabel = {
  color: '#64748b',
  fontSize: '14px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
}

const balanceAmount = {
  color: '#0f172a',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '32px',
  borderTop: '1px solid #e2e8f0',
  paddingTop: '24px',
}

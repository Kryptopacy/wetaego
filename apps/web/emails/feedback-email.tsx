/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, @typescript-eslint/ban-ts-comment, react/no-unescaped-entities */
// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
} from '@react-email/components'
import * as React from 'react'

interface FeedbackEmailProps {
  orgName: string
  orderId: string
  feedbackUrl: string
}

export const FeedbackEmail = ({
  orgName,
  orderId,
  feedbackUrl,
}: FeedbackEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>How was your meal at {orgName}?</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>How did we do?</Heading>
          <Text style={text}>
            Thank you for dining with <strong>{orgName}</strong> today!
          </Text>
          <Text style={text}>
            We'd love to hear about your experience. Your feedback helps our team improve, and you also have the option to leave a tip for the staff who served you.
          </Text>

          <Button
            href={feedbackUrl}
            style={button}
          >
            Rate your experience
          </Button>

          <Text style={footer}>
            If you have any immediate concerns, please contact the restaurant directly.
            <br />
            Powered by OurMenu OS
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

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
  maxWidth: '500px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px 0',
  marginTop: '20px',
  marginBottom: '20px',
}

const footer = {
  color: '#888',
  fontSize: '12px',
  lineHeight: '1.5',
  marginTop: '30px',
  textAlign: 'center' as const,
  borderTop: '1px solid #eaeaea',
  paddingTop: '20px',
}

export default FeedbackEmail

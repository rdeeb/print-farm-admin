import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components'
import { ReactElement } from 'react'

export interface PasswordResetEmailProps {
  resetUrl: string
  userName: string
}

export function PasswordResetEmail({ resetUrl, userName }: PasswordResetEmailProps): ReactElement {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            margin: '40px auto',
            padding: '40px',
            borderRadius: '8px',
            maxWidth: '560px',
          }}
        >
          <Heading style={{ color: '#1a1a1a', fontSize: '24px', marginBottom: '8px' }}>
            Reset your password
          </Heading>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            Hi {userName},
          </Text>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            We received a request to reset your 3D Farm Admin password. Click the button below to
            choose a new password. This link is valid for 1 hour.
          </Text>
          <Button
            href={resetUrl}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
              margin: '16px 0',
            }}
          >
            Reset Password
          </Button>
          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            If you didn&apos;t request a password reset, you can safely ignore this email. Your password
            will not be changed.
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            Or copy and paste this URL into your browser:{' '}
            <Link href={resetUrl} style={{ color: '#2563eb' }}>
              {resetUrl}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default PasswordResetEmail

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

export interface InviteEmailProps {
  inviteUrl: string
  inviterName: string
  farmName: string
  role: string
}

export function InviteEmail({
  inviteUrl,
  inviterName,
  farmName,
  role,
}: InviteEmailProps): ReactElement {
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
            You&apos;ve been invited to join {farmName}
          </Heading>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            {inviterName} has invited you to join <strong>{farmName}</strong> on 3D Farm Admin as
            a <strong>{role}</strong>.
          </Text>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            Click the button below to accept your invitation and create your account.
          </Text>
          <Button
            href={inviteUrl}
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
            Accept Invitation
          </Button>
          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            If you weren&apos;t expecting this invitation, you can ignore this email. The link will
            expire in 48 hours.
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            Or copy and paste this URL into your browser:{' '}
            <Link href={inviteUrl} style={{ color: '#2563eb' }}>
              {inviteUrl}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default InviteEmail

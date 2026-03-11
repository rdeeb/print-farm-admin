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

export interface JobFailedEmailProps {
  jobName: string
  printerName: string
  failureReason: string
  farmName: string
  appUrl: string
}

export function JobFailedEmail({
  jobName,
  printerName,
  failureReason,
  farmName,
  appUrl,
}: JobFailedEmailProps): ReactElement {
  const queueUrl = `${appUrl}/queue`

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
          <Heading style={{ color: '#dc2626', fontSize: '24px', marginBottom: '8px' }}>
            Print Job Failed
          </Heading>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            A print job in your farm <strong>{farmName}</strong> has failed and requires your
            attention.
          </Text>
          <Container
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              padding: '16px',
              margin: '16px 0',
            }}
          >
            <Text style={{ color: '#991b1b', fontSize: '14px', margin: '0 0 4px 0' }}>
              <strong>Job:</strong> {jobName}
            </Text>
            <Text style={{ color: '#991b1b', fontSize: '14px', margin: '0 0 4px 0' }}>
              <strong>Printer:</strong> {printerName}
            </Text>
            <Text style={{ color: '#991b1b', fontSize: '14px', margin: '0' }}>
              <strong>Reason:</strong> {failureReason}
            </Text>
          </Container>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            Visit your print queue to review the failure and requeue or cancel the job.
          </Text>
          <Button
            href={queueUrl}
            style={{
              backgroundColor: '#dc2626',
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
            View Print Queue
          </Button>
          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            This alert was sent by{' '}
            <Link href={appUrl} style={{ color: '#2563eb' }}>
              3D Farm Admin
            </Link>{' '}
            for {farmName}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default JobFailedEmail

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

export interface FilamentLowEmailProps {
  filamentName: string
  color: string
  remainingPercent: number
  farmName: string
  appUrl: string
}

export function FilamentLowEmail({
  filamentName,
  color,
  remainingPercent,
  farmName,
  appUrl,
}: FilamentLowEmailProps): ReactElement {
  const filamentUrl = `${appUrl}/filament`

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
          <Heading style={{ color: '#b45309', fontSize: '24px', marginBottom: '8px' }}>
            Low Filament Alert
          </Heading>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            A filament spool in your farm <strong>{farmName}</strong> is running low and may need
            to be replaced soon.
          </Text>
          <Container
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '6px',
              padding: '16px',
              margin: '16px 0',
            }}
          >
            <Text style={{ color: '#92400e', fontSize: '14px', margin: '0 0 4px 0' }}>
              <strong>Filament:</strong> {filamentName}
            </Text>
            <Text style={{ color: '#92400e', fontSize: '14px', margin: '0 0 4px 0' }}>
              <strong>Color:</strong> {color}
            </Text>
            <Text style={{ color: '#92400e', fontSize: '14px', margin: '0' }}>
              <strong>Remaining:</strong> {remainingPercent}%
            </Text>
          </Container>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            Visit your filament inventory to reorder or replace this spool.
          </Text>
          <Button
            href={filamentUrl}
            style={{
              backgroundColor: '#d97706',
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
            View Filament Inventory
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

export default FilamentLowEmail

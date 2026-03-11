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

export interface OrderOverdueEmailProps {
  orderName: string
  clientName: string
  dueDate: string
  farmName: string
  appUrl: string
}

export function OrderOverdueEmail({
  orderName,
  clientName,
  dueDate,
  farmName,
  appUrl,
}: OrderOverdueEmailProps): ReactElement {
  const ordersUrl = `${appUrl}/orders`

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
          <Heading style={{ color: '#7c3aed', fontSize: '24px', marginBottom: '8px' }}>
            Order Overdue
          </Heading>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            An order in your farm <strong>{farmName}</strong> has passed its due date and is still
            not completed.
          </Text>
          <Container
            style={{
              backgroundColor: '#f5f3ff',
              border: '1px solid #c4b5fd',
              borderRadius: '6px',
              padding: '16px',
              margin: '16px 0',
            }}
          >
            <Text style={{ color: '#4c1d95', fontSize: '14px', margin: '0 0 4px 0' }}>
              <strong>Order:</strong> {orderName}
            </Text>
            <Text style={{ color: '#4c1d95', fontSize: '14px', margin: '0 0 4px 0' }}>
              <strong>Client:</strong> {clientName}
            </Text>
            <Text style={{ color: '#4c1d95', fontSize: '14px', margin: '0' }}>
              <strong>Due Date:</strong> {dueDate}
            </Text>
          </Container>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            Please review this order and update its status or contact the client.
          </Text>
          <Button
            href={ordersUrl}
            style={{
              backgroundColor: '#7c3aed',
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
            View Orders
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

export default OrderOverdueEmail

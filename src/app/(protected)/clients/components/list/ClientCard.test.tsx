import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientCard } from './ClientCard'
import type { Client } from '@/model/client'

const mockClient: Client = {
  id: 'client-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  source: 'DIRECT',
  address: '',
  notes: '',
  createdAt: '2024-01-15T10:00:00Z',
  _count: { orders: 2 },
}

describe('ClientCard', () => {
  it('renders client name and source', () => {
    render(
      <ClientCard
        client={mockClient}
        canEdit={false}
        canDelete={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Direct')).toBeInTheDocument()
  })

  it('displays email and phone when present', () => {
    render(
      <ClientCard
        client={mockClient}
        canEdit={false}
        canDelete={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('555-1234')).toBeInTheDocument()
  })

  it('shows order count', () => {
    render(
      <ClientCard
        client={mockClient}
        canEdit={false}
        canDelete={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByText('2 orders')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked and canEdit is true', async () => {
    const onEdit = jest.fn()
    const user = userEvent.setup()

    render(
      <ClientCard
        client={mockClient}
        canEdit={true}
        canDelete={false}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit client/i })
    await user.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockClient)
  })

  it('hides edit button when canEdit is false', () => {
    render(
      <ClientCard
        client={mockClient}
        canEdit={false}
        canDelete={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(
      screen.queryByRole('button', { name: /edit client/i })
    ).not.toBeInTheDocument()
  })

  it('shows delete button when canDelete is true and client has no orders', async () => {
    const clientWithNoOrders = { ...mockClient, _count: { orders: 0 } }
    render(
      <ClientCard
        client={clientWithNoOrders}
        canEdit={true}
        canDelete={true}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })

  it('hides delete button when client has orders', () => {
    render(
      <ClientCard
        client={mockClient}
        canEdit={true}
        canDelete={true}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )

    // With orders, only edit button should be present (delete is conditionally hidden)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
  })
})

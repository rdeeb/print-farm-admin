import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilamentTypeCard } from './FilamentTypeCard'
import type { Filament } from '@/model/filament'

const mockFilament: Filament = {
  id: 'filament-1',
  brand: 'Hatchbox',
  type: { id: 'type-1', name: 'PLA', code: 'PLA' },
  color: { id: 'color-1', name: 'Black', hex: '#000000' },
  costPerKg: 25,
  supplier: null,
  notes: null,
  spools: [
    {
      id: 'spool-1',
      weight: 1000,
      remainingWeight: 800,
      remainingPercent: 80,
    },
  ],
  totalRemainingWeight: 800,
  _count: { spools: 1 },
}

describe('FilamentTypeCard', () => {
  it('renders filament brand, type, and color', () => {
    render(
      <FilamentTypeCard
        filament={mockFilament}
        isExpanded={false}
        currency="USD"
        canEdit={false}
        onToggleExpanded={jest.fn()}
        onAddSpools={jest.fn()}
        onDeleteFilament={jest.fn()}
        onDeleteSpool={jest.fn()}
      />
    )
    expect(screen.getByText(/Hatchbox PLA - Black/)).toBeInTheDocument()
  })

  it('shows spool count and remaining weight', () => {
    render(
      <FilamentTypeCard
        filament={mockFilament}
        isExpanded={false}
        currency="USD"
        canEdit={false}
        onToggleExpanded={jest.fn()}
        onAddSpools={jest.fn()}
        onDeleteFilament={jest.fn()}
        onDeleteSpool={jest.fn()}
      />
    )
    expect(screen.getByText(/1 spool/)).toBeInTheDocument()
    expect(screen.getByText(/0\.80kg remaining/)).toBeInTheDocument()
  })

  it('calls onToggleExpanded when card header is clicked', async () => {
    const onToggleExpanded = jest.fn()
    const user = userEvent.setup()

    render(
      <FilamentTypeCard
        filament={mockFilament}
        isExpanded={false}
        currency="USD"
        canEdit={false}
        onToggleExpanded={onToggleExpanded}
        onAddSpools={jest.fn()}
        onDeleteFilament={jest.fn()}
        onDeleteSpool={jest.fn()}
      />
    )

    await user.click(screen.getByText(/Hatchbox PLA - Black/))
    expect(onToggleExpanded).toHaveBeenCalledWith('filament-1')
  })

  it('calls onAddSpools when Add Spools button is clicked and canEdit is true', async () => {
    const onAddSpools = jest.fn()
    const user = userEvent.setup()

    render(
      <FilamentTypeCard
        filament={mockFilament}
        isExpanded={false}
        currency="USD"
        canEdit={true}
        onToggleExpanded={jest.fn()}
        onAddSpools={onAddSpools}
        onDeleteFilament={jest.fn()}
        onDeleteSpool={jest.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /add spools/i }))
    expect(onAddSpools).toHaveBeenCalledWith(mockFilament)
  })

  it('shows spool list when expanded', () => {
    render(
      <FilamentTypeCard
        filament={mockFilament}
        isExpanded={true}
        currency="USD"
        canEdit={false}
        onToggleExpanded={jest.fn()}
        onAddSpools={jest.fn()}
        onDeleteFilament={jest.fn()}
        onDeleteSpool={jest.fn()}
      />
    )
    expect(screen.getByText('1000g spool')).toBeInTheDocument()
    expect(screen.getByText('800g remaining (80%)')).toBeInTheDocument()
  })
})

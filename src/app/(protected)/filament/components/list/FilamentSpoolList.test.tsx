import { render, screen } from '@testing-library/react'
import { FilamentSpoolList } from './FilamentSpoolList'
import type { FilamentSpool } from '@/model/filament'

function makeSpool(overrides: Partial<FilamentSpool> = {}): FilamentSpool {
  return {
    id: 'spool-1',
    weight: 1000,
    remainingWeight: 500,
    remainingPercent: 50,
    lowStockThreshold: 20,
    ...overrides,
  }
}

describe('FilamentSpoolList', () => {
  describe('empty state', () => {
    it('renders empty message when no spools provided', () => {
      render(
        <FilamentSpoolList
          spools={[]}
          filamentId="filament-1"
          canEdit={false}
          onDeleteSpool={jest.fn()}
        />
      )
      expect(screen.getByText(/no spools yet/i)).toBeInTheDocument()
    })
  })

  describe('badge rendering by stock level', () => {
    it('renders Critical badge (red/destructive) when spool is at 5% remaining', () => {
      const spool = makeSpool({ remainingPercent: 5, remainingWeight: 50, lowStockThreshold: 20 })
      render(
        <FilamentSpoolList
          spools={[spool]}
          filamentId="filament-1"
          canEdit={false}
          onDeleteSpool={jest.fn()}
        />
      )
      // isCritical = remainingPercent <= 10 → true at 5%
      expect(screen.getByText('Critical')).toBeInTheDocument()
      expect(screen.queryByText('Low Stock')).not.toBeInTheDocument()
    })

    it('renders Low Stock badge (amber/warning) when spool is at 15% with threshold=20', () => {
      const spool = makeSpool({ remainingPercent: 15, remainingWeight: 150, lowStockThreshold: 20 })
      render(
        <FilamentSpoolList
          spools={[spool]}
          filamentId="filament-1"
          canEdit={false}
          onDeleteSpool={jest.fn()}
        />
      )
      // isCritical = false (15 > 10), isLow = 15 <= 20 → true
      expect(screen.getByText('Low Stock')).toBeInTheDocument()
      expect(screen.queryByText('Critical')).not.toBeInTheDocument()
    })

    it('renders no stock badge when spool is at 50% with threshold=20', () => {
      const spool = makeSpool({ remainingPercent: 50, remainingWeight: 500, lowStockThreshold: 20 })
      render(
        <FilamentSpoolList
          spools={[spool]}
          filamentId="filament-1"
          canEdit={false}
          onDeleteSpool={jest.fn()}
        />
      )
      // isCritical = false, isLow = false (50 > 20)
      expect(screen.queryByText('Critical')).not.toBeInTheDocument()
      expect(screen.queryByText('Low Stock')).not.toBeInTheDocument()
    })

    it('renders Critical badge at exactly 10% (boundary)', () => {
      const spool = makeSpool({ remainingPercent: 10, remainingWeight: 100, lowStockThreshold: 20 })
      render(
        <FilamentSpoolList
          spools={[spool]}
          filamentId="filament-1"
          canEdit={false}
          onDeleteSpool={jest.fn()}
        />
      )
      // isCritical = remainingPercent <= 10 → true at exactly 10
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })

    it('renders Low Stock badge at exactly the threshold value (boundary)', () => {
      const spool = makeSpool({ remainingPercent: 20, remainingWeight: 200, lowStockThreshold: 20 })
      render(
        <FilamentSpoolList
          spools={[spool]}
          filamentId="filament-1"
          canEdit={false}
          onDeleteSpool={jest.fn()}
        />
      )
      // isCritical = false (20 > 10), isLow = 20 <= 20 → true
      expect(screen.getByText('Low Stock')).toBeInTheDocument()
    })
  })

  describe('spool details rendering', () => {
    it('renders spool weight and remaining info', () => {
      const spool = makeSpool({ weight: 1000, remainingWeight: 500, remainingPercent: 50 })
      render(
        <FilamentSpoolList
          spools={[spool]}
          filamentId="filament-1"
          canEdit={false}
          onDeleteSpool={jest.fn()}
        />
      )
      expect(screen.getByText('1000g spool')).toBeInTheDocument()
      expect(screen.getByText('500g remaining (50%)')).toBeInTheDocument()
    })

    it('renders multiple spools', () => {
      const spools = [
        makeSpool({ id: 'spool-1', weight: 1000, remainingWeight: 500, remainingPercent: 50 }),
        makeSpool({ id: 'spool-2', weight: 500, remainingWeight: 75, remainingPercent: 15, lowStockThreshold: 20 }),
      ]
      render(
        <FilamentSpoolList
          spools={spools}
          filamentId="filament-1"
          canEdit={false}
          onDeleteSpool={jest.fn()}
        />
      )
      expect(screen.getByText('1000g spool')).toBeInTheDocument()
      expect(screen.getByText('500g spool')).toBeInTheDocument()
      // Second spool should have Low Stock badge
      expect(screen.getByText('Low Stock')).toBeInTheDocument()
    })
  })

  describe('delete button', () => {
    it('does not show delete button when canEdit is false', () => {
      const spool = makeSpool()
      render(
        <FilamentSpoolList
          spools={[spool]}
          filamentId="filament-1"
          canEdit={false}
          onDeleteSpool={jest.fn()}
        />
      )
      // No delete trigger button rendered when canEdit is false
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('shows delete button when canEdit is true', () => {
      const spool = makeSpool()
      render(
        <FilamentSpoolList
          spools={[spool]}
          filamentId="filament-1"
          canEdit={true}
          onDeleteSpool={jest.fn()}
        />
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})

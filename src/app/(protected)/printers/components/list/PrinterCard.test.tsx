import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrinterCard } from './PrinterCard'
import type { PrinterData } from '@/model/printer'

const mockPrinter: PrinterData = {
  id: 'printer-1',
  name: 'Bambu X1C #1',
  model: 'X1 Carbon',
  brand: 'Bambu Lab',
  status: 'IDLE',
  buildVolume: { x: 256, y: 256, z: 256 },
  nozzleSize: 0.4,
  powerConsumption: 350,
  cost: 1199,
  isActive: true,
  _count: { printJobs: 42 },
}

describe('PrinterCard', () => {
  it('renders printer name and model', () => {
    render(
      <PrinterCard
        printer={mockPrinter}
        canEdit={false}
        onEdit={jest.fn()}
      />
    )
    expect(screen.getByText('Bambu X1C #1')).toBeInTheDocument()
    expect(screen.getByText('Bambu Lab X1 Carbon')).toBeInTheDocument()
  })

  it('displays status badge', () => {
    render(
      <PrinterCard
        printer={mockPrinter}
        canEdit={false}
        onEdit={jest.fn()}
      />
    )
    expect(screen.getByText('Idle')).toBeInTheDocument()
  })

  it('shows build volume and nozzle when present', () => {
    render(
      <PrinterCard
        printer={mockPrinter}
        canEdit={false}
        onEdit={jest.fn()}
      />
    )
    expect(screen.getByText('256 x 256 x 256 mm')).toBeInTheDocument()
    expect(screen.getByText('0.4mm')).toBeInTheDocument()
  })

  it('shows power consumption and total jobs', () => {
    render(
      <PrinterCard
        printer={mockPrinter}
        canEdit={false}
        onEdit={jest.fn()}
      />
    )
    expect(screen.getByText('350W')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked and canEdit is true', async () => {
    const onEdit = jest.fn()
    const user = userEvent.setup()

    render(
      <PrinterCard
        printer={mockPrinter}
        canEdit={true}
        onEdit={onEdit}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit printer/i })
    await user.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockPrinter)
  })

  it('hides edit button when canEdit is false', () => {
    render(
      <PrinterCard
        printer={mockPrinter}
        canEdit={false}
        onEdit={jest.fn()}
      />
    )
    expect(
      screen.queryByRole('button', { name: /edit printer/i })
    ).not.toBeInTheDocument()
  })
})

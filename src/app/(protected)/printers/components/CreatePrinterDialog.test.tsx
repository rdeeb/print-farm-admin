import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { CreatePrinterDialog } from './CreatePrinterDialog'
import type { PrinterFormData } from '../hooks/usePrinters'
import type { PrinterModel } from '@/model/printer'

const baseFormData: PrinterFormData = {
  name: '',
  technology: 'FDM',
  model: '',
  brand: '',
  nozzleSize: '0.4',
  buildVolumeX: '220',
  buildVolumeY: '220',
  buildVolumeZ: '250',
  powerConsumption: '',
  cost: '',
}

const modelsByBrand: Record<string, PrinterModel[]> = {
  Formlabs: [
    {
      id: 'sla-model-1',
      brand: 'Formlabs',
      model: 'Form 4',
      technology: 'SLA',
      buildVolumeX: 200,
      buildVolumeY: 125,
      buildVolumeZ: 210,
      defaultNozzle: 0.4,
      avgPowerConsumption: 180,
      releaseYear: 2024,
    },
  ],
}

function renderDialog(overrides: Partial<React.ComponentProps<typeof CreatePrinterDialog>> = {}) {
  const onOpenChange = jest.fn()
  const onTechnologySelect = jest.fn()
  const onPresetSelect = jest.fn()
  const onFormDataChange = jest.fn()
  const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault())
  const onReset = jest.fn()

  render(
    <CreatePrinterDialog
      open={true}
      onOpenChange={onOpenChange}
      selectedPreset=""
      onTechnologySelect={onTechnologySelect}
      onPresetSelect={onPresetSelect}
      formData={baseFormData}
      onFormDataChange={onFormDataChange}
      brands={['Formlabs']}
      printerModelsByBrand={modelsByBrand}
      onSubmit={onSubmit}
      onReset={onReset}
      {...overrides}
    />
  )

  return {
    onOpenChange,
    onTechnologySelect,
    onPresetSelect,
    onFormDataChange,
    onSubmit,
    onReset,
  }
}

describe('CreatePrinterDialog wizard flow', () => {
  it('renders all three printer type options initially', () => {
    renderDialog()

    expect(screen.getByRole('button', { name: /select fdm printer type/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select sla printer type/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select sls printer type/i })).toBeInTheDocument()
  })

  it('selects a type, hides other types, and shows details step', async () => {
    const user = userEvent.setup()
    const { onTechnologySelect } = renderDialog()

    await user.click(screen.getByRole('button', { name: /select sla printer type/i }))

    expect(onTechnologySelect).toHaveBeenCalledWith('SLA')
    expect(screen.queryByRole('button', { name: /select fdm printer type/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /select sls printer type/i })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/selected printer type/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /switch type/i })).toBeInTheDocument()
      expect(screen.getByText(/printer preset/i)).toBeInTheDocument()
    })
  })

  it('switches back to type selection', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: /select fdm printer type/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /switch type/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /switch type/i }))

    expect(screen.getByRole('button', { name: /select fdm printer type/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select sla printer type/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select sls printer type/i })).toBeInTheDocument()
  })

  it('submits from the details step', async () => {
    const user = userEvent.setup()
    const { onFormDataChange, onSubmit } = renderDialog({
      formData: {
        ...baseFormData,
        name: 'Printer A',
        model: 'Model A',
      },
    })

    await user.click(screen.getByRole('button', { name: /select fdm printer type/i }))
    const dialog = screen.getByRole('dialog')
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /add printer/i })).toBeInTheDocument()
    )

    await user.clear(screen.getByLabelText(/printer name/i))
    await user.type(screen.getByLabelText(/printer name/i), 'Printer One')
    expect(onFormDataChange).toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: /add printer/i }))
    expect(onSubmit).toHaveBeenCalled()
  })
})

import { CreatePrinterDialog } from '../CreatePrinterDialog'
import { EditPrinterDialog } from '../EditPrinterDialog'
import type { PrinterFormData, EditFormData } from '../../hooks/usePrinters'
import type { PrinterModel, PrinterData } from '@/model/printer'

interface PrintersPageHeaderProps {
  canEdit: boolean
  isDialogOpen: boolean
  onDialogOpenChange: (open: boolean) => void
  selectedPreset: string
  onTechnologySelect: (technology: 'FDM' | 'SLA' | 'SLS') => void
  onPresetSelect: (presetId: string) => void
  formData: PrinterFormData
  onFormDataChange: (data: PrinterFormData) => void
  brands: string[]
  printerModelsByBrand: Record<string, PrinterModel[]>
  onCreateSubmit: (e: React.FormEvent) => void
  onFormReset: () => void
  editingPrinter: PrinterData | null
  onEditingPrinterChange: (printer: PrinterData | null) => void
  editForm: EditFormData
  onEditFormChange: (data: EditFormData) => void
  isSavingEdit: boolean
  onEditSubmit: (e: React.FormEvent) => void
}

export function PrintersPageHeader({
  canEdit,
  isDialogOpen,
  onDialogOpenChange,
  selectedPreset,
  onTechnologySelect,
  onPresetSelect,
  formData,
  onFormDataChange,
  brands,
  printerModelsByBrand,
  onCreateSubmit,
  onFormReset,
  editingPrinter,
  onEditingPrinterChange,
  editForm,
  onEditFormChange,
  isSavingEdit,
  onEditSubmit,
}: PrintersPageHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Printers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your 3D printers and monitor their status
        </p>
      </div>

      {canEdit && (
        <>
          <CreatePrinterDialog
            open={isDialogOpen}
            onOpenChange={onDialogOpenChange}
            selectedPreset={selectedPreset}
            onTechnologySelect={onTechnologySelect}
            onPresetSelect={onPresetSelect}
            formData={formData}
            onFormDataChange={onFormDataChange}
            brands={brands}
            printerModelsByBrand={printerModelsByBrand}
            onSubmit={onCreateSubmit}
            onReset={onFormReset}
          />

          <EditPrinterDialog
            open={!!editingPrinter}
            onOpenChange={(open) => {
              if (!open) onEditingPrinterChange(null)
            }}
            editForm={editForm}
            onEditFormChange={onEditFormChange}
            isSaving={isSavingEdit}
            onSubmit={onEditSubmit}
            editingPrinter={editingPrinter}
          />
        </>
      )}
    </div>
  )
}
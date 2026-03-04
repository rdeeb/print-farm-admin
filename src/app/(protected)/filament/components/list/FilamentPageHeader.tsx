import { CreateFilamentDialog } from '../CreateFilamentDialog'
import type { FilamentFormData } from '../../hooks/useFilament'
import type { FilamentType, FilamentColor } from '@/model/filament'

interface FilamentPageHeaderProps {
  canEdit: boolean
  isDialogOpen: boolean
  onOpenChange: (open: boolean) => void
  filamentForm: FilamentFormData
  onFilamentFormChange: (data: FilamentFormData) => void
  brandSearch: string
  onBrandSearchChange: (value: string) => void
  showBrandSuggestions: boolean
  onShowBrandSuggestionsChange: (value: boolean) => void
  brandSuggestions: string[]
  onBrandSelect: (brand: string) => void
  types: FilamentType[]
  filteredColors: FilamentColor[]
  onSubmit: (e: React.FormEvent) => void
  onReset: () => void
}

export function FilamentPageHeader({
  canEdit,
  isDialogOpen,
  onOpenChange,
  filamentForm,
  onFilamentFormChange,
  brandSearch,
  onBrandSearchChange,
  showBrandSuggestions,
  onShowBrandSuggestionsChange,
  brandSuggestions,
  onBrandSelect,
  types,
  filteredColors,
  onSubmit,
  onReset,
}: FilamentPageHeaderProps) {
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open) onReset()
  }

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Filament Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your filament types and track spool inventory
        </p>
      </div>

      {canEdit && (
        <CreateFilamentDialog
          open={isDialogOpen}
          onOpenChange={handleOpenChange}
          filamentForm={filamentForm}
          onFilamentFormChange={onFilamentFormChange}
          brandSearch={brandSearch}
          onBrandSearchChange={onBrandSearchChange}
          showBrandSuggestions={showBrandSuggestions}
          onShowBrandSuggestionsChange={onShowBrandSuggestionsChange}
          brandSuggestions={brandSuggestions}
          onBrandSelect={onBrandSelect}
          types={types}
          filteredColors={filteredColors}
          onSubmit={onSubmit}
          onCancel={() => handleOpenChange(false)}
        />
      )}
    </div>
  )
}

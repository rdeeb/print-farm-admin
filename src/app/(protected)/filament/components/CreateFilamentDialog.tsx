'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import type { FilamentFormData } from '../hooks/useFilament'
import type { FilamentType, FilamentColor } from '@/model/filament'

interface CreateFilamentDialogProps {
  open: boolean
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
  onCancel: () => void
}

export function CreateFilamentDialog({
  open,
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
  onCancel,
}: CreateFilamentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
          <DialogDescription>Define a material by brand, type, and color</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2 relative">
            <Label>Brand</Label>
            <Input
              value={brandSearch}
              onChange={(e) => {
                onBrandSearchChange(e.target.value)
                onFilamentFormChange({ ...filamentForm, brand: e.target.value })
                onShowBrandSuggestionsChange(true)
              }}
              onFocus={() => onShowBrandSuggestionsChange(true)}
              onBlur={() => setTimeout(() => onShowBrandSuggestionsChange(false), 200)}
              placeholder="Search or enter brand..."
              required
              autoComplete="off"
            />
            {showBrandSuggestions && brandSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {brandSuggestions.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                    onMouseDown={() => onBrandSelect(brand)}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Technology</Label>
            <Select
              value={filamentForm.technology}
              onValueChange={(value: 'FDM' | 'SLA' | 'SLS') =>
                onFilamentFormChange({
                  ...filamentForm,
                  technology: value,
                  typeId: '',
                  colorId: '',
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FDM">FDM (Filament)</SelectItem>
                <SelectItem value="SLA">SLA (Resin)</SelectItem>
                <SelectItem value="SLS">SLS (Powder)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Material Type</Label>
            <Select
              value={filamentForm.typeId}
              onValueChange={(value) =>
                onFilamentFormChange({ ...filamentForm, typeId: value, colorId: '' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <Select
              value={filamentForm.colorId}
              onValueChange={(value) =>
                onFilamentFormChange({ ...filamentForm, colorId: value })
              }
              disabled={!filamentForm.typeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {filteredColors.map((color) => (
                  <SelectItem key={color.id} value={color.id}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {filamentForm.technology === 'SLA' ? 'Cost per liter' : 'Cost per kg'}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={filamentForm.costPerKg}
                onChange={(e) =>
                  onFilamentFormChange({ ...filamentForm, costPerKg: e.target.value })
                }
                placeholder="25.99"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Base Landed Cost per {filamentForm.technology === 'SLA' ? 'ml' : 'g'}
              </Label>
              <Input
                type="number"
                step="0.0001"
                value={filamentForm.baseLandedCostPerUnit}
                onChange={(e) =>
                  onFilamentFormChange({
                    ...filamentForm,
                    baseLandedCostPerUnit: e.target.value,
                  })
                }
                placeholder={filamentForm.technology === 'SLA' ? '0.08' : '0.03'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input
                value={filamentForm.supplier}
                onChange={(e) =>
                  onFilamentFormChange({ ...filamentForm, supplier: e.target.value })
                }
                placeholder="Amazon"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Create & Add Spools</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

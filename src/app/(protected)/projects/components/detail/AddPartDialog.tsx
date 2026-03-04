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
import type { PartFormData } from '../../hooks/useProjectDetail'
import type { FilamentType, FilamentColor } from '@/model/project'

interface AddPartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPart: { id: string; name: string } | null
  partForm: PartFormData
  onPartFormChange: (data: PartFormData) => void
  types: FilamentType[]
  filteredColors: FilamentColor[]
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function AddPartDialog({
  open,
  onOpenChange,
  editingPart,
  partForm,
  onPartFormChange,
  types,
  filteredColors,
  onSubmit,
  onCancel,
}: AddPartDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Part
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingPart ? 'Edit Part' : 'Add New Part'}</DialogTitle>
          <DialogDescription>
            {editingPart ? 'Update the part details' : 'Add a new part to this project'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="partName">Part Name</Label>
            <Input
              id="partName"
              value={partForm.name}
              onChange={(e) => onPartFormChange({ ...partForm, name: e.target.value })}
              placeholder="e.g., Base Plate"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partDescription">Description</Label>
            <Input
              id="partDescription"
              value={partForm.description}
              onChange={(e) => onPartFormChange({ ...partForm, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filamentWeight">Filament (g)</Label>
              <Input
                id="filamentWeight"
                type="number"
                step="0.1"
                value={partForm.filamentWeight}
                onChange={(e) => onPartFormChange({ ...partForm, filamentWeight: e.target.value })}
                placeholder="50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printTime">Print Time (min)</Label>
              <Input
                id="printTime"
                type="number"
                value={partForm.printTime}
                onChange={(e) => onPartFormChange({ ...partForm, printTime: e.target.value })}
                placeholder="120"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity per Set</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={partForm.quantity}
              onChange={(e) => onPartFormChange({ ...partForm, quantity: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Filament Type</Label>
            <Select
              value={partForm.filamentTypeId || 'none'}
              onValueChange={(value) => {
                const nextTypeId = value === 'none' ? '' : value
                onPartFormChange({ ...partForm, filamentTypeId: nextTypeId, filamentColorId: '' })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No filament requirement</SelectItem>
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
              value={partForm.filamentColorId || 'none'}
              onValueChange={(value) =>
                onPartFormChange({ ...partForm, filamentColorId: value === 'none' ? '' : value })
              }
              disabled={!partForm.filamentTypeId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    partForm.filamentTypeId ? 'Select color' : 'Select type first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No color assigned</SelectItem>
                {filteredColors.map((color) => (
                  <SelectItem key={color.id} value={color.id}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{editingPart ? 'Update Part' : 'Add Part'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

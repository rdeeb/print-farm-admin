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
} from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import type { Filament } from '@/model/filament'
import type { SpoolRow } from '../hooks/useFilament'

interface CreateSpoolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedFilament: Filament | null
  spoolsToAdd: SpoolRow[]
  onAddSpoolRow: () => void
  onRemoveSpoolRow: (index: number) => void
  onUpdateSpoolRow: (
    index: number,
    field: 'weight' | 'capacity' | 'remainingPercent' | 'landedCostTotal',
    value: string
  ) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function CreateSpoolDialog({
  open,
  onOpenChange,
  selectedFilament,
  spoolsToAdd,
  onAddSpoolRow,
  onRemoveSpoolRow,
  onUpdateSpoolRow,
  onSubmit,
  onCancel,
}: CreateSpoolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Spools</DialogTitle>
          <DialogDescription>
            {selectedFilament && (
              <span className="flex items-center space-x-2 mt-1">
                <span
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedFilament.color.hex }}
                />
                <span>
                  {selectedFilament.brand} {selectedFilament.type.code} -{' '}
                  {selectedFilament.color.name}
                </span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {spoolsToAdd.map((spool, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-500 w-6">#{index + 1}</span>
                <div className="flex-1">
                  <Label className="text-xs">Size</Label>
                  <Select
                    value={spool.weight}
                    onValueChange={(value) =>
                      onUpdateSpoolRow(index, 'weight', value)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="250">250</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                      <SelectItem value="750">750</SelectItem>
                      <SelectItem value="1000">1000</SelectItem>
                      <SelectItem value="2000">2000</SelectItem>
                      <SelectItem value="3000">3000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20">
                  <Label className="text-xs">Cost</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={spool.landedCostTotal}
                    onChange={(e) =>
                      onUpdateSpoolRow(index, 'landedCostTotal', e.target.value)
                    }
                    className="h-9"
                    placeholder="Auto"
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs">Remaining</Label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={spool.remainingPercent}
                      onChange={(e) =>
                        onUpdateSpoolRow(index, 'remainingPercent', e.target.value)
                      }
                      className="h-9"
                    />
                    <span className="ml-1 text-sm">%</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 w-16 text-right">
                  {Math.round(parseFloat(spool.capacity || spool.weight) * (parseInt(spool.remainingPercent) / 100))}
                  {selectedFilament?.defaultUnit === 'MILLILITER' ? 'ml' : 'g'}
                </div>
                {spoolsToAdd.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveSpoolRow(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onAddSpoolRow}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Spool
          </Button>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Add {spoolsToAdd.length} Spool{spoolsToAdd.length > 1 ? 's' : ''}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

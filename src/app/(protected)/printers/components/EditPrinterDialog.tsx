'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { EditFormData } from '../hooks/usePrinters'

interface EditPrinterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editForm: EditFormData
  onEditFormChange: (data: EditFormData) => void
  isSaving: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function EditPrinterDialog({
  open,
  onOpenChange,
  editForm,
  onEditFormChange,
  isSaving,
  onSubmit,
}: EditPrinterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Printer</DialogTitle>
          <DialogDescription>
            Update name, power consumption, and cost. Operating cost per hour =
            cost ÷ 13140 (used in landed cost).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={editForm.name}
              onChange={(e) =>
                onEditFormChange({ ...editForm, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-power">Avg. Power (W)</Label>
            <Input
              id="edit-power"
              type="number"
              min="0"
              value={editForm.powerConsumption}
              onChange={(e) =>
                onEditFormChange({
                  ...editForm,
                  powerConsumption: e.target.value,
                })
              }
              placeholder="e.g., 350"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cost">Printer Cost</Label>
            <Input
              id="edit-cost"
              type="number"
              min="0"
              step="0.01"
              value={editForm.cost}
              onChange={(e) =>
                onEditFormChange({ ...editForm, cost: e.target.value })
              }
              placeholder="Total cost; operating cost/hr = cost ÷ 13140"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

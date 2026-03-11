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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MaintenanceTab } from './MaintenanceTab'
import type { EditFormData } from '../hooks/usePrinters'
import type { PrinterData } from '@/model/printer'

interface EditPrinterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editForm: EditFormData
  onEditFormChange: (data: EditFormData) => void
  isSaving: boolean
  onSubmit: (e: React.FormEvent) => void
  editingPrinter: PrinterData | null
}

export function EditPrinterDialog({
  open,
  onOpenChange,
  editForm,
  onEditFormChange,
  isSaving,
  onSubmit,
  editingPrinter,
}: EditPrinterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Printer</DialogTitle>
          <DialogDescription>
            Update printer settings and maintenance schedule.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="maintenance" className="flex-1">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <form onSubmit={onSubmit} className="space-y-4 mt-2">
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
              <div className="space-y-2">
                <Label htmlFor="edit-maintenance-interval">
                  Maintenance Interval (days)
                </Label>
                <Input
                  id="edit-maintenance-interval"
                  type="number"
                  min="1"
                  value={editForm.maintenanceIntervalDays}
                  onChange={(e) =>
                    onEditFormChange({
                      ...editForm,
                      maintenanceIntervalDays: e.target.value,
                    })
                  }
                  placeholder="e.g., 30"
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
          </TabsContent>

          <TabsContent value="maintenance">
            {editingPrinter ? (
              <div className="mt-2">
                <MaintenanceTab
                  printerId={editingPrinter.id}
                  printerName={editingPrinter.name}
                  maintenanceIntervalDays={editingPrinter.maintenanceIntervalDays ?? null}
                  nextMaintenanceDue={editingPrinter.nextMaintenanceDue ?? null}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-4">No printer selected.</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

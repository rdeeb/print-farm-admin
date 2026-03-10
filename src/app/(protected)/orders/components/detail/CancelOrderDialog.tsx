'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertTriangle } from 'lucide-react'
import type { Order } from '@/model/order'

export type FilamentHandling = 'RETURN_TO_INVENTORY' | 'MARK_AS_WASTE'

interface CancelOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  isSaving: boolean
  filamentHandling: FilamentHandling
  onFilamentHandlingChange: (value: FilamentHandling) => void
  onConfirm: () => void
  hasPrintingParts: boolean
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  order,
  isSaving,
  filamentHandling,
  onFilamentHandlingChange,
  onConfirm,
  hasPrintingParts,
}: CancelOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
              {order.project && (
                <div className="text-sm text-gray-600">{order.project.name}</div>
              )}
              {order.client && (
                <div className="text-sm text-gray-500">{order.client.name}</div>
              )}
            </div>

            <div className="text-sm text-gray-600 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              Canceling this order will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Cancel all queued print jobs</li>
                <li>Stop any currently printing jobs</li>
                <li>Reset printers to idle status</li>
                {hasPrintingParts && <li>Handle filament from in-progress prints</li>}
              </ul>
            </div>

            {hasPrintingParts && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Filament handling for in-progress prints:
                </Label>
                <RadioGroup value={filamentHandling} onValueChange={onFilamentHandlingChange}>
                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="RETURN_TO_INVENTORY" id="return" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="return" className="font-medium cursor-pointer">
                        Return to inventory
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Add unused filament back to inventory (assumes material can be reused)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="MARK_AS_WASTE" id="waste" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="waste" className="font-medium cursor-pointer">
                        Mark as waste
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Track used filament as waste/loss (material cannot be recovered)
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isSaving}
          >
            {isSaving ? 'Canceling...' : 'Cancel Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

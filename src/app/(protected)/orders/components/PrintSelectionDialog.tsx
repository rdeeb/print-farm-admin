'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Printer as PrinterIcon } from 'lucide-react'
import type { OrderPart } from '@/model/order'
import type { Printer } from '@/model/printer'
import type { SelectedOption } from '../hooks/useOrderDetail'

interface PrintSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedOrderPart: OrderPart | null
  selectedFilamentId: string
  selectedPrinterId: string
  selectedOptions: SelectedOption[]
  activePrinters: Printer[]
  isSelectedPrinterAvailable: boolean
  isSaving: boolean
  onPrinterChange: (value: string) => void
  onFilamentChange: (value: string) => void
  onConfirm: () => void
}

export function PrintSelectionDialog({
  open,
  onOpenChange,
  selectedOrderPart,
  selectedFilamentId,
  selectedPrinterId,
  selectedOptions,
  activePrinters,
  isSelectedPrinterAvailable,
  isSaving,
  onPrinterChange,
  onFilamentChange,
  onConfirm,
}: PrintSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSelectedPrinterAvailable ? 'Start Printing' : 'Queue Print Job'}
          </DialogTitle>
          <DialogDescription>
            {isSelectedPrinterAvailable
              ? 'Select a printer and filament to start this print job'
              : 'Select a printer and filament to queue this print job'}
          </DialogDescription>
        </DialogHeader>
        {selectedOrderPart?.part.filamentColor ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{selectedOrderPart.part.name}</span>
              <span className="text-gray-400 mx-2">•</span>
              {selectedOrderPart.quantity} parts
              <span className="text-gray-400 mx-2">•</span>
              {selectedOrderPart.part.filamentWeight * selectedOrderPart.quantity}g total
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <PrinterIcon className="h-4 w-4" />
                Printer *
              </Label>
              <Select value={selectedPrinterId} onValueChange={onPrinterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a printer" />
                </SelectTrigger>
                <SelectContent>
                  {activePrinters.length > 0 ? (
                    activePrinters.map((printer) => {
                      const isIdle = printer.status === 'IDLE'
                      return (
                        <SelectItem key={printer.id} value={printer.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${isIdle ? 'bg-green-500' : 'bg-amber-500'}`}
                            />
                            {printer.name}
                            <span className="text-muted-foreground">
                              {isIdle ? '(Available)' : `(${printer.queueCount ?? 0} in queue)`}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="none" disabled>
                      No printers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedPrinterId && !isSelectedPrinterAvailable && (
                <p className="text-xs text-amber-600">
                  This printer is busy. The job will be added to its queue.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Filament *</Label>
              <Select value={selectedFilamentId} onValueChange={onFilamentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select filament" />
                </SelectTrigger>
                <SelectContent>
                  {selectedOptions.length > 0 ? (
                    selectedOptions.map((option) => (
                      <SelectItem
                        key={option.filament.id}
                        value={option.filament.id}
                        disabled={!option.canCover}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: option.filament.color.hex }}
                          />
                          {option.filament.brand} {option.filament.type.code} -{' '}
                          {option.filament.color.name}
                          <span className="text-muted-foreground">
                            ({option.printableCount} parts available)
                          </span>
                          {!option.canCover && <span className="text-red-500">(insufficient)</span>}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No matching filament in stock
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                disabled={!selectedFilamentId || !selectedPrinterId || isSaving}
              >
                {isSaving
                  ? isSelectedPrinterAvailable
                    ? 'Starting...'
                    : 'Queueing...'
                  : isSelectedPrinterAvailable
                    ? 'Start Printing'
                    : 'Add to Queue'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No filament requirement set for this part.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

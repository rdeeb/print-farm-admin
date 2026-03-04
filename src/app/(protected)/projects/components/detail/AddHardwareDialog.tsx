'use client'

import Link from 'next/link'
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
import { formatCurrency } from '@/lib/utils'
import { UNIT_LABELS } from '../../constants'
import type { HardwareFormData } from '../../hooks/useProjectDetail'
import type { ProjectHardware } from '@/model/project'
import type { Hardware } from '@/model/hardware'

interface AddHardwareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingHardware: ProjectHardware | null
  hardwareForm: HardwareFormData
  onHardwareFormChange: (data: HardwareFormData) => void
  availableHardware: Hardware[]
  currency: string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function AddHardwareDialog({
  open,
  onOpenChange,
  editingHardware,
  hardwareForm,
  onHardwareFormChange,
  availableHardware,
  currency,
  onSubmit,
  onCancel,
}: AddHardwareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={availableHardware.length === 0 && !editingHardware}>
          <Plus className="h-4 w-4 mr-2" />
          Add Hardware
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingHardware ? 'Edit Hardware' : 'Add Hardware'}</DialogTitle>
          <DialogDescription>
            {editingHardware
              ? 'Update the quantity needed'
              : 'Select hardware and specify quantity needed per unit'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          {editingHardware ? (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{editingHardware.hardware.name}</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(
                  editingHardware.hardware.packPrice / editingHardware.hardware.packQuantity,
                  currency
                )}{' '}
                per {UNIT_LABELS[editingHardware.hardware.packUnit].slice(0, -1)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Hardware Item</Label>
              <Select
                value={hardwareForm.hardwareId}
                onValueChange={(value) =>
                  onHardwareFormChange({ ...hardwareForm, hardwareId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hardware" />
                </SelectTrigger>
                <SelectContent>
                  {availableHardware.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{h.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatCurrency(h.packPrice / h.packQuantity, currency)}/
                          {UNIT_LABELS[h.packUnit].slice(0, -1)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableHardware.length === 0 && (
                <p className="text-sm text-gray-500">
                  All hardware items have been added.{' '}
                  <Link href="/hardware" className="text-indigo-600 hover:underline">
                    Add more hardware
                  </Link>
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="hardwareQuantity">Quantity per Unit</Label>
            <Input
              id="hardwareQuantity"
              type="number"
              step="0.1"
              min="0.1"
              value={hardwareForm.quantity}
              onChange={(e) =>
                onHardwareFormChange({ ...hardwareForm, quantity: e.target.value })
              }
              placeholder="2"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!editingHardware && !hardwareForm.hardwareId}>
              {editingHardware ? 'Update' : 'Add Hardware'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

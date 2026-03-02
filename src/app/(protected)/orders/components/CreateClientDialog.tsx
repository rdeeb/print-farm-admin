'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import type { ClientFormData } from '../hooks/useOrders'

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ClientFormData
  onFormDataChange: (data: ClientFormData) => void
  onSubmit: (e: React.FormEvent) => void
}

export function CreateClientDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
}: CreateClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>Add a new client to the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Name</Label>
            <Input
              id="clientName"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder="Client name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Phone</Label>
              <Input
                id="clientPhone"
                value={formData.phone}
                onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.email}
                onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSource">Source</Label>
            <Select
              value={formData.source}
              onValueChange={(value) => onFormDataChange({ ...formData, source: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIRECT">Direct</SelectItem>
                <SelectItem value="FACEBOOK">Facebook</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                <SelectItem value="WEBSITE">Website</SelectItem>
                <SelectItem value="REFERRAL">Referral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Client</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

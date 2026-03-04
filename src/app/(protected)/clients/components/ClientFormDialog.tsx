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
import type { ClientFormData } from '../hooks/useClients'
import type { Client } from '@/model/client'

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingClient: Client | null
  formData: ClientFormData
  onFormDataChange: (data: ClientFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function ClientFormDialog({
  open,
  onOpenChange,
  editingClient,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
}: ClientFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingClient ? 'Edit Client' : 'Create New Client'}</DialogTitle>
          <DialogDescription>
            {editingClient ? 'Update client information' : 'Add a new client to your database'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder="Client name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
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

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => onFormDataChange({ ...formData, address: e.target.value })}
              placeholder="Client address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{editingClient ? 'Update Client' : 'Create Client'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

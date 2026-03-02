'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, User, UserPlus } from 'lucide-react'
import type { Client } from '@/model/client'
import type { Project } from '@/model/project'
import type { OrderFormData } from '../hooks/useOrders'

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  clients: Client[]
  clientSearchTerm: string
  selectedClient: Client | null
  formData: OrderFormData
  onFormDataChange: (data: OrderFormData) => void
  onClientSearchChange: (value: string) => void
  onSelectClient: (clientId: string) => void
  onClearClient: () => void
  onSubmit: (e: React.FormEvent) => void
  onOpenNewClient: () => void
  canEdit: boolean
}

export function CreateOrderDialog({
  open,
  onOpenChange,
  projects,
  clients,
  clientSearchTerm,
  selectedClient,
  formData,
  onFormDataChange,
  onClientSearchChange,
  onSelectClient,
  onClearClient,
  onSubmit,
  onOpenNewClient,
  canEdit,
}: CreateOrderDialogProps) {
  if (!canEdit) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>Add a new client order to the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Client</Label>
              <Button type="button" variant="ghost" size="sm" onClick={onOpenNewClient}>
                <UserPlus className="h-4 w-4 mr-1" />
                New Client
              </Button>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Search clients..."
                value={clientSearchTerm}
                onChange={(e) => onClientSearchChange(e.target.value)}
                className="mb-2"
              />

              {selectedClient ? (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{selectedClient.name}</p>
                        <p className="text-sm text-gray-500">
                          {selectedClient.email || selectedClient.phone || 'No contact info'}
                        </p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={onClearClient}>
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                  {clients.length > 0 ? (
                    clients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          onSelectClient(client.id)
                          onClientSearchChange('')
                        }}
                      >
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-500">
                          {client.email || client.phone || 'No contact info'}
                          {client._count?.orders !== undefined &&
                            ` - ${client._count.orders} orders`}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No clients found. Create one first.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => onFormDataChange({ ...formData, projectId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => onFormDataChange({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => onFormDataChange({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => onFormDataChange({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this order"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.clientId || !formData.projectId}>
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

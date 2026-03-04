import { CreateOrderDialog } from '../CreateOrderDialog'
import type { Project } from '@/model/project'
import type { Client } from '@/model/client'
import type { OrderFormData } from '../../hooks/useOrders'

interface OrdersPageHeaderProps {
  canEdit: boolean
  isDialogOpen: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  clients: Client[]
  clientSearchTerm: string
  selectedClient: Client | null
  formData: OrderFormData
  onFormDataChange: (data: OrderFormData) => void
  onClientSearchChange: (search: string) => void
  onSelectClient: (id: string) => void
  onClearClient: () => void
  onSubmit: (e: React.FormEvent) => void
  onOpenNewClient: () => void
}

export function OrdersPageHeader({
  canEdit,
  isDialogOpen,
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
}: OrdersPageHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage client orders and track progress
        </p>
      </div>

      {canEdit && (
        <CreateOrderDialog
          open={isDialogOpen}
          onOpenChange={onOpenChange}
          projects={projects}
          clients={clients}
          clientSearchTerm={clientSearchTerm}
          selectedClient={selectedClient}
          formData={formData}
          onFormDataChange={onFormDataChange}
          onClientSearchChange={onClientSearchChange}
          onSelectClient={onSelectClient}
          onClearClient={onClearClient}
          onSubmit={onSubmit}
          onOpenNewClient={onOpenNewClient}
          canEdit={canEdit}
        />
      )}
    </div>
  )
}

import { ClientFormDialog } from '../ClientFormDialog'
import type { ClientFormData } from '../../hooks/useClients'
import type { Client } from '@/model/client'

interface ClientsPageHeaderProps {
  canEdit: boolean
  isDialogOpen: boolean
  onOpenChange: (open: boolean) => void
  editingClient: Client | null
  formData: ClientFormData
  onFormDataChange: (data: ClientFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onReset: () => void
}

export function ClientsPageHeader({
  canEdit,
  isDialogOpen,
  onOpenChange,
  editingClient,
  formData,
  onFormDataChange,
  onSubmit,
  onReset,
}: ClientsPageHeaderProps) {
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open) onReset()
  }

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your client database</p>
      </div>

      {canEdit && (
        <ClientFormDialog
          open={isDialogOpen}
          onOpenChange={handleOpenChange}
          editingClient={editingClient}
          formData={formData}
          onFormDataChange={onFormDataChange}
          onSubmit={onSubmit}
          onCancel={() => handleOpenChange(false)}
        />
      )}
    </div>
  )
}

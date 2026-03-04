import { ClientCard } from './ClientCard'
import { ClientsEmptyState } from './ClientsEmptyState'
import type { Client } from '@/model/client'

interface ClientsGridProps {
  clients: Client[]
  canEdit: boolean
  canDelete: boolean
  totalClientCount: number
  onEdit: (client: Client) => void
  onDelete: (clientId: string) => void
}

export function ClientsGrid({
  clients,
  canEdit,
  canDelete,
  totalClientCount,
  onEdit,
  onDelete,
}: ClientsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <ClientCard
          key={client.id}
          client={client}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {clients.length === 0 && <ClientsEmptyState hasClients={totalClientCount > 0} />}
    </div>
  )
}

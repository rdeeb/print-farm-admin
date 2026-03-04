import { Card, CardContent } from '@/components/ui/card'
import { User } from 'lucide-react'

interface ClientsEmptyStateProps {
  hasClients: boolean
}

export function ClientsEmptyState({ hasClients }: ClientsEmptyStateProps) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <User className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
        <p className="text-gray-500 text-center mb-4">
          {hasClients ? "No clients match your current filters." : "You haven't added any clients yet."}
        </p>
      </CardContent>
    </Card>
  )
}

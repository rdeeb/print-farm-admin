import { Card, CardContent } from '@/components/ui/card'
import { Package } from 'lucide-react'

interface FilamentEmptyStateProps {
  hasFilaments: boolean
}

export function FilamentEmptyState({ hasFilaments }: FilamentEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No filaments found</h3>
        <p className="text-gray-500 text-center mb-4">
          {hasFilaments
            ? 'No filaments match your search.'
            : 'Start by adding a filament type.'}
        </p>
      </CardContent>
    </Card>
  )
}

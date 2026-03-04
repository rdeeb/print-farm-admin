import { Card, CardContent } from '@/components/ui/card'
import { Printer } from 'lucide-react'

interface PrintersEmptyStateProps {
  hasPrinters: boolean
}

export function PrintersEmptyState({ hasPrinters }: PrintersEmptyStateProps) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Printer className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No printers found</h3>
        <p className="text-gray-500 text-center mb-4">
          {hasPrinters
            ? 'No printers match your current filter.'
            : "You haven't added any printers yet."}
        </p>
      </CardContent>
    </Card>
  )
}

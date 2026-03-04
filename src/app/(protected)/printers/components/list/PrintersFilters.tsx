'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PrintersFiltersProps {
  filterStatus: string
  onFilterStatusChange: (value: string) => void
  filteredCount: number
}

export function PrintersFilters({
  filterStatus,
  onFilterStatusChange,
  filteredCount,
}: PrintersFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Select
            value={filterStatus || 'all'}
            onValueChange={(v) => onFilterStatusChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="IDLE">Idle</SelectItem>
              <SelectItem value="PRINTING">Printing</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="OFFLINE">Offline</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-gray-500">
            {filteredCount} printer{filteredCount !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

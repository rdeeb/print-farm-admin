'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

interface ClientsFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterSource: string
  onFilterSourceChange: (value: string) => void
}

export function ClientsFilters({
  searchTerm,
  onSearchChange,
  filterSource,
  onFilterSourceChange,
}: ClientsFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select
            value={filterSource || 'all'}
            onValueChange={(v) => onFilterSourceChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="DIRECT">Direct</SelectItem>
              <SelectItem value="FACEBOOK">Facebook</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="WEBSITE">Website</SelectItem>
              <SelectItem value="REFERRAL">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

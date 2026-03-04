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
import type { FilamentType } from '@/model/filament'

interface FilamentFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterType: string
  onFilterTypeChange: (value: string) => void
  lowStockOnly: boolean
  onLowStockOnlyChange: (value: boolean) => void
  types: FilamentType[]
}

export function FilamentFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  lowStockOnly,
  onLowStockOnlyChange,
  types,
}: FilamentFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search filaments..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select
            value={filterType || 'all'}
            onValueChange={(v) => onFilterTypeChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => onLowStockOnlyChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            Low stock only
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

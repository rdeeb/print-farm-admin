'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LayoutList, Columns3, Search } from 'lucide-react'

interface OrdersFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onFilterStatusChange: (value: string) => void
  filterPriority: string
  onFilterPriorityChange: (value: string) => void
  sortOrder: string
  onSortOrderChange: (value: string) => void
  viewMode: 'list' | 'board'
  onViewModeChange: (mode: 'list' | 'board') => void
  quickFilter: string
  onQuickFilterClear: () => void
}

export function OrdersFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterPriority,
  onFilterPriorityChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
  quickFilter,
  onQuickFilterClear,
}: OrdersFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {quickFilter && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Showing:</span>
            <Badge variant="secondary" className="gap-1">
              {quickFilter === 'due-today' ? 'Due today' : 'Need action'}
              <button
                type="button"
                onClick={onQuickFilterClear}
                className="ml-1 rounded hover:bg-gray-300 px-1"
                aria-label="Clear filter"
              >
                ×
              </button>
            </Badge>
          </div>
        )}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select
            value={filterStatus || 'all'}
            onValueChange={(v) => onFilterStatusChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="WAITING">Ready for Assembly</SelectItem>
              <SelectItem value="ASSEMBLED">Assembled</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterPriority || 'all'}
            onValueChange={(v) => onFilterPriorityChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={onSortOrderChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="dueDate-asc">Due Soonest</SelectItem>
              <SelectItem value="dueDate-desc">Due Furthest</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-r-none"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'board' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('board')}
              className="rounded-l-none"
            >
              <Columns3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
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
import { FileText, LayoutList, Columns3, Search } from 'lucide-react'
import { formatDateUTC } from '@/lib/utils'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'
import {
  statusConfig,
  priorityConfig,
  fallbackOrderStatus as fallbackStatus,
  boardColumns,
} from './constants'
import { useOrders } from './hooks/useOrders'
import { CreateOrderDialog } from './components/CreateOrderDialog'
import { CreateClientDialog } from './components/CreateClientDialog'

export default function OrdersPage() {
  const { data: session } = useSession()

  const {
    orders,
    projects,
    clients,
    isLoading,
    isDialogOpen,
    isClientDialogOpen,
    searchTerm,
    filterStatus,
    filterPriority,
    sortOrder,
    quickFilter,
    clientSearchTerm,
    viewMode,
    formData,
    clientFormData,
    filteredOrders,
    selectedClient,
    setIsDialogOpen,
    setIsClientDialogOpen,
    setSearchTerm,
    setFilterStatus,
    setFilterPriority,
    setSortOrder,
    setQuickFilter,
    setClientSearchTerm,
    setViewMode,
    setFormData,
    setClientFormData,
    handleCreateOrder,
    handleCreateClient,
  } = useOrders()

  const canEdit = session?.user?.role !== 'VIEWER'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            onOpenChange={setIsDialogOpen}
            projects={projects}
            clients={clients}
            clientSearchTerm={clientSearchTerm}
            selectedClient={selectedClient ?? null}
            formData={formData}
            onFormDataChange={setFormData}
            onClientSearchChange={setClientSearchTerm}
            onSelectClient={(id) => setFormData({ ...formData, clientId: id })}
            onClearClient={() => setFormData({ ...formData, clientId: '' })}
            onSubmit={handleCreateOrder}
            onOpenNewClient={() => setIsClientDialogOpen(true)}
            canEdit={canEdit}
          />
        )}
      </div>

      <CreateClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        formData={clientFormData}
        onFormDataChange={setClientFormData}
        onSubmit={handleCreateClient}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          {quickFilter && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">Showing:</span>
              <Badge variant="secondary" className="gap-1">
                {quickFilter === 'due-today' ? 'Due today' : 'Need action'}
                <button
                  type="button"
                  onClick={() => setQuickFilter('')}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={filterStatus || 'all'}
              onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}
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
              onValueChange={(v) => setFilterPriority(v === 'all' ? '' : v)}
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
            <Select value={sortOrder} onValueChange={setSortOrder}>
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
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'board' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('board')}
                className="rounded-l-none"
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders - List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] ?? fallbackStatus
            const priority = priorityConfig[order.priority ?? 'MEDIUM']
            const StatusIcon = status.icon

            return (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <Link href={`/orders/${order.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            <Badge variant={status.variant}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${priority.className}`}
                            >
                              {priority.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.project.name} - {order.client.name}
                          </p>
                          {order.client.phone && (
                            <p className="text-xs text-gray-500">{order.client.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {order.partsPrinted ?? 0} / {order.partsTotal ?? 0} parts printed
                        </p>
                        {order.dueDate && (
                          <p className="text-sm text-gray-500">
                            Due: {formatDateUTC(order.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )
          })}

          {filteredOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500 text-center mb-4">
                  {orders.length === 0
                    ? "You haven't created any orders yet."
                    : "No orders match your current filters."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Orders - Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-5 gap-4 min-w-0">
          {boardColumns.map((column) => {
            const columnOrders = filteredOrders.filter((order) => order.status === column.status)

            return (
              <div key={column.status} className={`min-w-0 rounded-lg border-2 ${column.color}`}>
                <div className="p-3 border-b bg-white/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{column.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnOrders.length}
                    </Badge>
                  </div>
                </div>

                <div className="p-2 space-y-3 min-h-[200px] max-h-[calc(100vh-320px)] overflow-y-auto">
                  {columnOrders.map((order) => {
                    const priority = priorityConfig[order.priority ?? 'MEDIUM']
                    const isOverdue =
                      order.dueDate && new Date(order.dueDate) < new Date()

                    return (
                      <Link key={order.id} href={`/orders/${order.id}`} className="block">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white mx-1 my-1">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{order.orderNumber}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${priority.className}`}
                                >
                                  {priority.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {order.project.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {order.client.name}
                              </p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                  {order.partsPrinted ?? 0}/{order.partsTotal ?? 0} parts
                                </span>
                                {order.dueDate && (
                                  <span
                                    className={
                                      isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                                    }
                                  >
                                    {formatDateUTC(order.dueDate)}
                                  </span>
                                )}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-indigo-600 h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${(order.partsTotal ?? 0) > 0
                                        ? ((order.partsPrinted ?? 0) / (order.partsTotal ?? 0)) *
                                        100
                                        : 0
                                      }%`,
                                  }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}

                  {columnOrders.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

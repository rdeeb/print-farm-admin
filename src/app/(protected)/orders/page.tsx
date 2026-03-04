'use client'

import { useSession } from 'next-auth/react'
import { CreateClientDialog } from './components/CreateClientDialog'
import { OrdersBoardView } from './components/list/OrdersBoardView'
import { OrdersFilters } from './components/list/OrdersFilters'
import { OrdersListView } from './components/list/OrdersListView'
import { OrdersLoadingState } from './components/list/OrdersLoadingState'
import { OrdersPageHeader } from './components/list/OrdersPageHeader'
import { useOrders } from './hooks/useOrders'

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
    return <OrdersLoadingState />
  }

  return (
    <div className="space-y-6">
      <OrdersPageHeader
        canEdit={canEdit}
        isDialogOpen={isDialogOpen}
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
      />

      <CreateClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        formData={clientFormData}
        onFormDataChange={setClientFormData}
        onSubmit={handleCreateClient}
      />

      <OrdersFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        quickFilter={quickFilter}
        onQuickFilterClear={() => setQuickFilter('')}
      />

      {viewMode === 'list' && (
        <OrdersListView
          orders={filteredOrders}
          totalOrderCount={orders.length}
        />
      )}

      {viewMode === 'board' && <OrdersBoardView orders={filteredOrders} />}
    </div>
  )
}

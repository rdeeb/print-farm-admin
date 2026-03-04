'use client'

import { useSession } from 'next-auth/react'
import { ClientsPageHeader } from './components/list/ClientsPageHeader'
import { ClientsFilters } from './components/list/ClientsFilters'
import { ClientsGrid } from './components/list/ClientsGrid'
import { ClientsLoadingState } from './components/list/ClientsLoadingState'
import { useClients } from './hooks/useClients'

export default function ClientsPage() {
  const { data: session } = useSession()
  const {
    filteredClients,
    clients,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingClient,
    searchTerm,
    setSearchTerm,
    filterSource,
    setFilterSource,
    formData,
    setFormData,
    resetForm,
    openEditDialog,
    handleSubmit,
    handleDelete,
  } = useClients()

  const canEdit = session?.user?.role !== 'VIEWER'
  const canDelete = session?.user?.role === 'ADMIN'

  if (isLoading) {
    return <ClientsLoadingState />
  }

  return (
    <div className="space-y-6">
      <ClientsPageHeader
        canEdit={canEdit}
        isDialogOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingClient={editingClient}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onReset={resetForm}
      />

      <ClientsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterSource={filterSource}
        onFilterSourceChange={setFilterSource}
      />

      <ClientsGrid
        clients={filteredClients}
        canEdit={canEdit}
        canDelete={canDelete}
        totalClientCount={clients.length}
        onEdit={openEditDialog}
        onDelete={handleDelete}
      />
    </div>
  )
}

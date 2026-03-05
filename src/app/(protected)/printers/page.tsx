'use client'

import { useSession } from 'next-auth/react'
import { PrintersPageHeader } from './components/list/PrintersPageHeader'
import { PrintersFilters } from './components/list/PrintersFilters'
import { PrintersGrid } from './components/list/PrintersGrid'
import { PrintersLoadingState } from './components/list/PrintersLoadingState'
import { usePrinters } from './hooks/usePrinters'

export default function PrintersPage() {
  const { data: session } = useSession()

  const {
    printers,
    filteredPrinters,
    printerModelsByBrand,
    brands,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    filterStatus,
    setFilterStatus,
    selectedPreset,
    formData,
    setFormData,
    editingPrinter,
    setEditingPrinter,
    editForm,
    setEditForm,
    isSavingEdit,
    handleTechnologySelect,
    handlePresetSelect,
    resetForm,
    handleSubmit,
    openEditPrinter,
    handleSaveEdit,
  } = usePrinters()

  const canEdit = session?.user?.role !== 'VIEWER'

  if (isLoading) {
    return <PrintersLoadingState />
  }

  return (
    <div className="space-y-6">
      <PrintersPageHeader
        canEdit={canEdit}
        isDialogOpen={isDialogOpen}
        onDialogOpenChange={setIsDialogOpen}
        selectedPreset={selectedPreset}
        onTechnologySelect={handleTechnologySelect}
        onPresetSelect={handlePresetSelect}
        formData={formData}
        onFormDataChange={setFormData}
        brands={brands}
        printerModelsByBrand={printerModelsByBrand}
        onCreateSubmit={handleSubmit}
        onFormReset={resetForm}
        editingPrinter={editingPrinter}
        onEditingPrinterChange={setEditingPrinter}
        editForm={editForm}
        onEditFormChange={setEditForm}
        isSavingEdit={isSavingEdit}
        onEditSubmit={handleSaveEdit}
      />

      <PrintersFilters
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filteredCount={filteredPrinters.length}
      />

      <PrintersGrid
        printers={filteredPrinters}
        totalPrinterCount={printers.length}
        canEdit={canEdit}
        onEdit={openEditPrinter}
      />
    </div>
  )
}

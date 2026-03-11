'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { PrintersPageHeader } from './components/list/PrintersPageHeader'
import { PrintersFilters } from './components/list/PrintersFilters'
import { PrintersGrid } from './components/list/PrintersGrid'
import { PrintersLoadingState } from './components/list/PrintersLoadingState'
import { usePrinters } from './hooks/usePrinters'
import type { PrinterUtilizationData } from '@/types/printer-utilization'

export default function PrintersPage() {
  const { data: session } = useSession()
  const [monthlyHoursMap, setMonthlyHoursMap] = useState<Map<string, number>>(new Map())

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

  useEffect(() => {
    async function fetchUtilization() {
      try {
        const response = await fetch('/api/analytics/printer-utilization?range=30d')
        if (response.ok) {
          const data: PrinterUtilizationData[] = await response.json()
          const map = new Map<string, number>()
          for (const item of data) {
            map.set(item.printerId, item.totalHours)
          }
          setMonthlyHoursMap(map)
        }
      } catch (error) {
        console.error('Error fetching printer utilization:', error)
      }
    }

    fetchUtilization()
  }, [])

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
        monthlyHoursMap={monthlyHoursMap}
      />
    </div>
  )
}

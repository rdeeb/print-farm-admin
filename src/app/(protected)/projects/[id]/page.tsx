'use client'

import { useSession } from 'next-auth/react'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'
import { useSettings } from '@/components/providers/SettingsProvider'
import { statusConfig } from '../constants'
import { useProjectDetail } from '../hooks/useProjectDetail'
import { ProjectDetailHeader } from '../components/detail/ProjectDetailHeader'
import { ProjectCostCard } from '../components/detail/ProjectCostCard'
import { ProjectDetailsForm } from '../components/detail/ProjectDetailsForm'
import { ProjectStatsCards } from '../components/detail/ProjectStatsCards'
import { ProjectPartsSection } from '../components/detail/ProjectPartsSection'
import { ProjectHardwareSection } from '../components/detail/ProjectHardwareSection'

export default function ProjectDetailPage() {
  const { data: session } = useSession()
  const { settings } = useSettings()

  const {
    project,
    cost,
    types,
    colors,
    availableHardware,
    isLoading,
    isEditing,
    setIsEditing,
    isPartDialogOpen,
    setIsPartDialogOpen,
    isHardwareDialogOpen,
    setIsHardwareDialogOpen,
    editingPart,
    editingHardware,
    isSaving,
    projectForm,
    setProjectForm,
    partForm,
    setPartForm,
    hardwareForm,
    setHardwareForm,
    totalFilament,
    totalPrintTime,
    totalParts,
    handleSaveProject,
    handleAddPart,
    handleUpdatePart,
    handleDeletePart,
    handleAddHardware,
    handleUpdateHardware,
    handleDeleteHardware,
    openEditPartDialog,
    openEditHardwareDialog,
    resetPartForm,
    resetHardwareForm,
    getPartRequirement,
    getPartProjections,
  } = useProjectDetail()

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  const canEdit = session?.user?.role !== 'VIEWER'
  const status = statusConfig[project.status]

  return (
    <div className="space-y-6">
      <ProjectDetailHeader
        project={project}
        status={status}
        isEditing={isEditing}
        isSaving={isSaving}
        projectForm={projectForm}
        canEdit={canEdit}
        onProjectFormChange={setProjectForm}
        onStartEditing={() => setIsEditing(true)}
        onCancelEditing={() => setIsEditing(false)}
        onSave={handleSaveProject}
      />

      {cost && (
        <ProjectCostCard
          cost={cost}
          currency={settings.currency}
          isEditing={isEditing}
          projectForm={projectForm}
          projectSalesPrice={project.salesPrice ?? null}
        />
      )}

      {isEditing && (
        <ProjectDetailsForm projectForm={projectForm} onProjectFormChange={setProjectForm} />
      )}

      <ProjectStatsCards
        project={project}
        totalParts={totalParts}
        totalFilament={totalFilament}
        totalPrintTime={totalPrintTime}
      />

      <ProjectPartsSection
        project={project}
        types={types}
        filteredColors={colors}
        canEdit={canEdit}
        isPartDialogOpen={isPartDialogOpen}
        setIsPartDialogOpen={setIsPartDialogOpen}
        editingPart={editingPart}
        partForm={partForm}
        onPartFormChange={setPartForm}
        onAddPart={handleAddPart}
        onUpdatePart={handleUpdatePart}
        onEditPart={openEditPartDialog}
        onDeletePart={handleDeletePart}
        onResetPartForm={resetPartForm}
        getPartRequirement={getPartRequirement}
        getPartProjections={getPartProjections}
      />

      <ProjectHardwareSection
        project={project}
        currency={settings.currency}
        canEdit={canEdit}
        isHardwareDialogOpen={isHardwareDialogOpen}
        setIsHardwareDialogOpen={setIsHardwareDialogOpen}
        editingHardware={editingHardware}
        hardwareForm={hardwareForm}
        onHardwareFormChange={setHardwareForm}
        availableHardware={availableHardware}
        onAddHardware={handleAddHardware}
        onUpdateHardware={handleUpdateHardware}
        onEditHardware={openEditHardwareDialog}
        onDeleteHardware={handleDeleteHardware}
        onResetHardwareForm={resetHardwareForm}
      />
    </div>
  )
}

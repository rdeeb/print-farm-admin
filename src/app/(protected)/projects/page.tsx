'use client'

import { useSession } from 'next-auth/react'
import { ProjectsPageHeader } from './components/list/ProjectsPageHeader'
import { ProjectsFilters } from './components/list/ProjectsFilters'
import { ProjectsGrid } from './components/list/ProjectsGrid'
import { ProjectsLoadingState } from './components/list/ProjectsLoadingState'
import { useProjects } from './hooks/useProjects'

export default function ProjectsPage() {
  const { data: session } = useSession()
  const {
    filteredProjects,
    projects,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    formData,
    setFormData,
    handleSubmit,
  } = useProjects()

  const canEdit = session?.user?.role !== 'VIEWER'

  if (isLoading) {
    return <ProjectsLoadingState />
  }

  return (
    <div className="space-y-6">
      <ProjectsPageHeader
        canEdit={canEdit}
        isDialogOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
      />

      <ProjectsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
      />

      <ProjectsGrid projects={filteredProjects} totalProjectCount={projects.length} />
    </div>
  )
}

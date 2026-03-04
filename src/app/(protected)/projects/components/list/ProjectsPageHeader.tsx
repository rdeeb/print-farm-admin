import { CreateProjectDialog } from '../CreateProjectDialog'
import type { ProjectFormData } from '../../hooks/useProjects'

interface ProjectsPageHeaderProps {
  canEdit: boolean
  isDialogOpen: boolean
  onOpenChange: (open: boolean) => void
  formData: ProjectFormData
  onFormDataChange: (data: ProjectFormData) => void
  onSubmit: (e: React.FormEvent) => void
}

export function ProjectsPageHeader({
  canEdit,
  isDialogOpen,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
}: ProjectsPageHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your 3D printing projects and parts</p>
      </div>

      {canEdit && (
        <CreateProjectDialog
          open={isDialogOpen}
          onOpenChange={onOpenChange}
          formData={formData}
          onFormDataChange={onFormDataChange}
          onSubmit={onSubmit}
        />
      )}
    </div>
  )
}

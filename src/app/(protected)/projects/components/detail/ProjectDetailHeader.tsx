import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Pencil, Save } from 'lucide-react'
import type { Project } from '@/model/project'
import type { ProjectFormData } from '../../hooks/useProjectDetail'

interface ProjectDetailHeaderProps {
  project: Project
  status: { label: string; variant: 'secondary' | 'default' | 'success' | 'outline' }
  isEditing: boolean
  isSaving: boolean
  projectForm: ProjectFormData
  canEdit: boolean
  onProjectFormChange: (data: ProjectFormData) => void
  onStartEditing: () => void
  onCancelEditing: () => void
  onSave: () => void
}

export function ProjectDetailHeader({
  project,
  status,
  isEditing,
  isSaving,
  projectForm,
  canEdit,
  onProjectFormChange,
  onStartEditing,
  onCancelEditing,
  onSave,
}: ProjectDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          {isEditing ? (
            <Input
              value={projectForm.name}
              onChange={(e) => onProjectFormChange({ ...projectForm, name: e.target.value })}
              className="text-2xl font-bold h-auto py-1"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          )}
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-sm text-gray-500">
              {project._count?.orders ?? 0} order{(project._count?.orders ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={onCancelEditing}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onStartEditing}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

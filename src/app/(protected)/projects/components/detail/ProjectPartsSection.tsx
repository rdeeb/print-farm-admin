import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers } from 'lucide-react'
import { PartListItem } from './PartListItem'
import { AddPartDialog } from './AddPartDialog'
import type { Project, ProjectPart } from '@/model/project'
import type { FilamentType, FilamentColor } from '@/model/project'
import type { PartFormData } from '../../hooks/useProjectDetail'

interface PartProjection {
  filamentId: string
  brand: string
  remainingWeight: number
  printableCount: number
}

interface ProjectPartsSectionProps {
  project: Project
  types: FilamentType[]
  filteredColors: FilamentColor[]
  canEdit: boolean
  isPartDialogOpen: boolean
  setIsPartDialogOpen: (open: boolean) => void
  editingPart: ProjectPart | null
  partForm: PartFormData
  onPartFormChange: (data: PartFormData) => void
  onAddPart: (e: React.FormEvent) => void
  onUpdatePart: (e: React.FormEvent) => void
  onEditPart: (part: ProjectPart) => void
  onDeletePart: (partId: string) => void
  onResetPartForm: () => void
  getPartRequirement: (part: ProjectPart) => {
    type: { name: string }
    color: { name: string; hex: string }
  } | null
  getPartProjections: (part: ProjectPart) => PartProjection[]
}

export function ProjectPartsSection({
  project,
  types,
  filteredColors,
  canEdit,
  isPartDialogOpen,
  setIsPartDialogOpen,
  editingPart,
  partForm,
  onPartFormChange,
  onAddPart,
  onUpdatePart,
  onEditPart,
  onDeletePart,
  onResetPartForm,
  getPartRequirement,
  getPartProjections,
}: ProjectPartsSectionProps) {
  const parts = project.parts ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Parts</CardTitle>
            <CardDescription>Manage the parts in this project</CardDescription>
          </div>
          {canEdit && (
            <AddPartDialog
              open={isPartDialogOpen}
              onOpenChange={(open) => {
                setIsPartDialogOpen(open)
                if (!open) onResetPartForm()
              }}
              editingPart={editingPart}
              partForm={partForm}
              onPartFormChange={onPartFormChange}
              types={types}
              filteredColors={filteredColors}
              onSubmit={editingPart ? onUpdatePart : onAddPart}
              onCancel={() => {
                setIsPartDialogOpen(false)
                onResetPartForm()
              }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {parts.length > 0 ? (
          <div className="space-y-4">
            {parts.map((part) => {
              const requirement = getPartRequirement(part)
              const projections = getPartProjections(part)
              return (
                <PartListItem
                  key={part.id}
                  part={part}
                  requirement={requirement}
                  projections={projections}
                  canEdit={canEdit}
                  onEdit={onEditPart}
                  onDelete={onDeletePart}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Layers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No parts yet</p>
            <p className="text-sm">Add parts to define what needs to be printed for this project</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

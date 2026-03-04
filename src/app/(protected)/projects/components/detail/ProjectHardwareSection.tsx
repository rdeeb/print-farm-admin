import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wrench } from 'lucide-react'
import { HardwareListItem } from './HardwareListItem'
import { AddHardwareDialog } from './AddHardwareDialog'
import type { Project, ProjectHardware } from '@/model/project'
import type { Hardware } from '@/model/hardware'
import type { HardwareFormData } from '../../hooks/useProjectDetail'

interface ProjectHardwareSectionProps {
  project: Project
  currency: string
  canEdit: boolean
  isHardwareDialogOpen: boolean
  setIsHardwareDialogOpen: (open: boolean) => void
  editingHardware: ProjectHardware | null
  hardwareForm: HardwareFormData
  onHardwareFormChange: (data: HardwareFormData) => void
  availableHardware: Hardware[]
  onAddHardware: (e: React.FormEvent) => void
  onUpdateHardware: (e: React.FormEvent) => void
  onEditHardware: (ph: ProjectHardware) => void
  onDeleteHardware: (hardwareId: string) => void
  onResetHardwareForm: () => void
}

export function ProjectHardwareSection({
  project,
  currency,
  canEdit,
  isHardwareDialogOpen,
  setIsHardwareDialogOpen,
  editingHardware,
  hardwareForm,
  onHardwareFormChange,
  availableHardware,
  onAddHardware,
  onUpdateHardware,
  onEditHardware,
  onDeleteHardware,
  onResetHardwareForm,
}: ProjectHardwareSectionProps) {
  const hardware = project.hardware ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Hardware Requirements</CardTitle>
            <CardDescription>
              Additional hardware needed per unit (screws, glue, etc.)
            </CardDescription>
          </div>
          {canEdit && (
            <AddHardwareDialog
              open={isHardwareDialogOpen}
              onOpenChange={(open) => {
                setIsHardwareDialogOpen(open)
                if (!open) onResetHardwareForm()
              }}
              editingHardware={editingHardware}
              hardwareForm={hardwareForm}
              onHardwareFormChange={onHardwareFormChange}
              availableHardware={availableHardware}
              currency={currency}
              onSubmit={editingHardware ? onUpdateHardware : onAddHardware}
              onCancel={() => {
                setIsHardwareDialogOpen(false)
                onResetHardwareForm()
              }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hardware.length > 0 ? (
          <div className="space-y-3">
            {hardware.map((ph) => (
              <HardwareListItem
                key={ph.id}
                projectHardware={ph}
                currency={currency}
                canEdit={canEdit}
                onEdit={onEditHardware}
                onDelete={onDeleteHardware}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No hardware requirements</p>
            <p className="text-sm">
              Add hardware items like screws, glue, or other consumables
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

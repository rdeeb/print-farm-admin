import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Layers, Pencil, Trash2 } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { ProjectPart, ProjectFilament } from '@/model/project'

interface PartProjection {
  filamentId: string
  brand: string
  remainingWeight: number
  printableCount: number
}

interface PartListItemProps {
  part: ProjectPart
  requirement: { type: { name: string }; color: { name: string; hex: string } } | null
  projections: PartProjection[]
  canEdit: boolean
  onEdit: (part: ProjectPart) => void
  onDelete: (partId: string) => void
}

export function PartListItem({
  part,
  requirement,
  projections,
  canEdit,
  onEdit,
  onDelete,
}: PartListItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Layers className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h4 className="font-medium">{part.name}</h4>
          <p className="text-sm text-gray-500">
            {part.quantity}x • {part.filamentWeight}g each
            {part.printTime && ` • ${formatDuration(part.printTime)}`}
          </p>
          {requirement ? (
            <div className="flex items-center space-x-2 mt-2">
              <div
                className="w-3 h-3 rounded border"
                style={{ backgroundColor: requirement.color.hex }}
              />
              <span className="text-xs text-gray-500">
                {requirement.type.name} - {requirement.color.name}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">No filament requirement set</p>
          )}
          {requirement && (
            <div className="mt-2 text-xs text-gray-500">
              <p className="font-medium text-gray-700">Inventory projection</p>
              {projections.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {projections.map((projection) => (
                    <div
                      key={projection.filamentId}
                      className="flex items-center justify-between"
                    >
                      <span>{projection.brand}</span>
                      <span>
                        {projection.printableCount} part
                        {projection.printableCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 mt-1">No matching spools in inventory</p>
              )}
            </div>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(part)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Part</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{part.name}&quot;? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(part.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}

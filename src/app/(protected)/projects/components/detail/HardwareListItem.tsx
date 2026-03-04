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
import { Wrench, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { UNIT_LABELS } from '../../constants'
import type { ProjectHardware } from '@/model/project'

interface HardwareListItemProps {
  projectHardware: ProjectHardware
  currency: string
  canEdit: boolean
  onEdit: (ph: ProjectHardware) => void
  onDelete: (hardwareId: string) => void
}

export function HardwareListItem({
  projectHardware,
  currency,
  canEdit,
  onEdit,
  onDelete,
}: HardwareListItemProps) {
  const ph = projectHardware
  const unitCost = ph.hardware.packPrice / ph.hardware.packQuantity
  const totalCost = unitCost * ph.quantity

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Wrench className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h4 className="font-medium">{ph.hardware.name}</h4>
          <p className="text-sm text-gray-500">
            {ph.quantity} {UNIT_LABELS[ph.hardware.packUnit]} @{' '}
            {formatCurrency(unitCost, currency)} each
          </p>
          <p className="text-sm font-medium text-indigo-600">
            {formatCurrency(totalCost, currency)} per unit
          </p>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(ph)}>
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
                <AlertDialogTitle>Remove Hardware</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove &quot;{ph.hardware.name}&quot; from this project?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(ph.hardware.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Trash2 } from 'lucide-react'
import type { FilamentSpool } from '@/model/filament'

interface FilamentSpoolListProps {
  spools: FilamentSpool[]
  filamentId: string
  canEdit: boolean
  onDeleteSpool: (spoolId: string) => void
}

export function FilamentSpoolList({
  spools,
  filamentId,
  canEdit,
  onDeleteSpool,
}: FilamentSpoolListProps) {
  if (spools.length === 0) {
    return (
      <p className="text-center text-gray-500 py-4">
        No spools yet. Add some spools to track inventory.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {spools.map((spool, index) => (
        <div
          key={spool.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">#{index + 1}</span>
            <div>
              <p className="font-medium">{spool.weight}g spool</p>
              <p className="text-sm text-gray-500">
                {spool.remainingWeight}g remaining ({spool.remainingPercent}%)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-24">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    spool.remainingPercent < 20
                      ? 'bg-red-500'
                      : spool.remainingPercent < 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${spool.remainingPercent}%` }}
                />
              </div>
            </div>
            <Badge
              variant={
                spool.remainingPercent < 20
                  ? 'destructive'
                  : spool.remainingPercent < 50
                    ? 'warning'
                    : 'success'
              }
            >
              {spool.remainingPercent}%
            </Badge>
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Spool</AlertDialogTitle>
                    <AlertDialogDescription>
                      Delete this {spool.weight}g spool?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteSpool(spool.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { AlertTriangle, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { FilamentSpoolList } from './FilamentSpoolList'
import type { Filament } from '@/model/filament'

interface FilamentTypeCardProps {
  filament: Filament
  isExpanded: boolean
  currency: string
  canEdit: boolean
  onToggleExpanded: (filamentId: string) => void
  onAddSpools: (filament: Filament) => void
  onDeleteFilament: (filamentId: string) => void
  onDeleteSpool: (spoolId: string) => void
}

export function FilamentTypeCard({
  filament,
  isExpanded,
  currency,
  canEdit,
  onToggleExpanded,
  onAddSpools,
  onDeleteFilament,
  onDeleteSpool,
}: FilamentTypeCardProps) {
  const filamentSpools = filament.spools ?? []
  const hasLowStock = filamentSpools.some((s) => s.remainingPercent < 20)

  return (
    <Card className={hasLowStock ? 'border-yellow-300' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center space-x-4 cursor-pointer"
            onClick={() => onToggleExpanded(filament.id)}
          >
            <div
              className="w-8 h-8 rounded-lg border shadow-sm"
              style={{ backgroundColor: filament.color.hex }}
            />
            <div>
              <CardTitle className="text-lg flex items-center">
                {filament.brand} {filament.type.code} - {filament.color.name}
                {hasLowStock && (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                )}
              </CardTitle>
              <CardDescription>
                {filament._count?.spools ?? 0} spool
                {(filament._count?.spools ?? 0) !== 1 ? 's' : ''} •{' '}
                {((filament.totalRemainingWeight ?? 0) / 1000).toFixed(2)}kg
                remaining
                {filament.costPerKg &&
                  ` • ${formatCurrency(filament.costPerKg, currency)}/kg`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddSpools(filament)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Spools
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpanded(filament.id)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {canEdit && (filament._count?.spools ?? 0) === 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Material</AlertDialogTitle>
                    <AlertDialogDescription>
                      Delete {filament.brand} {filament.type.code}{' '}
                      {filament.color.name}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteFilament(filament.id)}
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
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <FilamentSpoolList
            spools={filamentSpools}
            filamentId={filament.id}
            canEdit={canEdit}
            onDeleteSpool={onDeleteSpool}
          />
        </CardContent>
      )}
    </Card>
  )
}

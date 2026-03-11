import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Printer, Pencil, Zap, Clock, AlertTriangle } from 'lucide-react'
import { statusConfig } from '../../constants'
import type { PrinterData } from '@/model/printer'

interface PrinterCardProps {
  printer: PrinterData
  canEdit: boolean
  onEdit: (printer: PrinterData) => void
  monthlyHours?: number
}

export function PrinterCard({ printer, canEdit, onEdit, monthlyHours }: PrinterCardProps) {
  const status = statusConfig[printer.status]
  const StatusIcon = status.icon

  const now = new Date()
  const dueDateObj = printer.nextMaintenanceDue ? new Date(printer.nextMaintenanceDue) : null
  const isMaintenanceOverdue = dueDateObj !== null && dueDateObj < now
  const isMaintenanceDueSoon =
    dueDateObj !== null &&
    !isMaintenanceOverdue &&
    dueDateObj.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000

  return (
    <Card
      className={`relative ${!printer.isActive ? 'opacity-60' : ''}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Printer className={`h-6 w-6 ${status.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{printer.name}</CardTitle>
              <CardDescription>
                {printer.brand && `${printer.brand} `}
                {printer.model}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(printer)}
                aria-label="Edit printer"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Badge variant={status.variant}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {printer.buildVolume && (
            <div className="flex justify-between">
              <span className="text-gray-500">Build Volume</span>
              <span>
                {printer.buildVolume.x} x {printer.buildVolume.y} x{' '}
                {printer.buildVolume.z} mm
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Technology</span>
            <span>{printer.technology}</span>
          </div>
          {printer.nozzleSize && (
            <div className="flex justify-between">
              <span className="text-gray-500">Nozzle</span>
              <span>{printer.nozzleSize}mm</span>
            </div>
          )}
          {printer.powerConsumption && (
            <div className="flex justify-between">
              <span className="text-gray-500 flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                Avg. Power
              </span>
              <span>{printer.powerConsumption}W</span>
            </div>
          )}
          {printer.cost != null && printer.cost > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Cost</span>
              <span>${printer.cost.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Total Jobs</span>
            <span>{printer._count?.printJobs ?? 0}</span>
          </div>
          {monthlyHours !== undefined && (
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Monthly Usage
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {monthlyHours.toFixed(1)} hrs / mo
              </span>
            </div>
          )}
          {isMaintenanceOverdue && (
            <div className="pt-2">
              <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 w-full justify-center text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Maintenance Overdue
              </Badge>
            </div>
          )}
          {isMaintenanceDueSoon && (
            <div className="pt-2">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 w-full justify-center text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Maintenance Due Soon
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

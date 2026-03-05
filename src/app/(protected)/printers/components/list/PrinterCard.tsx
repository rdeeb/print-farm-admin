import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Printer, Pencil, Zap } from 'lucide-react'
import { statusConfig } from '../../constants'
import type { PrinterData } from '@/model/printer'

interface PrinterCardProps {
  printer: PrinterData
  canEdit: boolean
  onEdit: (printer: PrinterData) => void
}

export function PrinterCard({ printer, canEdit, onEdit }: PrinterCardProps) {
  const status = statusConfig[printer.status]
  const StatusIcon = status.icon

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
            <span>{printer._count.printJobs}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

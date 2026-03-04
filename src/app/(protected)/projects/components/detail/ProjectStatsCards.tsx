import { Card, CardContent } from '@/components/ui/card'
import { Layers, Clock, Package, Wrench } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { Project } from '@/model/project'

interface ProjectStatsCardsProps {
  project: Project
  totalParts: number
  totalFilament: number
  totalPrintTime: number
}

export function ProjectStatsCards({
  project,
  totalParts,
  totalFilament,
  totalPrintTime,
}: ProjectStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{totalParts}</p>
              <p className="text-sm text-gray-500">Total Parts</p>
            </div>
            <Layers className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{totalFilament}g</p>
              <p className="text-sm text-gray-500">Total Filament</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{formatDuration(totalPrintTime)}</p>
              <p className="text-sm text-gray-500">Print Time</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {project.assemblyTime ? formatDuration(project.assemblyTime) : '-'}
              </p>
              <p className="text-sm text-gray-500">Assembly Time</p>
            </div>
            <Wrench className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

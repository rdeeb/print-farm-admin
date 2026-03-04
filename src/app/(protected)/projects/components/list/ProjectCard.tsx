import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Layers, Box } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { statusConfig } from '../../constants'
import type { Project } from '@/model/project'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const status = statusConfig[project.status]

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <CardDescription>{project.description || 'No description'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Layers className="h-4 w-4 mr-1" />
                {project._count?.parts ?? 0} parts
              </div>
              <div className="flex items-center">
                <Box className="h-4 w-4 mr-1" />
                {project._count?.orders ?? 0} orders
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Created {formatDate(project.createdAt)}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

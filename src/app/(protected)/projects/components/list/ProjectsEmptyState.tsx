import { Card, CardContent } from '@/components/ui/card'
import { Box } from 'lucide-react'

interface ProjectsEmptyStateProps {
  hasProjects: boolean
}

export function ProjectsEmptyState({ hasProjects }: ProjectsEmptyStateProps) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Box className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
        <p className="text-gray-500 text-center mb-4">
          {hasProjects ? "No projects match your current filters." : "You haven't created any projects yet."}
        </p>
      </CardContent>
    </Card>
  )
}

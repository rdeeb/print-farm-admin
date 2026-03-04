import { ProjectCard } from './ProjectCard'
import { ProjectsEmptyState } from './ProjectsEmptyState'
import type { Project } from '@/model/project'

interface ProjectsGridProps {
  projects: Project[]
  totalProjectCount: number
}

export function ProjectsGrid({ projects, totalProjectCount }: ProjectsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}

      {projects.length === 0 && <ProjectsEmptyState hasProjects={totalProjectCount > 0} />}
    </div>
  )
}

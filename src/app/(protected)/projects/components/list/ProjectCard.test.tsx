import { render, screen } from '@testing-library/react'
import { ProjectCard } from './ProjectCard'
import type { Project } from '@/model/project'

const mockProject: Project = {
  id: 'project-1',
  name: 'Widget Set',
  description: 'A set of 3D printed widgets',
  status: 'ACTIVE',
  parts: [],
  createdAt: '2024-01-15T10:00:00Z',
  _count: { parts: 5, orders: 3 },
}

describe('ProjectCard', () => {
  it('renders project name and description', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('Widget Set')).toBeInTheDocument()
    expect(screen.getByText('A set of 3D printed widgets')).toBeInTheDocument()
  })

  it('displays status badge', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows parts and orders count', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('5 parts')).toBeInTheDocument()
    expect(screen.getByText('3 orders')).toBeInTheDocument()
  })

  it('links to project detail page', () => {
    render(<ProjectCard project={mockProject} />)
    const link = screen.getByRole('link', { name: /widget set/i })
    expect(link).toHaveAttribute('href', '/projects/project-1')
  })

  it('shows "No description" when description is empty', () => {
    const projectWithoutDesc = { ...mockProject, description: null }
    render(<ProjectCard project={projectWithoutDesc} />)
    expect(screen.getByText('No description')).toBeInTheDocument()
  })
})

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Project } from '@/model/project'

export interface ProjectFormData {
  name: string
  description: string
}

const initialFormData: ProjectFormData = {
  name: '',
  description: '',
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const newProject = await response.json()
          setProjects((prev) => [newProject, ...prev])
          setIsDialogOpen(false)
          setFormData(initialFormData)
        }
      } catch (error) {
        console.error('Error creating project:', error)
      }
    },
    [formData]
  )

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      !searchTerm ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !filterStatus || project.status === filterStatus

    return matchesSearch && matchesStatus
  })

  return {
    projects,
    filteredProjects,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    formData,
    setFormData,
    handleSubmit,
  }
}

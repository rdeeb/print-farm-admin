'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type {
  Project,
  ProjectPart,
  ProjectHardware,
  CostBreakdown,
  ProjectFilament,
  FilamentType,
  FilamentColor,
} from '@/model/project'
import type { Hardware } from '@/model/hardware'

export interface ProjectFormData {
  name: string
  description: string
  status: string
  assemblyTime: string
  salesPrice: string
}

export interface PartFormData {
  name: string
  description: string
  filamentWeight: string
  printTime: string
  quantity: string
  filamentTypeId: string
  filamentColorId: string
}

export interface HardwareFormData {
  hardwareId: string
  quantity: string
}

const initialProjectForm: ProjectFormData = {
  name: '',
  description: '',
  status: 'DRAFT',
  assemblyTime: '',
  salesPrice: '',
}

const initialPartForm: PartFormData = {
  name: '',
  description: '',
  filamentWeight: '',
  printTime: '',
  quantity: '1',
  filamentTypeId: '',
  filamentColorId: '',
}

const initialHardwareForm: HardwareFormData = {
  hardwareId: '',
  quantity: '1',
}

export function useProjectDetail() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [filaments, setFilaments] = useState<ProjectFilament[]>([])
  const [types, setTypes] = useState<FilamentType[]>([])
  const [colors, setColors] = useState<FilamentColor[]>([])
  const [filteredColors, setFilteredColors] = useState<FilamentColor[]>([])
  const [hardware, setHardware] = useState<Hardware[]>([])
  const [cost, setCost] = useState<CostBreakdown | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false)
  const [isHardwareDialogOpen, setIsHardwareDialogOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<ProjectPart | null>(null)
  const [editingHardware, setEditingHardware] = useState<ProjectHardware | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [projectForm, setProjectForm] = useState<ProjectFormData>(initialProjectForm)
  const [partForm, setPartForm] = useState<PartFormData>(initialPartForm)
  const [hardwareForm, setHardwareForm] = useState<HardwareFormData>(initialHardwareForm)

  const refreshCost = useCallback(async () => {
    try {
      const costRes = await fetch(`/api/projects/${projectId}/cost`)
      if (costRes.ok) {
        setCost(await costRes.json())
      }
    } catch (error) {
      console.error('Error refreshing cost:', error)
    }
  }, [projectId])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, filamentsRes, typesRes, colorsRes, hardwareRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch('/api/filament/filaments'),
          fetch('/api/filament/types'),
          fetch('/api/filament/colors'),
          fetch('/api/hardware'),
        ])

        if (projectRes.ok) {
          const projectData = await projectRes.json()
          setProject(projectData)
          setProjectForm({
            name: projectData.name,
            description: projectData.description || '',
            status: projectData.status,
            assemblyTime: projectData.assemblyTime?.toString() || '',
            salesPrice: projectData.salesPrice != null ? projectData.salesPrice.toString() : '',
          })
        } else {
          router.push('/projects')
        }

        if (filamentsRes.ok) setFilaments(await filamentsRes.json())
        if (typesRes.ok) setTypes(await typesRes.json())
        if (colorsRes.ok) setColors(await colorsRes.json())
        if (hardwareRes.ok) setHardware(await hardwareRes.json())

        const costRes = await fetch(`/api/projects/${projectId}/cost`)
        if (costRes.ok) setCost(await costRes.json())
      } catch (error) {
        console.error('Error fetching project:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [projectId, router])

  useEffect(() => {
    if (partForm.filamentTypeId) {
      setFilteredColors(colors.filter((color) => color.typeId === partForm.filamentTypeId))
    } else {
      setFilteredColors([])
    }
  }, [partForm.filamentTypeId, colors])

  const handleSaveProject = useCallback(async () => {
    if (!project) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectForm,
          assemblyTime: projectForm.assemblyTime || null,
          salesPrice: projectForm.salesPrice === '' ? null : projectForm.salesPrice,
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        setProject({ ...project, ...updated, hardware: project?.hardware ?? [] })
        setIsEditing(false)
        refreshCost()
      }
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setIsSaving(false)
    }
  }, [project, projectId, projectForm, refreshCost])

  const handleAddPart = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!project) return
      try {
        const response = await fetch(`/api/projects/${projectId}/parts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: partForm.name,
            description: partForm.description || null,
            filamentWeight: parseFloat(partForm.filamentWeight),
            materialUsagePerUnit: parseFloat(partForm.filamentWeight),
            printTime: partForm.printTime ? parseInt(partForm.printTime) : null,
            quantity: parseInt(partForm.quantity),
            filamentColorId: partForm.filamentColorId || null,
          }),
        })

        if (response.ok) {
          const newPart = await response.json()
          setProject({ ...project, parts: [...(project?.parts ?? []), newPart] })
          setIsPartDialogOpen(false)
          setPartForm(initialPartForm)
          refreshCost()
        }
      } catch (error) {
        console.error('Error adding part:', error)
      }
    },
    [project, projectId, partForm, refreshCost]
  )

  const handleUpdatePart = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editingPart || !project) return
      try {
        const response = await fetch(`/api/projects/${projectId}/parts/${editingPart.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: partForm.name,
            description: partForm.description || null,
            filamentWeight: parseFloat(partForm.filamentWeight),
            materialUsagePerUnit: parseFloat(partForm.filamentWeight),
            printTime: partForm.printTime ? parseInt(partForm.printTime) : null,
            quantity: parseInt(partForm.quantity),
            filamentColorId: partForm.filamentColorId || null,
          }),
        })

        if (response.ok) {
          const updatedPart = await response.json()
          setProject({
            ...project,
            parts: (project?.parts ?? []).map((p) => (p.id === editingPart.id ? updatedPart : p)),
          })
          setEditingPart(null)
          setIsPartDialogOpen(false)
          setPartForm(initialPartForm)
          refreshCost()
        }
      } catch (error) {
        console.error('Error updating part:', error)
      }
    },
    [editingPart, project, projectId, partForm, refreshCost]
  )

  const handleDeletePart = useCallback(
    async (partId: string) => {
      if (!project) return
      try {
        const response = await fetch(`/api/projects/${projectId}/parts/${partId}`, { method: 'DELETE' })
        if (response.ok) {
          setProject({ ...project, parts: (project?.parts ?? []).filter((p) => p.id !== partId) })
          refreshCost()
        }
      } catch (error) {
        console.error('Error deleting part:', error)
      }
    },
    [project, projectId, refreshCost]
  )

  const handleAddHardware = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!project) return
      try {
        const response = await fetch(`/api/projects/${projectId}/hardware`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hardwareId: hardwareForm.hardwareId,
            quantity: parseFloat(hardwareForm.quantity),
          }),
        })

        if (response.ok) {
          const newHardware = await response.json()
          const existingIndex = (project?.hardware ?? []).findIndex(
            (h) => h.hardware.id === newHardware.hardware.id
          )
          if (existingIndex >= 0) {
            setProject({
              ...project,
              hardware: (project?.hardware ?? []).map((h, i) =>
                i === existingIndex ? newHardware : h
              ),
            })
          } else {
            setProject({ ...project, hardware: [...(project?.hardware ?? []), newHardware] })
          }
          setIsHardwareDialogOpen(false)
          setHardwareForm(initialHardwareForm)
          refreshCost()
        }
      } catch (error) {
        console.error('Error adding hardware:', error)
      }
    },
    [project, projectId, hardwareForm, refreshCost]
  )

  const handleUpdateHardware = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editingHardware || !project) return
      try {
        const response = await fetch(
          `/api/projects/${projectId}/hardware/${editingHardware.hardware.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: parseFloat(hardwareForm.quantity) }),
          }
        )

        if (response.ok) {
          const updated = await response.json()
          setProject({
            ...project,
            hardware: (project?.hardware ?? []).map((h) =>
              h.id === editingHardware.id ? updated : h
            ),
          })
          setEditingHardware(null)
          setIsHardwareDialogOpen(false)
          setHardwareForm(initialHardwareForm)
          refreshCost()
        }
      } catch (error) {
        console.error('Error updating hardware:', error)
      }
    },
    [editingHardware, project, projectId, hardwareForm, refreshCost]
  )

  const handleDeleteHardware = useCallback(
    async (hardwareId: string) => {
      if (!project) return
      try {
        const response = await fetch(
          `/api/projects/${projectId}/hardware/${hardwareId}`,
          { method: 'DELETE' }
        )
        if (response.ok) {
          setProject({
            ...project,
            hardware: (project?.hardware ?? []).filter((h) => h.hardware.id !== hardwareId),
          })
          refreshCost()
        }
      } catch (error) {
        console.error('Error deleting hardware:', error)
      }
    },
    [project, projectId, refreshCost]
  )

  const openEditPartDialog = useCallback((part: ProjectPart) => {
    const filamentTypeId = part.filamentColor?.type.id || part.spool?.filament?.type.id || ''
    const filamentColorId = part.filamentColor?.id || part.spool?.filament?.color.id || ''
    setEditingPart(part)
    setPartForm({
      name: part.name,
      description: part.description || '',
      filamentWeight: part.filamentWeight.toString(),
      printTime: part.printTime?.toString() || '',
      quantity: part.quantity.toString(),
      filamentTypeId,
      filamentColorId,
    })
    setIsPartDialogOpen(true)
  }, [])

  const openEditHardwareDialog = useCallback((ph: ProjectHardware) => {
    setEditingHardware(ph)
    setHardwareForm({
      hardwareId: ph.hardware.id,
      quantity: ph.quantity.toString(),
    })
    setIsHardwareDialogOpen(true)
  }, [])

  const resetPartForm = useCallback(() => {
    setPartForm(initialPartForm)
    setEditingPart(null)
  }, [])

  const resetHardwareForm = useCallback(() => {
    setHardwareForm(initialHardwareForm)
    setEditingHardware(null)
  }, [])

  const getPartRequirement = useCallback((part: ProjectPart) => {
    if (part.filamentColor?.type) {
      return { type: part.filamentColor.type, color: part.filamentColor }
    }
    if (part.spool?.filament?.type && part.spool?.filament?.color) {
      return { type: part.spool.filament.type, color: part.spool.filament.color }
    }
    return null
  }, [])

  const getPartProjections = useCallback(
    (part: ProjectPart) => {
      const requirement = getPartRequirement(part)
      if (!requirement || part.filamentWeight <= 0) return []

      return filaments
        .filter(
          (filament) =>
            filament.color.id === requirement.color.id && filament.type.id === requirement.type.id
        )
        .map((filament) => ({
          filamentId: filament.id,
          brand: filament.brand,
          remainingWeight: filament.totalRemainingWeight,
          printableCount: Math.floor(filament.totalRemainingWeight / part.filamentWeight),
        }))
        .filter((f) => f.remainingWeight > 0)
        .sort((a, b) => b.printableCount - a.printableCount)
    },
    [filaments, getPartRequirement]
  )

  const totalFilament =
    (project?.parts ?? []).reduce(
      (sum, part) => sum + part.filamentWeight * part.quantity,
      0
    ) || 0
  const totalPrintTime =
    (project?.parts ?? []).reduce(
      (sum, part) => sum + (part.printTime || 0) * part.quantity,
      0
    ) || 0
  const totalParts =
    (project?.parts ?? []).reduce((sum, part) => sum + part.quantity, 0) || 0

  const availableHardware = hardware.filter(
    (h) => !(project?.hardware ?? []).some((ph) => ph.hardware.id === h.id)
  )

  return {
    project,
    cost,
    filaments,
    types,
    colors: filteredColors,
    hardware,
    availableHardware,
    isLoading,
    isEditing,
    setIsEditing,
    isPartDialogOpen,
    setIsPartDialogOpen,
    isHardwareDialogOpen,
    setIsHardwareDialogOpen,
    editingPart,
    editingHardware,
    isSaving,
    projectForm,
    setProjectForm,
    partForm,
    setPartForm,
    hardwareForm,
    setHardwareForm,
    totalFilament,
    totalPrintTime,
    totalParts,
    handleSaveProject,
    handleAddPart,
    handleUpdatePart,
    handleDeletePart,
    handleAddHardware,
    handleUpdateHardware,
    handleDeleteHardware,
    openEditPartDialog,
    openEditHardwareDialog,
    resetPartForm,
    resetHardwareForm,
    getPartRequirement,
    getPartProjections,
  }
}

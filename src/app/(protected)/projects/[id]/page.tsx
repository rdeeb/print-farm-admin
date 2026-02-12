'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { ArrowLeft, Plus, Pencil, Trash2, Layers, Clock, Package, Save, DollarSign, Wrench } from 'lucide-react'
import { formatDuration, formatCurrency } from '@/lib/utils'
import { useSettings } from '@/components/providers/SettingsProvider'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'

type HardwareUnit = 'ITEMS' | 'ML' | 'GRAMS' | 'CM' | 'UNITS'

interface ProjectPart {
  id: string
  name: string
  description: string | null
  filamentWeight: number
  printTime: number | null
  quantity: number
  filamentColor: {
    id: string
    name: string
    hex: string
    type: {
      id: string
      name: string
      code: string
    }
  } | null
  spool: {
    id: string
    filament: {
      brand: string
      color: {
        id: string
        name: string
        hex: string
      }
      type: {
        id: string
        name: string
        code: string
      }
    }
  } | null
}

interface ProjectHardware {
  id: string
  quantity: number
  hardware: {
    id: string
    name: string
    packPrice: number
    packQuantity: number
    packUnit: HardwareUnit
  }
}

interface Hardware {
  id: string
  name: string
  packPrice: number
  packQuantity: number
  packUnit: HardwareUnit
}

interface Project {
  id: string
  name: string
  description: string | null
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  assemblyTime: number | null
  salesPrice: number | null
  parts: ProjectPart[]
  hardware: ProjectHardware[]
  _count: {
    orders: number
  }
  createdAt: string
}

interface CostBreakdown {
  filamentCost: number
  laborCost: number
  energyCost: number
  hardwareCost: number
  printerOperatingCost: number
  totalCost: number
}

interface Filament {
  id: string
  brand: string
  totalRemainingWeight: number
  type: { id: string; name: string; code: string }
  color: { id: string; name: string; hex: string }
}

interface FilamentType {
  id: string
  name: string
  code: string
}

interface FilamentColor {
  id: string
  name: string
  hex: string
  typeId: string
}

const statusConfig = {
  DRAFT: { label: 'Draft', variant: 'secondary' as const },
  ACTIVE: { label: 'Active', variant: 'default' as const },
  COMPLETED: { label: 'Completed', variant: 'success' as const },
  ARCHIVED: { label: 'Archived', variant: 'outline' as const },
}

const UNIT_LABELS: Record<HardwareUnit, string> = {
  ITEMS: 'items',
  ML: 'ml',
  GRAMS: 'grams',
  CM: 'cm',
  UNITS: 'units',
}

export default function ProjectDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const { settings } = useSettings()
  const [project, setProject] = useState<Project | null>(null)
  const [filaments, setFilaments] = useState<Filament[]>([])
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

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'DRAFT',
    assemblyTime: '',
    salesPrice: '',
  })

  const [partForm, setPartForm] = useState({
    name: '',
    description: '',
    filamentWeight: '',
    printTime: '',
    quantity: '1',
    filamentTypeId: '',
    filamentColorId: '',
  })

  const [hardwareForm, setHardwareForm] = useState({
    hardwareId: '',
    quantity: '1',
  })

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

        if (filamentsRes.ok) {
          setFilaments(await filamentsRes.json())
        }

        if (typesRes.ok) {
          setTypes(await typesRes.json())
        }

        if (colorsRes.ok) {
          setColors(await colorsRes.json())
        }

        if (hardwareRes.ok) {
          setHardware(await hardwareRes.json())
        }

        // Fetch cost calculation
        const costRes = await fetch(`/api/projects/${projectId}/cost`)
        if (costRes.ok) {
          setCost(await costRes.json())
        }
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
      setFilteredColors(colors.filter(color => color.typeId === partForm.filamentTypeId))
    } else {
      setFilteredColors([])
    }
  }, [partForm.filamentTypeId, colors])

  const refreshCost = async () => {
    try {
      const costRes = await fetch(`/api/projects/${projectId}/cost`)
      if (costRes.ok) {
        setCost(await costRes.json())
      }
    } catch (error) {
      console.error('Error refreshing cost:', error)
    }
  }

  const handleSaveProject = async () => {
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
        setProject({ ...project!, ...updated, hardware: project!.hardware })
        setIsEditing(false)
        refreshCost()
      }
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/projects/${projectId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: partForm.name,
          description: partForm.description || null,
          filamentWeight: parseFloat(partForm.filamentWeight),
          printTime: partForm.printTime ? parseInt(partForm.printTime) : null,
          quantity: parseInt(partForm.quantity),
          filamentColorId: partForm.filamentColorId || null,
        }),
      })

      if (response.ok) {
        const newPart = await response.json()
        setProject({
          ...project!,
          parts: [...project!.parts, newPart],
        })
        setIsPartDialogOpen(false)
        resetPartForm()
        refreshCost()
      }
    } catch (error) {
      console.error('Error adding part:', error)
    }
  }

  const handleUpdatePart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPart) return

    try {
      const response = await fetch(`/api/projects/${projectId}/parts/${editingPart.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: partForm.name,
          description: partForm.description || null,
          filamentWeight: parseFloat(partForm.filamentWeight),
          printTime: partForm.printTime ? parseInt(partForm.printTime) : null,
          quantity: parseInt(partForm.quantity),
          filamentColorId: partForm.filamentColorId || null,
        }),
      })

      if (response.ok) {
        const updatedPart = await response.json()
        setProject({
          ...project!,
          parts: project!.parts.map(p => p.id === editingPart.id ? updatedPart : p),
        })
        setEditingPart(null)
        setIsPartDialogOpen(false)
        resetPartForm()
        refreshCost()
      }
    } catch (error) {
      console.error('Error updating part:', error)
    }
  }

  const handleDeletePart = async (partId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/parts/${partId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProject({
          ...project!,
          parts: project!.parts.filter(p => p.id !== partId),
        })
        refreshCost()
      }
    } catch (error) {
      console.error('Error deleting part:', error)
    }
  }

  const handleAddHardware = async (e: React.FormEvent) => {
    e.preventDefault()
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
        const existingIndex = project!.hardware.findIndex(h => h.hardware.id === newHardware.hardware.id)
        if (existingIndex >= 0) {
          // Update existing
          setProject({
            ...project!,
            hardware: project!.hardware.map((h, i) => i === existingIndex ? newHardware : h),
          })
        } else {
          // Add new
          setProject({
            ...project!,
            hardware: [...project!.hardware, newHardware],
          })
        }
        setIsHardwareDialogOpen(false)
        resetHardwareForm()
        refreshCost()
      }
    } catch (error) {
      console.error('Error adding hardware:', error)
    }
  }

  const handleUpdateHardware = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHardware) return

    try {
      const response = await fetch(`/api/projects/${projectId}/hardware/${editingHardware.hardware.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseFloat(hardwareForm.quantity),
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        setProject({
          ...project!,
          hardware: project!.hardware.map(h => h.id === editingHardware.id ? updated : h),
        })
        setEditingHardware(null)
        setIsHardwareDialogOpen(false)
        resetHardwareForm()
        refreshCost()
      }
    } catch (error) {
      console.error('Error updating hardware:', error)
    }
  }

  const handleDeleteHardware = async (hardwareId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/hardware/${hardwareId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProject({
          ...project!,
          hardware: project!.hardware.filter(h => h.hardware.id !== hardwareId),
        })
        refreshCost()
      }
    } catch (error) {
      console.error('Error deleting hardware:', error)
    }
  }

  const openEditPartDialog = (part: ProjectPart) => {
    setEditingPart(part)
    const filamentTypeId = part.filamentColor?.type.id || part.spool?.filament?.type.id || ''
    const filamentColorId = part.filamentColor?.id || part.spool?.filament?.color.id || ''
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
  }

  const openEditHardwareDialog = (ph: ProjectHardware) => {
    setEditingHardware(ph)
    setHardwareForm({
      hardwareId: ph.hardware.id,
      quantity: ph.quantity.toString(),
    })
    setIsHardwareDialogOpen(true)
  }

  const resetPartForm = () => {
    setPartForm({
      name: '',
      description: '',
      filamentWeight: '',
      printTime: '',
      quantity: '1',
      filamentTypeId: '',
      filamentColorId: '',
    })
    setEditingPart(null)
  }

  const resetHardwareForm = () => {
    setHardwareForm({
      hardwareId: '',
      quantity: '1',
    })
    setEditingHardware(null)
  }

  const getPartRequirement = (part: ProjectPart) => {
    if (part.filamentColor?.type) {
      return { type: part.filamentColor.type, color: part.filamentColor }
    }

    if (part.spool?.filament?.type && part.spool?.filament?.color) {
      return { type: part.spool.filament.type, color: part.spool.filament.color }
    }

    return null
  }

  const getPartProjections = (part: ProjectPart) => {
    const requirement = getPartRequirement(part)
    if (!requirement || part.filamentWeight <= 0) return []

    return filaments
      .filter(filament => (
        filament.color.id === requirement.color.id &&
        filament.type.id === requirement.type.id
      ))
      .map(filament => ({
        filamentId: filament.id,
        brand: filament.brand,
        remainingWeight: filament.totalRemainingWeight,
        printableCount: Math.floor(filament.totalRemainingWeight / part.filamentWeight),
      }))
      .filter(filament => filament.remainingWeight > 0)
      .sort((a, b) => b.printableCount - a.printableCount)
  }

  const totalFilament = project?.parts.reduce((sum, part) => sum + (part.filamentWeight * part.quantity), 0) || 0
  const totalPrintTime = project?.parts.reduce((sum, part) => sum + ((part.printTime || 0) * part.quantity), 0) || 0
  const totalParts = project?.parts.reduce((sum, part) => sum + part.quantity, 0) || 0

  // Get available hardware not yet in project
  const availableHardware = hardware.filter(h => !project?.hardware.some(ph => ph.hardware.id === h.id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) return null

  const canEdit = session?.user?.role !== 'VIEWER'
  const status = statusConfig[project.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            {isEditing ? (
              <Input
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                className="text-2xl font-bold h-auto py-1"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            )}
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-sm text-gray-500">
                {project._count.orders} order{project._count.orders !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSaveProject} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Landed Cost & Earnings Card */}
      {cost && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
              Cost & Earnings (per unit)
            </CardTitle>
            <CardDescription>Landed cost breakdown and sales price for one complete unit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <p className="text-sm text-gray-500">Filament</p>
                <p className="text-lg font-semibold">{formatCurrency(cost.filamentCost, settings.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Labor</p>
                <p className="text-lg font-semibold">{formatCurrency(cost.laborCost, settings.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Energy</p>
                <p className="text-lg font-semibold">{formatCurrency(cost.energyCost, settings.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hardware</p>
                <p className="text-lg font-semibold">{formatCurrency(cost.hardwareCost, settings.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Printer Operating</p>
                <p className="text-lg font-semibold">{formatCurrency(cost.printerOperatingCost, settings.currency)}</p>
              </div>
              <div className="border-l-2 border-indigo-300 pl-4">
                <p className="text-sm text-indigo-600 font-medium">Total Cost</p>
                <p className="text-2xl font-bold text-indigo-700">{formatCurrency(cost.totalCost, settings.currency)}</p>
              </div>
            </div>
            {(() => {
              const salesPrice = isEditing && projectForm.salesPrice !== ''
                ? parseFloat(projectForm.salesPrice)
                : project.salesPrice
              if (salesPrice == null || salesPrice <= 0) return null
              const earnings = salesPrice - cost.totalCost
              return (
                <div className="mt-4 pt-4 border-t border-indigo-200 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Sales Price</p>
                    <p className="text-lg font-semibold">{formatCurrency(salesPrice, settings.currency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Earnings</p>
                    <p className={`text-lg font-semibold ${earnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(earnings, settings.currency)}
                    </p>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Project Details */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Project description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={projectForm.status}
                  onValueChange={(value) => setProjectForm({ ...projectForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assembly Time (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  value={projectForm.assemblyTime}
                  onChange={(e) => setProjectForm({ ...projectForm, assemblyTime: e.target.value })}
                  placeholder="Time to assemble one unit"
                />
              </div>
              <div className="space-y-2">
                <Label>Sales Price (per unit)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={projectForm.salesPrice}
                  onChange={(e) => setProjectForm({ ...projectForm, salesPrice: e.target.value })}
                  placeholder="Selling price per unit"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
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
                <p className="text-2xl font-bold">{project.assemblyTime ? formatDuration(project.assemblyTime) : '-'}</p>
                <p className="text-sm text-gray-500">Assembly Time</p>
              </div>
              <Wrench className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parts</CardTitle>
              <CardDescription>Manage the parts in this project</CardDescription>
            </div>
            {canEdit && (
              <Dialog open={isPartDialogOpen} onOpenChange={(open) => {
                setIsPartDialogOpen(open)
                if (!open) resetPartForm()
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Part
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingPart ? 'Edit Part' : 'Add New Part'}</DialogTitle>
                    <DialogDescription>
                      {editingPart ? 'Update the part details' : 'Add a new part to this project'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={editingPart ? handleUpdatePart : handleAddPart} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="partName">Part Name</Label>
                      <Input
                        id="partName"
                        value={partForm.name}
                        onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                        placeholder="e.g., Base Plate"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="partDescription">Description</Label>
                      <Input
                        id="partDescription"
                        value={partForm.description}
                        onChange={(e) => setPartForm({ ...partForm, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="filamentWeight">Filament (g)</Label>
                        <Input
                          id="filamentWeight"
                          type="number"
                          step="0.1"
                          value={partForm.filamentWeight}
                          onChange={(e) => setPartForm({ ...partForm, filamentWeight: e.target.value })}
                          placeholder="50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="printTime">Print Time (min)</Label>
                        <Input
                          id="printTime"
                          type="number"
                          value={partForm.printTime}
                          onChange={(e) => setPartForm({ ...partForm, printTime: e.target.value })}
                          placeholder="120"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity per Set</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={partForm.quantity}
                        onChange={(e) => setPartForm({ ...partForm, quantity: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Filament Type</Label>
                      <Select
                        value={partForm.filamentTypeId || 'none'}
                        onValueChange={(value) => {
                          const nextTypeId = value === 'none' ? '' : value
                          setPartForm({ ...partForm, filamentTypeId: nextTypeId, filamentColorId: '' })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No filament requirement</SelectItem>
                          {types.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} ({type.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select
                        value={partForm.filamentColorId || 'none'}
                        onValueChange={(value) => setPartForm({ ...partForm, filamentColorId: value === 'none' ? '' : value })}
                        disabled={!partForm.filamentTypeId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={partForm.filamentTypeId ? 'Select color' : 'Select type first'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No color assigned</SelectItem>
                          {filteredColors.map((color) => (
                            <SelectItem key={color.id} value={color.id}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded border"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span>{color.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsPartDialogOpen(false)
                        resetPartForm()
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit">{editingPart ? 'Update Part' : 'Add Part'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {project.parts.length > 0 ? (
            <div className="space-y-4">
              {project.parts.map((part) => {
                const requirement = getPartRequirement(part)
                const projections = getPartProjections(part)

                return (
                  <div
                    key={part.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Layers className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{part.name}</h4>
                        <p className="text-sm text-gray-500">
                          {part.quantity}x • {part.filamentWeight}g each
                          {part.printTime && ` • ${formatDuration(part.printTime)}`}
                        </p>
                        {requirement ? (
                          <div className="flex items-center space-x-2 mt-2">
                            <div
                              className="w-3 h-3 rounded border"
                              style={{ backgroundColor: requirement.color.hex }}
                            />
                            <span className="text-xs text-gray-500">
                              {requirement.type.name} - {requirement.color.name}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-2">No filament requirement set</p>
                        )}
                        {requirement && (
                          <div className="mt-2 text-xs text-gray-500">
                            <p className="font-medium text-gray-700">Inventory projection</p>
                            {projections.length > 0 ? (
                              <div className="mt-1 space-y-1">
                                {projections.map((projection) => (
                                  <div key={projection.filamentId} className="flex items-center justify-between">
                                    <span>{projection.brand}</span>
                                    <span>
                                      {projection.printableCount} part{projection.printableCount !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-400 mt-1">No matching spools in inventory</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditPartDialog(part)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Part</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{part.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePart(part.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No parts yet</p>
              <p className="text-sm">Add parts to define what needs to be printed for this project</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hardware Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hardware Requirements</CardTitle>
              <CardDescription>Additional hardware needed per unit (screws, glue, etc.)</CardDescription>
            </div>
            {canEdit && (
              <Dialog open={isHardwareDialogOpen} onOpenChange={(open) => {
                setIsHardwareDialogOpen(open)
                if (!open) resetHardwareForm()
              }}>
                <DialogTrigger asChild>
                  <Button disabled={availableHardware.length === 0 && !editingHardware}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hardware
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingHardware ? 'Edit Hardware' : 'Add Hardware'}</DialogTitle>
                    <DialogDescription>
                      {editingHardware ? 'Update the quantity needed' : 'Select hardware and specify quantity needed per unit'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={editingHardware ? handleUpdateHardware : handleAddHardware} className="space-y-4 mt-4">
                    {editingHardware ? (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{editingHardware.hardware.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(editingHardware.hardware.packPrice / editingHardware.hardware.packQuantity, settings.currency)} per {UNIT_LABELS[editingHardware.hardware.packUnit].slice(0, -1)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Hardware Item</Label>
                        <Select
                          value={hardwareForm.hardwareId}
                          onValueChange={(value) => setHardwareForm({ ...hardwareForm, hardwareId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select hardware" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableHardware.map((h) => (
                              <SelectItem key={h.id} value={h.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{h.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {formatCurrency(h.packPrice / h.packQuantity, settings.currency)}/{UNIT_LABELS[h.packUnit].slice(0, -1)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {availableHardware.length === 0 && (
                          <p className="text-sm text-gray-500">
                            All hardware items have been added. <Link href="/hardware" className="text-indigo-600 hover:underline">Add more hardware</Link>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="hardwareQuantity">Quantity per Unit</Label>
                      <Input
                        id="hardwareQuantity"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={hardwareForm.quantity}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, quantity: e.target.value })}
                        placeholder="2"
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsHardwareDialogOpen(false)
                        resetHardwareForm()
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!editingHardware && !hardwareForm.hardwareId}>
                        {editingHardware ? 'Update' : 'Add Hardware'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {project.hardware.length > 0 ? (
            <div className="space-y-3">
              {project.hardware.map((ph) => {
                const unitCost = ph.hardware.packPrice / ph.hardware.packQuantity
                const totalCost = unitCost * ph.quantity

                return (
                  <div
                    key={ph.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Wrench className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{ph.hardware.name}</h4>
                        <p className="text-sm text-gray-500">
                          {ph.quantity} {UNIT_LABELS[ph.hardware.packUnit]} @ {formatCurrency(unitCost, settings.currency)} each
                        </p>
                        <p className="text-sm font-medium text-indigo-600">
                          {formatCurrency(totalCost, settings.currency)} per unit
                        </p>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditHardwareDialog(ph)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Hardware</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove "{ph.hardware.name}" from this project?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteHardware(ph.hardware.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No hardware requirements</p>
              <p className="text-sm">Add hardware items like screws, glue, or other consumables</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

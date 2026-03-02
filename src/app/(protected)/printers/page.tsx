'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { Plus, Printer, Power, AlertTriangle, Wrench, Pause, Play, Zap, Pencil } from 'lucide-react'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'
import type { PrinterData, PrinterModel } from '@/model/printer'

const statusConfig = {
  IDLE: { label: 'Idle', variant: 'secondary' as const, icon: Power, color: 'text-green-500' },
  PRINTING: { label: 'Printing', variant: 'default' as const, icon: Play, color: 'text-blue-500' },
  PAUSED: { label: 'Paused', variant: 'warning' as const, icon: Pause, color: 'text-yellow-500' },
  ERROR: { label: 'Error', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-500' },
  MAINTENANCE: { label: 'Maintenance', variant: 'outline' as const, icon: Wrench, color: 'text-orange-500' },
  OFFLINE: { label: 'Offline', variant: 'secondary' as const, icon: Power, color: 'text-gray-500' },
}

export default function PrintersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [printers, setPrinters] = useState<PrinterData[]>([])
  const [printerModels, setPrinterModels] = useState<PrinterModel[]>([])
  const [printerModelsByBrand, setPrinterModelsByBrand] = useState<Record<string, PrinterModel[]>>({})
  const [brands, setBrands] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedPreset, setSelectedPreset] = useState<string>('')

  // Initialize state from URL on mount and when URL changes
  useEffect(() => {
    setFilterStatus(searchParams.get('status') ?? '')
  }, [searchParams])

  // Push filter state to URL when user changes filters (skip first run)
  const hasAppliedUrlSync = useRef(false)
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    const qs = params.toString()
    router.replace(qs ? `/printers?${qs}` : '/printers', { scroll: false })
  }, [filterStatus, router])

  useEffect(() => {
    if (!hasAppliedUrlSync.current) {
      hasAppliedUrlSync.current = true
      return
    }
    updateUrl()
  }, [filterStatus, updateUrl])

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    brand: '',
    nozzleSize: '0.4',
    buildVolumeX: '220',
    buildVolumeY: '220',
    buildVolumeZ: '250',
    powerConsumption: '',
    cost: '',
  })
  const [editingPrinter, setEditingPrinter] = useState<PrinterData | null>(null)
  const [editForm, setEditForm] = useState({ name: '', powerConsumption: '', cost: '' })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [printersRes, modelsRes] = await Promise.all([
          fetch('/api/printers'),
          fetch('/api/printer-models'),
        ])

        if (printersRes.ok) {
          const data = await printersRes.json()
          setPrinters(data)
        }

        if (modelsRes.ok) {
          const data = await modelsRes.json()
          setPrinterModels(data.models)
          setPrinterModelsByBrand(data.grouped)
          setBrands(data.brands)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId)

    if (presetId === 'custom') {
      // Reset to default values for custom entry
      setFormData({
        name: '',
        model: '',
        brand: '',
        nozzleSize: '0.4',
        buildVolumeX: '220',
        buildVolumeY: '220',
        buildVolumeZ: '250',
        powerConsumption: '',
        cost: '',
      })
      return
    }

    const preset = printerModels.find((m) => m.id === presetId)
    if (preset) {
      setFormData({
        name: '', // User still needs to enter a unique name
        model: preset.model,
        brand: preset.brand,
        nozzleSize: preset.defaultNozzle.toString(),
        buildVolumeX: preset.buildVolumeX.toString(),
        buildVolumeY: preset.buildVolumeY.toString(),
        buildVolumeZ: preset.buildVolumeZ.toString(),
        powerConsumption: preset.avgPowerConsumption?.toString() || '',
        cost: '',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          model: formData.model,
          brand: formData.brand || null,
          nozzleSize: parseFloat(formData.nozzleSize),
          buildVolume: {
            x: parseInt(formData.buildVolumeX),
            y: parseInt(formData.buildVolumeY),
            z: parseInt(formData.buildVolumeZ),
          },
          powerConsumption: formData.powerConsumption ? parseFloat(formData.powerConsumption) : null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
        }),
      })

      if (response.ok) {
        const newPrinter = await response.json()
        setPrinters([newPrinter, ...printers])
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creating printer:', error)
    }
  }

  const resetForm = () => {
    setSelectedPreset('')
    setFormData({
      name: '',
      model: '',
      brand: '',
      nozzleSize: '0.4',
      buildVolumeX: '220',
      buildVolumeY: '220',
      buildVolumeZ: '250',
      powerConsumption: '',
      cost: '',
    })
  }

  const openEditPrinter = (printer: PrinterData) => {
    setEditingPrinter(printer)
    setEditForm({
      name: printer.name,
      powerConsumption: printer.powerConsumption?.toString() ?? '',
      cost: printer.cost?.toString() ?? '',
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPrinter) return
    setIsSavingEdit(true)
    try {
      const response = await fetch(`/api/printers/${editingPrinter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          powerConsumption: editForm.powerConsumption ? parseFloat(editForm.powerConsumption) : null,
          cost: editForm.cost ? parseFloat(editForm.cost) : null,
        }),
      })
      if (response.ok) {
        const updated = await response.json()
        setPrinters(printers.map((p) => (p.id === editingPrinter.id ? updated : p)))
        setEditingPrinter(null)
      }
    } catch (error) {
      console.error('Error updating printer:', error)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const filteredPrinters = printers.filter((printer) => {
    if (!filterStatus) return true
    return printer.status === filterStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading printers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Printers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your 3D printers and monitor their status
          </p>
        </div>

        {session?.user?.role !== 'VIEWER' && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Printer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Printer</DialogTitle>
                <DialogDescription>
                  Select a preset model or enter custom specifications
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Preset Selection */}
                <div className="space-y-2">
                  <Label>Printer Preset</Label>
                  <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a printer model or enter custom" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <SelectItem value="custom">
                        <span className="font-medium">Custom Printer</span>
                      </SelectItem>
                      {brands.map((brand) => (
                        <SelectGroup key={brand}>
                          <SelectLabel className="font-semibold text-primary">{brand}</SelectLabel>
                          {printerModelsByBrand[brand]?.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{model.model}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {model.buildVolumeX}x{model.buildVolumeY}x{model.buildVolumeZ}mm
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Printer Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Printer Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Bambu X1C #1, Printer Station A"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique name to identify this printer in your farm
                  </p>
                </div>

                {/* Brand & Model */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., Bambu Lab"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g., X1 Carbon"
                      required
                    />
                  </div>
                </div>

                {/* Build Volume */}
                <div className="space-y-2">
                  <Label>Build Volume (mm)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Input
                        placeholder="X"
                        value={formData.buildVolumeX}
                        onChange={(e) => setFormData({ ...formData, buildVolumeX: e.target.value })}
                      />
                      <span className="text-xs text-muted-foreground">Width</span>
                    </div>
                    <div>
                      <Input
                        placeholder="Y"
                        value={formData.buildVolumeY}
                        onChange={(e) => setFormData({ ...formData, buildVolumeY: e.target.value })}
                      />
                      <span className="text-xs text-muted-foreground">Depth</span>
                    </div>
                    <div>
                      <Input
                        placeholder="Z"
                        value={formData.buildVolumeZ}
                        onChange={(e) => setFormData({ ...formData, buildVolumeZ: e.target.value })}
                      />
                      <span className="text-xs text-muted-foreground">Height</span>
                    </div>
                  </div>
                </div>

                {/* Nozzle & Power */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nozzleSize">Nozzle Size (mm)</Label>
                    <Input
                      id="nozzleSize"
                      value={formData.nozzleSize}
                      onChange={(e) => setFormData({ ...formData, nozzleSize: e.target.value })}
                      placeholder="0.4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="powerConsumption">Avg. Power (W)</Label>
                    <Input
                      id="powerConsumption"
                      value={formData.powerConsumption}
                      onChange={(e) => setFormData({ ...formData, powerConsumption: e.target.value })}
                      placeholder="e.g., 350"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                  Power consumption is used to calculate energy costs
                </p>

                <div className="space-y-2">
                  <Label htmlFor="cost">Printer Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="Total cost; operating cost/hr = cost ÷ 13140"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for landed cost: operating cost per hour = cost ÷ 13140 (highest among printers)
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Printer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Printer Dialog */}
        <Dialog open={!!editingPrinter} onOpenChange={(open) => { if (!open) setEditingPrinter(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Printer</DialogTitle>
              <DialogDescription>
                Update name, power consumption, and cost. Operating cost per hour = cost ÷ 13140 (used in landed cost).
              </DialogDescription>
            </DialogHeader>
            {editingPrinter && (
              <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-power">Avg. Power (W)</Label>
                  <Input
                    id="edit-power"
                    type="number"
                    min="0"
                    value={editForm.powerConsumption}
                    onChange={(e) => setEditForm({ ...editForm, powerConsumption: e.target.value })}
                    placeholder="e.g., 350"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cost">Printer Cost</Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.cost}
                    onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                    placeholder="Total cost; operating cost/hr = cost ÷ 13140"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingPrinter(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSavingEdit}>
                    {isSavingEdit ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="IDLE">Idle</SelectItem>
                <SelectItem value="PRINTING">Printing</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500">
              {filteredPrinters.length} printer{filteredPrinters.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrinters.map((printer) => {
          const status = statusConfig[printer.status]
          const StatusIcon = status.icon

          return (
            <Card key={printer.id} className={`relative ${!printer.isActive ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gray-100`}>
                      <Printer className={`h-6 w-6 ${status.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{printer.name}</CardTitle>
                      <CardDescription>
                        {printer.brand && `${printer.brand} `}{printer.model}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session?.user?.role !== 'VIEWER' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditPrinter(printer)}
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
                        {printer.buildVolume.x} x {printer.buildVolume.y} x {printer.buildVolume.z} mm
                      </span>
                    </div>
                  )}
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
        })}

        {filteredPrinters.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Printer className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No printers found</h3>
              <p className="text-gray-500 text-center mb-4">
                {printers.length === 0
                  ? "You haven't added any printers yet."
                  : 'No printers match your current filter.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Search, Pencil, Trash2, Wrench, Coins } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useSettings } from '@/components/providers/SettingsProvider'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'
import type { Hardware, HardwareUnit } from '@/model/hardware'

const UNIT_LABELS: Record<HardwareUnit, string> = {
  ITEMS: 'items',
  ML: 'ml',
  GRAMS: 'grams',
  CM: 'cm',
  UNITS: 'units',
}

const UNIT_OPTIONS: { value: HardwareUnit; label: string; description: string }[] = [
  { value: 'ITEMS', label: 'Items', description: 'Screws, nuts, bolts, etc.' },
  { value: 'ML', label: 'Milliliters', description: 'Glue, resin, etc.' },
  { value: 'GRAMS', label: 'Grams', description: 'Putty, filler, etc.' },
  { value: 'CM', label: 'Centimeters', description: 'Tape, wire, etc.' },
  { value: 'UNITS', label: 'Units', description: 'Generic units' },
]

export default function HardwarePage() {
  const { data: session } = useSession()
  const { settings } = useSettings()
  const [hardware, setHardware] = useState<Hardware[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHardware, setEditingHardware] = useState<Hardware | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [form, setForm] = useState({
    name: '',
    packPrice: '',
    packQuantity: '',
    packUnit: 'ITEMS' as HardwareUnit,
    description: '',
  })

  useEffect(() => {
    fetchHardware()
  }, [])

  const fetchHardware = async () => {
    try {
      const res = await fetch('/api/hardware')
      if (res.ok) {
        setHardware(await res.json())
      }
    } catch (error) {
      console.error('Error fetching hardware:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: '',
      packPrice: '',
      packQuantity: '',
      packUnit: 'ITEMS',
      description: '',
    })
    setEditingHardware(null)
  }

  const openEditDialog = (item: Hardware) => {
    setEditingHardware(item)
    setForm({
      name: item.name,
      packPrice: item.packPrice.toString(),
      packQuantity: item.packQuantity.toString(),
      packUnit: item.packUnit,
      description: item.description || '',
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      name: form.name,
      packPrice: parseFloat(form.packPrice),
      packQuantity: parseFloat(form.packQuantity),
      packUnit: form.packUnit,
      description: form.description || null,
    }

    try {
      if (editingHardware) {
        const res = await fetch(`/api/hardware/${editingHardware.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setHardware(hardware.map(h => h.id === editingHardware.id ? updated : h))
          setIsDialogOpen(false)
          resetForm()
        }
      } else {
        const res = await fetch('/api/hardware', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const newItem = await res.json()
          setHardware([...hardware, newItem])
          setIsDialogOpen(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving hardware:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/hardware/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setHardware(hardware.filter(h => h.id !== id))
      }
    } catch (error) {
      console.error('Error deleting hardware:', error)
    }
  }

  const filteredHardware = hardware.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const canEdit = session?.user?.role !== 'VIEWER'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading hardware inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hardware Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Manage hardware items used in projects (screws, glue, tape, etc.)</p>
        </div>

        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Hardware</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingHardware ? 'Edit Hardware' : 'Add Hardware'}</DialogTitle>
                <DialogDescription>
                  {editingHardware ? 'Update hardware item details' : 'Add a new hardware item to inventory'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., M3x8mm Screws"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="packPrice">Pack Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">{settings.currency === 'USD' ? '$' : settings.currency}</span>
                      <Input
                        id="packPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.packPrice}
                        onChange={(e) => setForm({ ...form, packPrice: e.target.value })}
                        placeholder="9.99"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="packQuantity">Pack Quantity</Label>
                    <Input
                      id="packQuantity"
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.packQuantity}
                      onChange={(e) => setForm({ ...form, packQuantity: e.target.value })}
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Unit Type</Label>
                  <Select
                    value={form.packUnit}
                    onValueChange={(value: HardwareUnit) => setForm({ ...form, packUnit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <span>{option.label}</span>
                            <span className="text-xs text-gray-500 ml-2">({option.description})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Additional notes about this hardware item"
                    rows={2}
                  />
                </div>

                {form.packPrice && form.packQuantity && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Unit cost: <span className="font-medium">
                        {formatCurrency(parseFloat(form.packPrice) / parseFloat(form.packQuantity), settings.currency)}
                      </span> per {UNIT_LABELS[form.packUnit].slice(0, -1)}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingHardware ? 'Update' : 'Add Hardware'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{hardware.length}</p>
            <p className="text-sm text-gray-500">Hardware Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">
              {hardware.reduce((sum, h) => sum + (h._count?.projects ?? 0), 0)}
            </p>
            <p className="text-sm text-gray-500">Used in Projects</p>
          </CardContent>
        </Card>
        <Card className="hidden md:block">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">
              {formatCurrency(hardware.reduce((sum, h) => sum + h.packPrice, 0), settings.currency)}
            </p>
            <p className="text-sm text-gray-500">Total Inventory Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search hardware..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hardware Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHardware.map((item) => {
          const unitCost = item.packPrice / item.packQuantity

          return (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Wrench className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>
                        {item.packQuantity} {UNIT_LABELS[item.packUnit]} per pack
                      </CardDescription>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={(item._count?.projects ?? 0) > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Hardware</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
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
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pack price:</span>
                    <span className="font-medium">{formatCurrency(item.packPrice, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unit cost:</span>
                    <span className="font-medium">{formatCurrency(unitCost, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Used in:</span>
                    <span className="font-medium">{item._count?.projects ?? 0} project{(item._count?.projects ?? 0) !== 1 ? 's' : ''}</span>
                  </div>
                  {item.description && (
                    <p className="text-gray-500 text-xs pt-2 border-t">{item.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredHardware.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hardware found</h3>
              <p className="text-gray-500 text-center mb-4">
                {hardware.length === 0 ? "Start by adding hardware items." : "No hardware matches your search."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

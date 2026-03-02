'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
import { AlertTriangle, Package, Plus, Search, Coins } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useSettings } from '@/components/providers/SettingsProvider'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'
import type { FilamentSpool, FilamentType, FilamentColor } from '@/model/filament'

export default function FilamentPage() {
  const { data: session } = useSession()
  const { settings } = useSettings()
  const [spools, setSpools] = useState<FilamentSpool[]>([])
  const [types, setTypes] = useState<FilamentType[]>([])
  const [colors, setColors] = useState<FilamentColor[]>([])
  const [filteredColors, setFilteredColors] = useState<FilamentColor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStock, setFilterStock] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState({
    brand: '',
    weight: '',
    remainingWeight: '',
    remainingPercent: '',
    costPerKg: '',
    typeId: '',
    colorId: '',
    supplier: '',
    notes: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [spoolsRes, typesRes, colorsRes] = await Promise.all([
          fetch('/api/filament/spools'),
          fetch('/api/filament/types'),
          fetch('/api/filament/colors'),
        ])

        if (spoolsRes.ok) {
          const spoolsData = await spoolsRes.json()
          setSpools(spoolsData)
        }

        if (typesRes.ok) {
          const typesData = await typesRes.json()
          setTypes(typesData)
        }

        if (colorsRes.ok) {
          const colorsData = await colorsRes.json()
          setColors(colorsData)
        }
      } catch (error) {
        console.error('Error fetching filament data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (formData.typeId) {
      setFilteredColors(colors.filter(color => color.typeId === formData.typeId))
    } else {
      setFilteredColors([])
    }
  }, [formData.typeId, colors])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/filament/spools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: formData.brand,
          weight: parseFloat(formData.weight),
          remainingWeight: parseFloat(formData.remainingWeight),
          remainingPercent: parseInt(formData.remainingPercent),
          costPerKg: formData.costPerKg ? parseFloat(formData.costPerKg) : undefined,
          typeId: formData.typeId,
          colorId: formData.colorId,
          supplier: formData.supplier || undefined,
          notes: formData.notes || undefined,
        }),
      })

      if (response.ok) {
        const newSpool = await response.json()
        setSpools([newSpool, ...spools])
        setIsDialogOpen(false)
        setFormData({
          brand: '',
          weight: '',
          remainingWeight: '',
          remainingPercent: '',
          costPerKg: '',
          typeId: '',
          colorId: '',
          supplier: '',
          notes: '',
        })
      }
    } catch (error) {
      console.error('Error creating spool:', error)
    }
  }

  const filteredSpools = spools.filter(spool => {
    const matchesSearch = !searchTerm ||
      (spool.brand ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (spool.type?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (spool.color?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = !filterType || spool.type?.id === filterType

    const matchesStock = !filterStock ||
      (filterStock === 'low' && spool.remainingPercent < 20) ||
      (filterStock === 'medium' && spool.remainingPercent >= 20 && spool.remainingPercent < 50) ||
      (filterStock === 'high' && spool.remainingPercent >= 50)

    return matchesSearch && matchesType && matchesStock
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading filament inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filament Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your filament inventory and stock levels
          </p>
        </div>

        {session?.user?.role !== 'VIEWER' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Spool
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Filament Spool</DialogTitle>
                <DialogDescription>
                  Add a new filament spool to your inventory
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (g)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeId">Filament Type</Label>
                  <Select
                    value={formData.typeId}
                    onValueChange={(value) => setFormData({ ...formData, typeId: value, colorId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select filament type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colorId">Color</Label>
                  <Select
                    value={formData.colorId}
                    onValueChange={(value) => setFormData({ ...formData, colorId: value })}
                    disabled={!formData.typeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredColors.map((color) => (
                        <SelectItem key={color.id} value={color.id}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span>{color.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="remainingWeight">Remaining (g)</Label>
                    <Input
                      id="remainingWeight"
                      type="number"
                      value={formData.remainingWeight}
                      onChange={(e) => setFormData({ ...formData, remainingWeight: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remainingPercent">Remaining (%)</Label>
                    <Input
                      id="remainingPercent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.remainingPercent}
                      onChange={(e) => setFormData({ ...formData, remainingPercent: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPerKg">Cost per kg</Label>
                    <Input
                      id="costPerKg"
                      type="number"
                      step="0.01"
                      value={formData.costPerKg}
                      onChange={(e) => setFormData({ ...formData, costPerKg: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Spool</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by brand, type, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStock || 'all'} onValueChange={(v) => setFilterStock(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by stock level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="low">Low (&lt; 20%)</SelectItem>
                <SelectItem value="medium">Medium (20-50%)</SelectItem>
                <SelectItem value="high">High (&gt; 50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Spools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpools.map((spool) => (
          <Card key={spool.id} className="relative">
            {spool.remainingPercent < 20 && (
              <div className="absolute top-3 right-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{spool.brand}</span>
                <Badge
                  variant={
                    spool.remainingPercent < 20
                      ? 'destructive'
                      : spool.remainingPercent < 50
                        ? 'warning'
                        : 'success'
                  }
                >
                  {spool.remainingPercent}%
                </Badge>
              </CardTitle>
              <CardDescription>
                {spool.type?.name ?? '—'} • {spool.color?.name ?? '—'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: spool.color?.hex ?? '#ccc' }}
                  />
                  <span className="text-sm text-gray-600">{spool.color?.name ?? '—'}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Remaining:</span>
                    <span className="font-medium">{spool.remainingWeight}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="text-gray-600">{spool.weight}g</span>
                  </div>
                  {spool.costPerKg && (
                    <div className="flex justify-between text-sm">
                      <span>Cost/kg:</span>
                      <span className="text-gray-600">
                        {formatCurrency(spool.costPerKg, settings.currency)}
                      </span>
                    </div>
                  )}
                  {spool.supplier && (
                    <div className="flex justify-between text-sm">
                      <span>Supplier:</span>
                      <span className="text-gray-600">{spool.supplier}</span>
                    </div>
                  )}
                </div>

                {/* Stock level bar */}
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${spool.remainingPercent < 20
                          ? 'bg-red-500'
                          : spool.remainingPercent < 50
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      style={{ width: `${spool.remainingPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Empty</span>
                    <span>Full</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSpools.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No spools found</h3>
            <p className="text-gray-500 text-center mb-4">
              {spools.length === 0
                ? "You haven't added any filament spools yet."
                : "No spools match your current filters."}
            </p>
            {session?.user?.role !== 'VIEWER' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Spool
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
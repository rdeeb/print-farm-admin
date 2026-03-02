'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import { AlertTriangle, Package, Plus, Search, Pencil, Trash2, ChevronDown, ChevronUp, Coins } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useSettings } from '@/components/providers/SettingsProvider'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'

// Popular filament brands for autocomplete
const POPULAR_BRANDS = [
  'Hatchbox', 'eSUN', 'Overture', 'Polymaker', 'Prusament', 'Amazon Basics',
  'Sunlu', 'Creality', 'Eryone', 'TTYT3D', 'Inland', 'MatterHackers',
  'ColorFabb', 'Fillamentum', 'FormFutura', 'Proto-pasta', 'Push Plastic',
  'Atomic Filament', '3D Solutech', 'Duramic', 'ZIRO', 'Geeetech', 'YOYI',
  'PRILINE', 'Bambu Lab', 'Anycubic', 'Elegoo',
]

import type { Filament, FilamentSpool, FilamentType, FilamentColor } from '@/model/filament'

export default function FilamentPage() {
  const { data: session } = useSession()
  const { settings } = useSettings()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filaments, setFilaments] = useState<Filament[]>([])
  const [types, setTypes] = useState<FilamentType[]>([])
  const [colors, setColors] = useState<FilamentColor[]>([])
  const [filteredColors, setFilteredColors] = useState<FilamentColor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFilamentDialogOpen, setIsFilamentDialogOpen] = useState(false)
  const [isSpoolDialogOpen, setIsSpoolDialogOpen] = useState(false)
  const [selectedFilament, setSelectedFilament] = useState<Filament | null>(null)
  const [expandedFilaments, setExpandedFilaments] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [brandSearch, setBrandSearch] = useState('')
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false)

  // Initialize state from URL on mount and when URL changes
  useEffect(() => {
    setSearchTerm(searchParams.get('search') ?? '')
    setFilterType(searchParams.get('type') ?? '')
    setLowStockOnly(searchParams.get('lowStock') === 'true')
  }, [searchParams])

  // Push filter state to URL when user changes filters (skip first run)
  const hasAppliedUrlSync = useRef(false)
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (filterType) params.set('type', filterType)
    if (lowStockOnly) params.set('lowStock', 'true')
    const qs = params.toString()
    router.replace(qs ? `/filament?${qs}` : '/filament', { scroll: false })
  }, [searchTerm, filterType, lowStockOnly, router])

  useEffect(() => {
    if (!hasAppliedUrlSync.current) {
      hasAppliedUrlSync.current = true
      return
    }
    updateUrl()
  }, [searchTerm, filterType, lowStockOnly, updateUrl])

  const [filamentForm, setFilamentForm] = useState({
    brand: '',
    typeId: '',
    colorId: '',
    costPerKg: '',
    supplier: '',
    notes: '',
  })

  const [spoolsToAdd, setSpoolsToAdd] = useState<{ weight: string; remainingPercent: string }[]>([
    { weight: '1000', remainingPercent: '100' },
  ])

  // Filter brand suggestions
  const brandSuggestions = useMemo(() => {
    if (!brandSearch) return POPULAR_BRANDS.slice(0, 8)
    const search = brandSearch.toLowerCase()
    return POPULAR_BRANDS.filter(brand => brand.toLowerCase().includes(search)).slice(0, 8)
  }, [brandSearch])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filamentsRes, typesRes, colorsRes] = await Promise.all([
          fetch('/api/filament/filaments'),
          fetch('/api/filament/types'),
          fetch('/api/filament/colors'),
        ])

        if (filamentsRes.ok) setFilaments(await filamentsRes.json())
        if (typesRes.ok) setTypes(await typesRes.json())
        if (colorsRes.ok) setColors(await colorsRes.json())
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (filamentForm.typeId) {
      setFilteredColors(colors.filter(color => color.typeId === filamentForm.typeId))
    } else {
      setFilteredColors([])
    }
  }, [filamentForm.typeId, colors])

  const resetFilamentForm = () => {
    setFilamentForm({ brand: '', typeId: '', colorId: '', costPerKg: '', supplier: '', notes: '' })
    setBrandSearch('')
  }

  const resetSpoolsForm = () => {
    setSpoolsToAdd([{ weight: '1000', remainingPercent: '100' }])
    setSelectedFilament(null)
  }

  const handleCreateFilament = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/filament/filaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: filamentForm.brand,
          typeId: filamentForm.typeId,
          colorId: filamentForm.colorId,
          costPerKg: filamentForm.costPerKg ? parseFloat(filamentForm.costPerKg) : undefined,
          supplier: filamentForm.supplier || undefined,
          notes: filamentForm.notes || undefined,
        }),
      })

      if (response.ok) {
        const newFilament = await response.json()
        setFilaments([newFilament, ...filaments])
        setIsFilamentDialogOpen(false)
        resetFilamentForm()
        // Open spool dialog for the new filament
        setSelectedFilament(newFilament)
        setIsSpoolDialogOpen(true)
      } else if (response.status === 409) {
        const data = await response.json()
        alert('This filament already exists. Please add spools to the existing one.')
        // Expand the existing filament
        setExpandedFilaments(new Set([...Array.from(expandedFilaments), data.existingId]))
      }
    } catch (error) {
      console.error('Error creating filament:', error)
    }
  }

  const handleAddSpools = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFilament) return

    try {
      const spools = spoolsToAdd.map(s => ({
        weight: parseFloat(s.weight),
        remainingPercent: parseInt(s.remainingPercent),
      }))

      const response = await fetch(`/api/filament/filaments/${selectedFilament.id}/spools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spools }),
      })

      if (response.ok) {
        const newSpools = await response.json()
        // Refresh filaments to get updated totals
        const filamentsRes = await fetch('/api/filament/filaments')
        if (filamentsRes.ok) {
          setFilaments(await filamentsRes.json())
        }
        setIsSpoolDialogOpen(false)
        resetSpoolsForm()
        // Expand the filament to show new spools
        setExpandedFilaments(new Set([...Array.from(expandedFilaments), selectedFilament.id]))
      }
    } catch (error) {
      console.error('Error adding spools:', error)
    }
  }

  const handleDeleteSpool = async (spoolId: string, filamentId: string) => {
    try {
      const response = await fetch(`/api/filament/spools/${spoolId}`, { method: 'DELETE' })
      if (response.ok) {
        // Refresh filaments
        const filamentsRes = await fetch('/api/filament/filaments')
        if (filamentsRes.ok) {
          setFilaments(await filamentsRes.json())
        }
      }
    } catch (error) {
      console.error('Error deleting spool:', error)
    }
  }

  const handleDeleteFilament = async (filamentId: string) => {
    try {
      const response = await fetch(`/api/filament/filaments/${filamentId}`, { method: 'DELETE' })
      if (response.ok) {
        setFilaments(filaments.filter(f => f.id !== filamentId))
      }
    } catch (error) {
      console.error('Error deleting filament:', error)
    }
  }

  const handleBrandSelect = (brand: string) => {
    setFilamentForm({ ...filamentForm, brand })
    setBrandSearch(brand)
    setShowBrandSuggestions(false)
  }

  const addSpoolRow = () => {
    setSpoolsToAdd([...spoolsToAdd, { weight: '1000', remainingPercent: '100' }])
  }

  const removeSpoolRow = (index: number) => {
    setSpoolsToAdd(spoolsToAdd.filter((_, i) => i !== index))
  }

  const updateSpoolRow = (index: number, field: 'weight' | 'remainingPercent', value: string) => {
    const updated = [...spoolsToAdd]
    updated[index][field] = value
    setSpoolsToAdd(updated)
  }

  const toggleExpanded = (filamentId: string) => {
    const newExpanded = new Set(expandedFilaments)
    if (newExpanded.has(filamentId)) {
      newExpanded.delete(filamentId)
    } else {
      newExpanded.add(filamentId)
    }
    setExpandedFilaments(newExpanded)
  }

  const filteredFilaments = filaments.filter(filament => {
    const matchesSearch = !searchTerm ||
      filament.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filament.type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filament.color.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = !filterType || filament.type.id === filterType

    const isLowStock = (filament.spools ?? []).some(s => s.remainingPercent < 20) || (filament._count?.spools ?? 0) === 0
    const matchesLowStock = !lowStockOnly || isLowStock

    return matchesSearch && matchesType && matchesLowStock
  })

  // Summary stats
  const totalSpools = filaments.reduce((sum, f) => sum + (f._count?.spools ?? 0), 0)
  const totalRemainingWeight = filaments.reduce((sum, f) => sum + (f.totalRemainingWeight ?? 0), 0)
  const lowStockFilaments = filaments.filter(f =>
    (f.spools ?? []).some(s => s.remainingPercent < 20) || (f._count?.spools ?? 0) === 0
  ).length

  const canEdit = session?.user?.role !== 'VIEWER'

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filament Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your filament types and track spool inventory</p>
        </div>

        {canEdit && (
          <Dialog open={isFilamentDialogOpen} onOpenChange={(open) => {
            setIsFilamentDialogOpen(open)
            if (!open) resetFilamentForm()
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Filament</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Filament</DialogTitle>
                <DialogDescription>Define a filament by brand, type, and color</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateFilament} className="space-y-4">
                {/* Brand with autocomplete */}
                <div className="space-y-2 relative">
                  <Label>Brand</Label>
                  <Input
                    value={brandSearch}
                    onChange={(e) => {
                      setBrandSearch(e.target.value)
                      setFilamentForm({ ...filamentForm, brand: e.target.value })
                      setShowBrandSuggestions(true)
                    }}
                    onFocus={() => setShowBrandSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                    placeholder="Search or enter brand..."
                    required
                    autoComplete="off"
                  />
                  {showBrandSuggestions && brandSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {brandSuggestions.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                          onMouseDown={() => handleBrandSelect(brand)}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Filament Type</Label>
                  <Select value={filamentForm.typeId} onValueChange={(value) => setFilamentForm({ ...filamentForm, typeId: value, colorId: '' })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.name} ({type.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select value={filamentForm.colorId} onValueChange={(value) => setFilamentForm({ ...filamentForm, colorId: value })} disabled={!filamentForm.typeId}>
                    <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                    <SelectContent>
                      {filteredColors.map((color) => (
                        <SelectItem key={color.id} value={color.id}>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: color.hex }} />
                            <span>{color.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost per kg</Label>
                    <Input type="number" step="0.01" value={filamentForm.costPerKg} onChange={(e) => setFilamentForm({ ...filamentForm, costPerKg: e.target.value })} placeholder="25.99" />
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Input value={filamentForm.supplier} onChange={(e) => setFilamentForm({ ...filamentForm, supplier: e.target.value })} placeholder="Amazon" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsFilamentDialogOpen(false); resetFilamentForm(); }}>Cancel</Button>
                  <Button type="submit">Create & Add Spools</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{filaments.length}</p>
            <p className="text-sm text-gray-500">Filament Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{totalSpools}</p>
            <p className="text-sm text-gray-500">Total Spools</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{(totalRemainingWeight / 1000).toFixed(1)}kg</p>
            <p className="text-sm text-gray-500">Total Remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{lowStockFilaments}</p>
            <p className="text-sm text-gray-500">Low Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Search filaments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              Low stock only
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Filaments List */}
      <div className="space-y-4">
        {filteredFilaments.map((filament) => {
          const isExpanded = expandedFilaments.has(filament.id)
          const filamentSpools = filament.spools ?? []
          const avgPercent = filamentSpools.length > 0
            ? Math.round(filamentSpools.reduce((sum, s) => sum + s.remainingPercent, 0) / filamentSpools.length)
            : 0
          const hasLowStock = filamentSpools.some(s => s.remainingPercent < 20)

          return (
            <Card key={filament.id} className={hasLowStock ? 'border-yellow-300' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 cursor-pointer" onClick={() => toggleExpanded(filament.id)}>
                    <div className="w-8 h-8 rounded-lg border shadow-sm" style={{ backgroundColor: filament.color.hex }} />
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {filament.brand} {filament.type.code} - {filament.color.name}
                        {hasLowStock && <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />}
                      </CardTitle>
                      <CardDescription>
                        {filament._count?.spools ?? 0} spool{(filament._count?.spools ?? 0) !== 1 ? 's' : ''} •{' '}
                        {((filament.totalRemainingWeight ?? 0) / 1000).toFixed(2)}kg remaining
                        {filament.costPerKg && ` • ${formatCurrency(filament.costPerKg, settings.currency)}/kg`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFilament(filament)
                          setIsSpoolDialogOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Spools
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => toggleExpanded(filament.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {canEdit && (filament._count?.spools ?? 0) === 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Filament</AlertDialogTitle>
                            <AlertDialogDescription>
                              Delete {filament.brand} {filament.type.code} {filament.color.name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteFilament(filament.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  {(filament.spools ?? []).length > 0 ? (
                    <div className="space-y-2">
                      {(filament.spools ?? []).map((spool, index) => (
                        <div key={spool.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">#{index + 1}</span>
                            <div>
                              <p className="font-medium">{spool.weight}g spool</p>
                              <p className="text-sm text-gray-500">
                                {spool.remainingWeight}g remaining ({spool.remainingPercent}%)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-24">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${spool.remainingPercent < 20 ? 'bg-red-500' : spool.remainingPercent < 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${spool.remainingPercent}%` }}
                                />
                              </div>
                            </div>
                            <Badge variant={spool.remainingPercent < 20 ? 'destructive' : spool.remainingPercent < 50 ? 'warning' : 'success'}>
                              {spool.remainingPercent}%
                            </Badge>
                            {canEdit && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Spool</AlertDialogTitle>
                                    <AlertDialogDescription>Delete this {spool.weight}g spool?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSpool(spool.id, filament.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No spools yet. Add some spools to track inventory.</p>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}

        {filteredFilaments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No filaments found</h3>
              <p className="text-gray-500 text-center mb-4">
                {filaments.length === 0 ? "Start by adding a filament type." : "No filaments match your search."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Spools Dialog */}
      <Dialog open={isSpoolDialogOpen} onOpenChange={(open) => {
        setIsSpoolDialogOpen(open)
        if (!open) resetSpoolsForm()
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Spools</DialogTitle>
            <DialogDescription>
              {selectedFilament && (
                <span className="flex items-center space-x-2 mt-1">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: selectedFilament.color.hex }} />
                  <span>{selectedFilament.brand} {selectedFilament.type.code} - {selectedFilament.color.name}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSpools} className="space-y-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {spoolsToAdd.map((spool, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500 w-6">#{index + 1}</span>
                  <div className="flex-1">
                    <Label className="text-xs">Size</Label>
                    <Select value={spool.weight} onValueChange={(value) => updateSpoolRow(index, 'weight', value)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="250">250g</SelectItem>
                        <SelectItem value="500">500g</SelectItem>
                        <SelectItem value="750">750g</SelectItem>
                        <SelectItem value="1000">1kg</SelectItem>
                        <SelectItem value="2000">2kg</SelectItem>
                        <SelectItem value="3000">3kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Remaining</Label>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={spool.remainingPercent}
                        onChange={(e) => updateSpoolRow(index, 'remainingPercent', e.target.value)}
                        className="h-9"
                      />
                      <span className="ml-1 text-sm">%</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {Math.round(parseFloat(spool.weight) * (parseInt(spool.remainingPercent) / 100))}g
                  </div>
                  {spoolsToAdd.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSpoolRow(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={addSpoolRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Another Spool
            </Button>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsSpoolDialogOpen(false); resetSpoolsForm(); }}>Cancel</Button>
              <Button type="submit">Add {spoolsToAdd.length} Spool{spoolsToAdd.length > 1 ? 's' : ''}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

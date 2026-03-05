'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { POPULAR_BRANDS } from '../constants'
import type { Filament, FilamentSpool, FilamentType, FilamentColor } from '@/model/filament'

export interface FilamentFormData {
  brand: string
  technology: 'FDM' | 'SLA' | 'SLS'
  typeId: string
  colorId: string
  costPerKg: string
  baseLandedCostPerUnit: string
  supplier: string
  notes: string
}

export interface SpoolRow {
  weight: string
  capacity: string
  landedCostTotal: string
  remainingPercent: string
}

const initialFilamentForm: FilamentFormData = {
  brand: '',
  technology: 'FDM',
  typeId: '',
  colorId: '',
  costPerKg: '',
  baseLandedCostPerUnit: '',
  supplier: '',
  notes: '',
}

const initialSpools: SpoolRow[] = [
  { weight: '1000', capacity: '1000', landedCostTotal: '', remainingPercent: '100' },
]

export function useFilament() {
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
  const [filamentForm, setFilamentForm] = useState<FilamentFormData>(initialFilamentForm)
  const [spoolsToAdd, setSpoolsToAdd] = useState<SpoolRow[]>(initialSpools)

  const hasAppliedUrlSync = useRef(false)

  useEffect(() => {
    setSearchTerm(searchParams.get('search') ?? '')
    setFilterType(searchParams.get('type') ?? '')
    setLowStockOnly(searchParams.get('lowStock') === 'true')
  }, [searchParams])

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

  const brandSuggestions = useMemo(() => {
    if (!brandSearch) return POPULAR_BRANDS.slice(0, 8)
    const search = brandSearch.toLowerCase()
    return POPULAR_BRANDS.filter((brand) =>
      brand.toLowerCase().includes(search)
    ).slice(0, 8)
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
      setFilteredColors(colors.filter((c) => c.typeId === filamentForm.typeId))
    } else {
      setFilteredColors([])
    }
  }, [filamentForm.typeId, colors])

  const resetFilamentForm = useCallback(() => {
    setFilamentForm(initialFilamentForm)
    setBrandSearch('')
  }, [])

  const resetSpoolsForm = useCallback(() => {
    setSpoolsToAdd(initialSpools)
    setSelectedFilament(null)
  }, [])

  const handleCreateFilament = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        const response = await fetch('/api/filament/filaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: filamentForm.brand,
            technology: filamentForm.technology,
            typeId: filamentForm.typeId,
            colorId: filamentForm.colorId,
            costPerKg: filamentForm.costPerKg ? parseFloat(filamentForm.costPerKg) : undefined,
            baseLandedCostPerUnit: filamentForm.baseLandedCostPerUnit
              ? parseFloat(filamentForm.baseLandedCostPerUnit)
              : undefined,
            defaultUnit: filamentForm.technology === 'SLA' ? 'MILLILITER' : 'GRAM',
            supplier: filamentForm.supplier || undefined,
            notes: filamentForm.notes || undefined,
          }),
        })

        if (response.ok) {
          const newFilament = await response.json()
          setFilaments((prev) => [newFilament, ...prev])
          setIsFilamentDialogOpen(false)
          resetFilamentForm()
          setSelectedFilament(newFilament)
          setIsSpoolDialogOpen(true)
        } else if (response.status === 409) {
          const data = await response.json()
          alert('This filament already exists. Please add spools to the existing one.')
          setExpandedFilaments((prev) => new Set(Array.from(prev).concat(data.existingId)))
        }
      } catch (error) {
        console.error('Error creating filament:', error)
      }
    },
    [filamentForm, resetFilamentForm]
  )

  const handleAddSpools = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedFilament) return
      try {
        const spools = spoolsToAdd.map((s) => ({
          weight: parseFloat(s.weight),
          capacity: parseFloat(s.capacity || s.weight),
          landedCostTotal: s.landedCostTotal ? parseFloat(s.landedCostTotal) : undefined,
          remainingPercent: parseInt(s.remainingPercent),
        }))
        const response = await fetch(
          `/api/filament/filaments/${selectedFilament.id}/spools`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spools }),
          }
        )
        if (response.ok) {
          const filamentsRes = await fetch('/api/filament/filaments')
          if (filamentsRes.ok) setFilaments(await filamentsRes.json())
          setIsSpoolDialogOpen(false)
          resetSpoolsForm()
          setExpandedFilaments((prev) =>
            new Set(Array.from(prev).concat(selectedFilament.id))
          )
        }
      } catch (error) {
        console.error('Error adding spools:', error)
      }
    },
    [selectedFilament, spoolsToAdd, resetSpoolsForm]
  )

  const handleDeleteSpool = useCallback(async (spoolId: string) => {
    try {
      const response = await fetch(`/api/filament/spools/${spoolId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        const filamentsRes = await fetch('/api/filament/filaments')
        if (filamentsRes.ok) setFilaments(await filamentsRes.json())
      }
    } catch (error) {
      console.error('Error deleting spool:', error)
    }
  }, [])

  const handleDeleteFilament = useCallback(async (filamentId: string) => {
    try {
      const response = await fetch(`/api/filament/filaments/${filamentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setFilaments((prev) => prev.filter((f) => f.id !== filamentId))
      }
    } catch (error) {
      console.error('Error deleting filament:', error)
    }
  }, [])

  const handleBrandSelect = useCallback(
    (brand: string) => {
      setFilamentForm((prev) => ({ ...prev, brand }))
      setBrandSearch(brand)
      setShowBrandSuggestions(false)
    },
    []
  )

  const addSpoolRow = useCallback(() => {
    setSpoolsToAdd((prev) => [
      ...prev,
      { weight: '1000', capacity: '1000', landedCostTotal: '', remainingPercent: '100' },
    ])
  }, [])

  const removeSpoolRow = useCallback((index: number) => {
    setSpoolsToAdd((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateSpoolRow = useCallback(
    (
      index: number,
      field: 'weight' | 'capacity' | 'remainingPercent' | 'landedCostTotal',
      value: string
    ) => {
      setSpoolsToAdd((prev) => {
        const updated = [...prev]
        const row = { ...updated[index], [field]: value }
        if (field === 'weight' && (!row.capacity || row.capacity === updated[index].weight)) {
          row.capacity = value
        }
        updated[index] = row
        return updated
      })
    },
    []
  )

  const toggleExpanded = useCallback((filamentId: string) => {
    setExpandedFilaments((prev) => {
      const next = new Set(prev)
      if (next.has(filamentId)) next.delete(filamentId)
      else next.add(filamentId)
      return next
    })
  }, [])

  const filteredFilaments = filaments.filter((filament) => {
    const matchesSearch =
      !searchTerm ||
      filament.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filament.type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filament.color.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || filament.type.id === filterType
    const isLowStock =
      (filament.spools ?? []).some((s) => s.remainingPercent < 20) ||
      (filament._count?.spools ?? 0) === 0
    const matchesLowStock = !lowStockOnly || isLowStock
    return matchesSearch && matchesType && matchesLowStock
  })

  const totalSpools = filaments.reduce(
    (sum, f) => sum + (f._count?.spools ?? 0),
    0
  )
  const totalRemainingWeight = filaments.reduce(
    (sum, f) => sum + (f.totalRemainingWeight ?? 0),
    0
  )
  const lowStockFilaments = filaments.filter(
    (f) =>
      (f.spools ?? []).some((s) => s.remainingPercent < 20) ||
      (f._count?.spools ?? 0) === 0
  ).length

  return {
    filaments,
    types,
    colors: filteredColors,
    isLoading,
    isFilamentDialogOpen,
    setIsFilamentDialogOpen,
    isSpoolDialogOpen,
    setIsSpoolDialogOpen,
    selectedFilament,
    setSelectedFilament,
    expandedFilaments,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    lowStockOnly,
    setLowStockOnly,
    brandSearch,
    setBrandSearch,
    showBrandSuggestions,
    setShowBrandSuggestions,
    filamentForm,
    setFilamentForm,
    spoolsToAdd,
    brandSuggestions,
    filteredFilaments,
    totalSpools,
    totalRemainingWeight,
    lowStockFilaments,
    resetFilamentForm,
    resetSpoolsForm,
    handleCreateFilament,
    handleAddSpools,
    handleDeleteSpool,
    handleDeleteFilament,
    handleBrandSelect,
    addSpoolRow,
    removeSpoolRow,
    updateSpoolRow,
    toggleExpanded,
  }
}

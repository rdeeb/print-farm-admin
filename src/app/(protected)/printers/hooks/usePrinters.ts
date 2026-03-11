'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { PrinterData, PrinterModel } from '@/model/printer'

export interface PrinterFormData {
  name: string
  technology: 'FDM' | 'SLA' | 'SLS'
  model: string
  brand: string
  nozzleSize: string
  buildVolumeX: string
  buildVolumeY: string
  buildVolumeZ: string
  powerConsumption: string
  cost: string
}

export interface EditFormData {
  name: string
  powerConsumption: string
  cost: string
  maintenanceIntervalDays: string
}

const initialFormData: PrinterFormData = {
  name: '',
  technology: 'FDM',
  model: '',
  brand: '',
  nozzleSize: '0.4',
  buildVolumeX: '220',
  buildVolumeY: '220',
  buildVolumeZ: '250',
  powerConsumption: '',
  cost: '',
}

const initialEditForm: EditFormData = {
  name: '',
  powerConsumption: '',
  cost: '',
  maintenanceIntervalDays: '',
}

export function usePrinters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [printers, setPrinters] = useState<PrinterData[]>([])
  const [printerModels, setPrinterModels] = useState<PrinterModel[]>([])
  const [printerModelsByBrand, setPrinterModelsByBrand] = useState<
    Record<string, PrinterModel[]>
  >({})
  const [brands, setBrands] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [formData, setFormData] = useState<PrinterFormData>(initialFormData)
  const [editingPrinter, setEditingPrinter] = useState<PrinterData | null>(null)
  const [editForm, setEditForm] = useState<EditFormData>(initialEditForm)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const hasAppliedUrlSync = useRef(false)

  useEffect(() => {
    setFilterStatus(searchParams.get('status') ?? '')
  }, [searchParams])

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [printersRes, modelsRes] = await Promise.all([
          fetch('/api/printers'),
          fetch(`/api/printer-models?technology=${formData.technology}`),
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
  }, [formData.technology])

  const handlePresetSelect = useCallback(
    (presetId: string) => {
      setSelectedPreset(presetId)
      if (presetId === 'custom') {
        setFormData((current) => ({
          ...initialFormData,
          technology: current.technology,
        }))
        return
      }
      const preset = printerModels.find((m) => m.id === presetId)
      if (preset) {
        setFormData({
          name: '',
          model: preset.model,
          technology: preset.technology,
          brand: preset.brand,
          nozzleSize: preset.defaultNozzle.toString(),
          buildVolumeX: preset.buildVolumeX.toString(),
          buildVolumeY: preset.buildVolumeY.toString(),
          buildVolumeZ: preset.buildVolumeZ.toString(),
          powerConsumption: preset.avgPowerConsumption?.toString() || '',
          cost: '',
        })
      }
    },
    [printerModels]
  )

  const handleTechnologySelect = useCallback(
    (technology: 'FDM' | 'SLA' | 'SLS') => {
      setSelectedPreset('')
      setFormData({
        ...initialFormData,
        technology,
      })
    },
    []
  )

  const resetForm = useCallback(() => {
    setSelectedPreset('')
    setFormData(initialFormData)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        const response = await fetch('/api/printers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            model: formData.model,
            technology: formData.technology,
            brand: formData.brand || null,
            nozzleSize:
              formData.technology === 'FDM'
                ? parseFloat(formData.nozzleSize)
                : null,
            buildVolume: {
              x: parseInt(formData.buildVolumeX),
              y: parseInt(formData.buildVolumeY),
              z: parseInt(formData.buildVolumeZ),
            },
            powerConsumption: formData.powerConsumption
              ? parseFloat(formData.powerConsumption)
              : null,
            cost: formData.cost ? parseFloat(formData.cost) : null,
          }),
        })
        if (response.ok) {
          const newPrinter = await response.json()
          setPrinters((prev) => [newPrinter, ...prev])
          setIsDialogOpen(false)
          resetForm()
        }
      } catch (error) {
        console.error('Error creating printer:', error)
      }
    },
    [formData, resetForm]
  )

  const openEditPrinter = useCallback((printer: PrinterData) => {
    setEditingPrinter(printer)
    setEditForm({
      name: printer.name,
      powerConsumption: printer.powerConsumption?.toString() ?? '',
      cost: printer.cost?.toString() ?? '',
      maintenanceIntervalDays: printer.maintenanceIntervalDays?.toString() ?? '',
    })
  }, [])

  const handleSaveEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editingPrinter) return
      setIsSavingEdit(true)
      try {
        const response = await fetch(`/api/printers/${editingPrinter.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editForm.name,
            powerConsumption: editForm.powerConsumption
              ? parseFloat(editForm.powerConsumption)
              : null,
            cost: editForm.cost ? parseFloat(editForm.cost) : null,
            maintenanceIntervalDays: editForm.maintenanceIntervalDays
              ? parseInt(editForm.maintenanceIntervalDays)
              : null,
          }),
        })
        if (response.ok) {
          const updated = await response.json()
          setPrinters((prev) =>
            prev.map((p) => (p.id === editingPrinter.id ? updated : p))
          )
          setEditingPrinter(null)
        }
      } catch (error) {
        console.error('Error updating printer:', error)
      } finally {
        setIsSavingEdit(false)
      }
    },
    [editingPrinter, editForm]
  )

  const filteredPrinters = printers.filter((printer) => {
    if (!filterStatus) return true
    return printer.status === filterStatus
  })

  return {
    printers,
    filteredPrinters,
    printerModels,
    printerModelsByBrand,
    brands,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    filterStatus,
    setFilterStatus,
    selectedPreset,
    formData,
    setFormData,
    editingPrinter,
    setEditingPrinter,
    editForm,
    setEditForm,
    isSavingEdit,
    handleTechnologySelect,
    handlePresetSelect,
    resetForm,
    handleSubmit,
    openEditPrinter,
    handleSaveEdit,
  }
}

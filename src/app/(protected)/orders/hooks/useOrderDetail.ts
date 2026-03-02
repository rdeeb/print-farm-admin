'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { Order, OrderPart, OrderFilament } from '@/model/order'
import type { Printer } from '@/model/printer'

export interface SelectedOption {
  filament: OrderFilament
  printableCount: number
  canCover: boolean
}

export function useOrderDetail(orderId: string) {
  const { data: session } = useSession()
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [filaments, setFilaments] = useState<OrderFilament[]>([])
  const [printers, setPrinters] = useState<Printer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingDueDate, setIsEditingDueDate] = useState(false)
  const [dueDateForm, setDueDateForm] = useState('')
  const [selectionOpen, setSelectionOpen] = useState(false)
  const [selectedOrderPart, setSelectedOrderPart] = useState<OrderPart | null>(null)
  const [selectedFilamentId, setSelectedFilamentId] = useState('')
  const [selectedPrinterId, setSelectedPrinterId] = useState('')
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null)
  const [quantityForm, setQuantityForm] = useState('')

  const canEdit = session?.user?.role !== 'VIEWER'

  const fetchData = useCallback(async () => {
    try {
      const [orderRes, filamentsRes, printersRes] = await Promise.all([
        fetch(`/api/orders/${orderId}`),
        fetch('/api/filament/filaments'),
        fetch('/api/printers?includeQueueCount=true'),
      ])

      if (orderRes.ok) {
        setOrder(await orderRes.json())
      } else {
        router.push('/orders')
      }

      if (filamentsRes.ok) {
        setFilaments(await filamentsRes.json())
      }

      if (printersRes.ok) {
        setPrinters(await printersRes.json())
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setIsLoading(false)
    }
  }, [orderId, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!order) return
    setDueDateForm(order.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : '')
  }, [order])

  const selectedOptions = useMemo((): SelectedOption[] => {
    if (!selectedOrderPart?.part.filamentColor) return []

    const filamentColor = selectedOrderPart.part.filamentColor
    return filaments
      .filter(
        (filament) =>
          filament.type.id === filamentColor.type.id && filament.color.id === filamentColor.id
      )
      .map((filament) => ({
        filament,
        printableCount: Math.floor(
          (filament.totalRemainingWeight ?? 0) / selectedOrderPart.part.filamentWeight
        ),
      }))
      .filter((option) => option.printableCount > 0)
      .map((option) => ({
        ...option,
        canCover: option.printableCount >= selectedOrderPart.quantity,
      }))
      .sort((a, b) => b.printableCount - a.printableCount)
  }, [filaments, selectedOrderPart])

  const availablePrinters = useMemo(() => {
    return printers.filter((p) => p.isActive && p.status === 'IDLE')
  }, [printers])

  const activePrinters = useMemo(() => {
    return printers.filter(
      (p) =>
        p.isActive &&
        p.status !== 'OFFLINE' &&
        p.status !== 'ERROR' &&
        p.status !== 'MAINTENANCE'
    )
  }, [printers])

  const getDefaultPrinter = useCallback(
    (orderPart: OrderPart): string => {
      if (!order) return ''

      const otherPartWithPrinter = (order.orderParts ?? []).find(
        (op) =>
          op.id !== orderPart.id &&
          (op.status === 'PRINTING' || op.status === 'QUEUED') &&
          op.printerId
      )
      if (otherPartWithPrinter?.printerId) {
        const printer = activePrinters.find((p) => p.id === otherPartWithPrinter.printerId)
        if (printer) return printer.id
      }

      if (availablePrinters.length > 0) {
        return availablePrinters[0].id
      }

      const printersWithQueue = activePrinters
        .map((p) => ({ ...p, queueCount: p.queueCount ?? 0 }))
        .sort((a, b) => a.queueCount - b.queueCount)

      return printersWithQueue[0]?.id ?? ''
    },
    [order, activePrinters, availablePrinters]
  )

  const getDefaultFilament = useCallback(
    (orderPart: OrderPart): string => {
      if (!orderPart.part.filamentColor) return ''

      const options = filaments
        .filter(
          (filament) =>
            filament.type.id === orderPart.part.filamentColor!.type.id &&
            filament.color.id === orderPart.part.filamentColor!.id
        )
        .map((filament) => ({
          filament,
          printableCount: Math.floor(
            filament.totalRemainingWeight / orderPart.part.filamentWeight
          ),
        }))
        .filter((option) => option.printableCount >= orderPart.quantity)
        .sort((a, b) => b.printableCount - a.printableCount)

      return options[0]?.filament.id ?? ''
    },
    [filaments]
  )

  const isSelectedPrinterAvailable = useMemo(() => {
    const printer = printers.find((p) => p.id === selectedPrinterId)
    return printer?.status === 'IDLE'
  }, [printers, selectedPrinterId])

  const handleStartPrinting = useCallback(
    (orderPart: OrderPart) => {
      setSelectedOrderPart(orderPart)
      setSelectedFilamentId(getDefaultFilament(orderPart))
      setSelectedPrinterId(getDefaultPrinter(orderPart))
      setSelectionOpen(true)
    },
    [getDefaultFilament, getDefaultPrinter]
  )

  const handleEditQuantity = useCallback((orderPart: OrderPart) => {
    setEditingQuantityId(orderPart.id)
    setQuantityForm(String(orderPart.quantity))
  }, [])

  const handleCancelQuantity = useCallback(() => {
    setEditingQuantityId(null)
    setQuantityForm('')
  }, [])

  const handleSaveQuantity = useCallback(
    async (orderPart: OrderPart) => {
      if (!order) return
      const nextQuantity = Number(quantityForm)
      if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
        alert('Quantity must be a whole number greater than 0.')
        return
      }

      setIsSaving(true)
      try {
        const response = await fetch(`/api/orders/${order.id}/parts/${orderPart.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: nextQuantity }),
        })

        if (response.ok) {
          await fetchData()
          setEditingQuantityId(null)
          setQuantityForm('')
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to update quantity')
        }
      } catch (error) {
        console.error('Error updating quantity:', error)
      } finally {
        setIsSaving(false)
      }
    },
    [order, quantityForm, fetchData]
  )

  const confirmStartPrinting = useCallback(async () => {
    if (!order || !selectedOrderPart || !selectedFilamentId || !selectedPrinterId) return
    setIsSaving(true)
    try {
      const newStatus = isSelectedPrinterAvailable ? 'PRINTING' : 'QUEUED'

      const response = await fetch(`/api/orders/${order.id}/parts/${selectedOrderPart.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          filamentId: selectedFilamentId,
          printerId: selectedPrinterId,
        }),
      })

      if (response.ok) {
        await fetchData()
        setSelectionOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start printing')
      }
    } catch (error) {
      console.error('Error updating order part:', error)
    } finally {
      setIsSaving(false)
    }
  }, [
    order,
    selectedOrderPart,
    selectedFilamentId,
    selectedPrinterId,
    isSelectedPrinterAvailable,
    fetchData,
  ])

  const markPrinted = useCallback(
    async (orderPart: OrderPart) => {
      if (!order) return
      setIsSaving(true)
      try {
        const response = await fetch(`/api/orders/${order.id}/parts/${orderPart.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PRINTED' }),
        })

        if (response.ok) {
          await fetchData()
        }
      } catch (error) {
        console.error('Error updating order part:', error)
      } finally {
        setIsSaving(false)
      }
    },
    [order, fetchData]
  )

  const markAssembled = useCallback(async () => {
    if (!order) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ASSEMBLED' }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    } finally {
      setIsSaving(false)
    }
  }, [order, fetchData])

  const markDelivered = useCallback(async () => {
    if (!order) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    } finally {
      setIsSaving(false)
    }
  }, [order, fetchData])

  const handleSaveDueDate = useCallback(async () => {
    if (!order) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: dueDateForm || null,
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        setOrder((prev) => (prev ? { ...prev, dueDate: updated.dueDate } : prev))
        setIsEditingDueDate(false)
      }
    } catch (error) {
      console.error('Error updating due date:', error)
    } finally {
      setIsSaving(false)
    }
  }, [order, dueDateForm])

  const handleCancelDueDateEdit = useCallback(() => {
    setIsEditingDueDate(false)
    setDueDateForm(order?.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : '')
  }, [order?.dueDate])

  return {
    order,
    filaments,
    printers,
    isLoading,
    isSaving,
    canEdit,
    isEditingDueDate,
    dueDateForm,
    selectionOpen,
    selectedOrderPart,
    selectedFilamentId,
    selectedPrinterId,
    editingQuantityId,
    quantityForm,
    selectedOptions,
    availablePrinters,
    activePrinters,
    isSelectedPrinterAvailable,
    setSelectionOpen,
    setIsEditingDueDate,
    setDueDateForm,
    setQuantityForm,
    setSelectedFilamentId,
    setSelectedPrinterId,
    fetchData,
    handleStartPrinting,
    handleEditQuantity,
    handleCancelQuantity,
    handleSaveQuantity,
    confirmStartPrinting,
    markPrinted,
    markAssembled,
    markDelivered,
    handleSaveDueDate,
    handleCancelDueDateEdit,
  }
}

'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle, Clock, Package, Truck, Pencil, Save, Printer as PrinterIcon } from 'lucide-react'
import { formatDateUTC } from '@/lib/utils'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'

interface Filament {
  id: string
  brand: string
  totalRemainingWeight: number
  type: { id: string; name: string; code: string }
  color: { id: string; name: string; hex: string }
}

interface Printer {
  id: string
  name: string
  model: string
  brand: string | null
  status: 'IDLE' | 'PRINTING' | 'PAUSED' | 'ERROR' | 'MAINTENANCE' | 'OFFLINE'
  isActive: boolean
  queueCount?: number
}

interface OrderPart {
  id: string
  quantity: number
  status: 'WAITING' | 'QUEUED' | 'PRINTING' | 'PRINTED'
  filament: Filament | null
  printerId?: string | null
  part: {
    id: string
    name: string
    filamentWeight: number
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
  }
}

interface Order {
  id: string
  orderNumber: string
  quantity: number
  status: 'PENDING' | 'IN_PROGRESS' | 'WAITING' | 'ASSEMBLED' | 'DELIVERED' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
  dueDate: string | null
  client: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  project: {
    id: string
    name: string
  }
  orderParts: OrderPart[]
  createdAt: string
}

const statusConfig = {
  PENDING: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
  IN_PROGRESS: { label: 'In Progress', variant: 'default' as const, icon: Clock },
  WAITING: { label: 'Ready for Assembly', variant: 'default' as const, icon: Package },
  ASSEMBLED: { label: 'Assembled', variant: 'default' as const, icon: CheckCircle },
  DELIVERED: { label: 'Delivered', variant: 'success' as const, icon: Truck },
  COMPLETED: { label: 'Delivered', variant: 'success' as const, icon: Truck },
  ON_HOLD: { label: 'On Hold', variant: 'warning' as const, icon: Clock },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' as const, icon: Package },
}

const partStatusConfig = {
  WAITING: { label: 'Waiting', variant: 'secondary' as const },
  QUEUED: { label: 'Queued', variant: 'warning' as const },
  PRINTING: { label: 'Printing', variant: 'default' as const },
  PRINTED: { label: 'Printed', variant: 'success' as const },
}

const fallbackOrderStatus = { label: 'Unknown', variant: 'secondary' as const, icon: Clock }
const fallbackPartStatus = { label: 'Unknown', variant: 'secondary' as const }

export default function OrderDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [filaments, setFilaments] = useState<Filament[]>([])
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

  const fetchData = async () => {
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
  }

  useEffect(() => {
    fetchData()
  }, [orderId])

  useEffect(() => {
    if (!order) return
    setDueDateForm(order.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : '')
  }, [order])

  const selectedOptions = useMemo(() => {
    if (!selectedOrderPart?.part.filamentColor) return []

    const filamentColor = selectedOrderPart.part.filamentColor
    return filaments
      .filter(filament => (
        filament.type.id === filamentColor.type.id &&
        filament.color.id === filamentColor.id
      ))
      .map(filament => ({
        filament,
        printableCount: Math.floor(filament.totalRemainingWeight / selectedOrderPart.part.filamentWeight),
      }))
      .filter(option => option.printableCount > 0)
      .map(option => ({
        ...option,
        canCover: option.printableCount >= selectedOrderPart.quantity,
      }))
      .sort((a, b) => b.printableCount - a.printableCount)
  }, [filaments, selectedOrderPart])

  // Get available (IDLE) printers
  const availablePrinters = useMemo(() => {
    return printers.filter(p => p.isActive && p.status === 'IDLE')
  }, [printers])

  // Get all active printers (for queueing)
  const activePrinters = useMemo(() => {
    return printers.filter(p => p.isActive && p.status !== 'OFFLINE' && p.status !== 'ERROR' && p.status !== 'MAINTENANCE')
  }, [printers])

  // Get the default printer based on smart selection logic
  const getDefaultPrinter = useCallback((orderPart: OrderPart): string => {
    if (!order) return ''

    // Check if any other part in this order has a printer assigned (printing or queued)
    const otherPartWithPrinter = order.orderParts.find(
      op => op.id !== orderPart.id && (op.status === 'PRINTING' || op.status === 'QUEUED') && op.printerId
    )
    if (otherPartWithPrinter?.printerId) {
      // Use the same printer as other parts in this order
      const printer = activePrinters.find(p => p.id === otherPartWithPrinter.printerId)
      if (printer) return printer.id
    }

    // If there are available (IDLE) printers, use the first one
    if (availablePrinters.length > 0) {
      return availablePrinters[0].id
    }

    // No available printers - find printer with smallest queue
    const printersWithQueue = activePrinters
      .map(p => ({ ...p, queueCount: p.queueCount ?? 0 }))
      .sort((a, b) => a.queueCount - b.queueCount)

    return printersWithQueue[0]?.id ?? ''
  }, [order, activePrinters, availablePrinters])

  // Get the default filament (first one that can cover the quantity)
  const getDefaultFilament = useCallback((orderPart: OrderPart): string => {
    if (!orderPart.part.filamentColor) return ''

    const options = filaments
      .filter(filament => (
        filament.type.id === orderPart.part.filamentColor!.type.id &&
        filament.color.id === orderPart.part.filamentColor!.id
      ))
      .map(filament => ({
        filament,
        printableCount: Math.floor(filament.totalRemainingWeight / orderPart.part.filamentWeight),
      }))
      .filter(option => option.printableCount >= orderPart.quantity)
      .sort((a, b) => b.printableCount - a.printableCount)

    return options[0]?.filament.id ?? ''
  }, [filaments])

  const handleStartPrinting = (orderPart: OrderPart) => {
    setSelectedOrderPart(orderPart)
    setSelectedFilamentId(getDefaultFilament(orderPart))
    setSelectedPrinterId(getDefaultPrinter(orderPart))
    setSelectionOpen(true)
  }

  const handleEditQuantity = (orderPart: OrderPart) => {
    setEditingQuantityId(orderPart.id)
    setQuantityForm(String(orderPart.quantity))
  }

  const handleCancelQuantity = () => {
    setEditingQuantityId(null)
    setQuantityForm('')
  }

  const handleSaveQuantity = async (orderPart: OrderPart) => {
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
  }

  // Check if selected printer is available (IDLE)
  const isSelectedPrinterAvailable = useMemo(() => {
    const printer = printers.find(p => p.id === selectedPrinterId)
    return printer?.status === 'IDLE'
  }, [printers, selectedPrinterId])

  const confirmStartPrinting = async () => {
    if (!order || !selectedOrderPart || !selectedFilamentId || !selectedPrinterId) return
    setIsSaving(true)
    try {
      // Determine status based on printer availability
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
  }

  const markPrinted = async (orderPart: OrderPart) => {
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
  }

  const markAssembled = async () => {
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
  }

  const markDelivered = async () => {
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
  }

  const handleSaveDueDate = async () => {
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
        setOrder(prev => (prev ? { ...prev, dueDate: updated.dueDate } : prev))
        setIsEditingDueDate(false)
      }
    } catch (error) {
      console.error('Error updating due date:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    )
  }

  const orderStatus = statusConfig[order.status] ?? fallbackOrderStatus
  const OrderStatusIcon = orderStatus.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={orderStatus.variant}>
                <OrderStatusIcon className="h-3 w-3 mr-1" />
                {orderStatus.label}
              </Badge>
              {order.dueDate && (
                <span className="text-sm text-gray-500">Due {formatDateUTC(order.dueDate)}</span>
              )}
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center space-x-2">
            {isEditingDueDate ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingDueDate(false)
                    setDueDateForm(order.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : '')
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveDueDate} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditingDueDate(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Due Date
              </Button>
            )}
            {order.status === 'WAITING' && (
              <Button onClick={markAssembled} disabled={isSaving}>
                Mark Assembled
              </Button>
            )}
            {order.status === 'ASSEMBLED' && (
              <Button onClick={markDelivered} disabled={isSaving}>
                Mark Delivered
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>Project and client info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Project:</span> {order.project.name}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Client:</span> {order.client.name}
          </p>
          {order.client.phone && (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Phone:</span> {order.client.phone}
            </p>
          )}
          {order.client.email && (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Email:</span> {order.client.email}
            </p>
          )}
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Due Date:</span>{' '}
            {isEditingDueDate ? (
              <div className="mt-2 max-w-xs">
                <Input
                  type="date"
                  value={dueDateForm}
                  onChange={(e) => setDueDateForm(e.target.value)}
                />
              </div>
            ) : (
              <span>{order.dueDate ? formatDateUTC(order.dueDate) : 'Not set'}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parts Progress</CardTitle>
          <CardDescription>Track each part status for this order</CardDescription>
        </CardHeader>
        <CardContent>
          {order.orderParts.length > 0 ? (
            <div className="space-y-4">
              {order.orderParts.map(orderPart => {
                const partStatus = partStatusConfig[orderPart.status] ?? fallbackPartStatus
                const requirement = orderPart.part.filamentColor
                const requiredWeight = orderPart.part.filamentWeight * orderPart.quantity
                const isEditingQuantity = editingQuantityId === orderPart.id

                return (
                  <div key={orderPart.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{orderPart.part.name}</h4>
                        <Badge variant={partStatus.variant}>{partStatus.label}</Badge>
                      </div>
                      {isEditingQuantity ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={quantityForm}
                            onChange={(e) => setQuantityForm(e.target.value)}
                            className="w-24"
                          />
                          <span>parts • {orderPart.part.filamentWeight}g each</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {orderPart.quantity} parts • {orderPart.part.filamentWeight}g each
                        </p>
                      )}
                      {requirement ? (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-3 h-3 rounded border" style={{ backgroundColor: requirement.hex }} />
                          <span className="text-xs text-gray-500">
                            {requirement.type.name} - {requirement.name}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{requiredWeight}g required</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2">No filament requirement set</p>
                      )}
                      {orderPart.filament && (
                        <p className="text-xs text-gray-500 mt-1">
                          Using {orderPart.filament.brand} {orderPart.filament.type.code} - {orderPart.filament.color.name}
                        </p>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex items-center space-x-2">
                        {isEditingQuantity ? (
                          <>
                            <Button variant="outline" onClick={handleCancelQuantity} disabled={isSaving}>
                              Cancel
                            </Button>
                            <Button onClick={() => handleSaveQuantity(orderPart)} disabled={isSaving}>
                              <Save className="h-4 w-4 mr-2" />
                              {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                          </>
                        ) : (
                          <>
                            {orderPart.status === 'WAITING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditQuantity(orderPart)}
                                disabled={isSaving}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Qty
                              </Button>
                            )}
                            {orderPart.status === 'WAITING' && (
                              <Button
                                variant="outline"
                                onClick={() => handleStartPrinting(orderPart)}
                                disabled={!requirement || activePrinters.length === 0}
                              >
                                <PrinterIcon className="h-4 w-4 mr-2" />
                                Print
                              </Button>
                            )}
                            {orderPart.status === 'QUEUED' && (
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                In queue
                              </span>
                            )}
                            {orderPart.status === 'PRINTING' && (
                              <Button onClick={() => markPrinted(orderPart)} disabled={isSaving}>
                                Mark Printed
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No parts found for this order</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectionOpen} onOpenChange={setSelectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isSelectedPrinterAvailable ? 'Start Printing' : 'Queue Print Job'}
            </DialogTitle>
            <DialogDescription>
              {isSelectedPrinterAvailable
                ? 'Select a printer and filament to start this print job'
                : 'Select a printer and filament to queue this print job'}
            </DialogDescription>
          </DialogHeader>
          {selectedOrderPart?.part.filamentColor ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{selectedOrderPart.part.name}</span>
                <span className="text-gray-400 mx-2">•</span>
                {selectedOrderPart.quantity} parts
                <span className="text-gray-400 mx-2">•</span>
                {selectedOrderPart.part.filamentWeight * selectedOrderPart.quantity}g total
              </div>

              {/* Printer Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <PrinterIcon className="h-4 w-4" />
                  Printer *
                </Label>
                <Select value={selectedPrinterId} onValueChange={setSelectedPrinterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a printer" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePrinters.length > 0 ? (
                      activePrinters.map(printer => {
                        const isIdle = printer.status === 'IDLE'
                        return (
                          <SelectItem key={printer.id} value={printer.id}>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isIdle ? 'bg-green-500' : 'bg-amber-500'}`} />
                              {printer.name}
                              <span className="text-muted-foreground">
                                {isIdle ? '(Available)' : `(${printer.queueCount ?? 0} in queue)`}
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })
                    ) : (
                      <SelectItem value="none" disabled>
                        No printers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedPrinterId && !isSelectedPrinterAvailable && (
                  <p className="text-xs text-amber-600">
                    This printer is busy. The job will be added to its queue.
                  </p>
                )}
              </div>

              {/* Filament Selection */}
              <div className="space-y-2">
                <Label>Filament *</Label>
                <Select value={selectedFilamentId} onValueChange={setSelectedFilamentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select filament" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedOptions.length > 0 ? (
                      selectedOptions.map(option => (
                        <SelectItem
                          key={option.filament.id}
                          value={option.filament.id}
                          disabled={!option.canCover}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: option.filament.color.hex }}
                            />
                            {option.filament.brand} {option.filament.type.code} - {option.filament.color.name}
                            <span className="text-muted-foreground">
                              ({option.printableCount} parts available)
                            </span>
                            {!option.canCover && <span className="text-red-500">(insufficient)</span>}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No matching filament in stock
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setSelectionOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmStartPrinting}
                  disabled={!selectedFilamentId || !selectedPrinterId || isSaving}
                >
                  {isSaving
                    ? (isSelectedPrinterAvailable ? 'Starting...' : 'Queueing...')
                    : (isSelectedPrinterAvailable ? 'Start Printing' : 'Add to Queue')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No filament requirement set for this part.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

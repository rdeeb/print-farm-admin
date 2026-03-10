'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Clock, Package, Pencil, Printer as PrinterIcon, Save } from 'lucide-react'
import { partStatusConfig, fallbackPartStatus } from '../../constants'
import type { Order, OrderPart } from '@/model/order'
import type { Printer } from '@/model/printer'

interface OrderPartsCardProps {
  order: Order
  canEdit: boolean
  activePrinters: Printer[]
  editingQuantityId: string | null
  quantityForm: string
  isSaving: boolean
  onEditQuantity: (orderPart: OrderPart) => void
  onCancelQuantity: () => void
  onSaveQuantity: (orderPart: OrderPart) => void
  onStartPrinting: (orderPart: OrderPart) => void
  onMarkPrinted: (orderPart: OrderPart) => void
  onQuantityFormChange: (value: string) => void
}

export function OrderPartsCard({
  order,
  canEdit,
  activePrinters,
  editingQuantityId,
  quantityForm,
  isSaving,
  onEditQuantity,
  onCancelQuantity,
  onSaveQuantity,
  onStartPrinting,
  onMarkPrinted,
  onQuantityFormChange,
}: OrderPartsCardProps) {
  const orderParts = order.orderParts ?? []
  const isOrderFinalized = ['CANCELLED', 'DELIVERED', 'COMPLETED'].includes(order.status)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parts Progress</CardTitle>
        <CardDescription>Track each part status for this order</CardDescription>
      </CardHeader>
      <CardContent>
        {orderParts.length > 0 ? (
          <div className="space-y-4">
            {orderParts.map((orderPart) => {
              const partStatus = partStatusConfig[orderPart.status] ?? fallbackPartStatus
              const requirement = orderPart.part.filamentColor
              const requiredWeight = orderPart.part.filamentWeight * orderPart.quantity
              const isEditingQuantity = editingQuantityId === orderPart.id

              return (
                <div
                  key={orderPart.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
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
                          onChange={(e) => onQuantityFormChange(e.target.value)}
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
                        <div
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: requirement.hex }}
                        />
                        <span className="text-xs text-gray-500">
                          {requirement.type.name} - {requirement.name}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{requiredWeight}g required</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">No material requirement set</p>
                    )}
                    {orderPart.filament && (
                      <p className="text-xs text-gray-500 mt-1">
                        Using {orderPart.filament.brand} {orderPart.filament.type.code} -{' '}
                        {orderPart.filament.color.name}
                      </p>
                    )}
                  </div>

                  {canEdit && !isOrderFinalized && (
                    <div className="flex items-center space-x-2">
                      {isEditingQuantity ? (
                        <>
                          <Button variant="outline" onClick={onCancelQuantity} disabled={isSaving}>
                            Cancel
                          </Button>
                          <Button onClick={() => onSaveQuantity(orderPart)} disabled={isSaving}>
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
                              onClick={() => onEditQuantity(orderPart)}
                              disabled={isSaving}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Qty
                            </Button>
                          )}
                          {orderPart.status === 'WAITING' && (
                            <Button
                              variant="outline"
                              onClick={() => onStartPrinting(orderPart)}
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
                            <Button onClick={() => onMarkPrinted(orderPart)} disabled={isSaving}>
                              Mark Printed
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {orderPart.status === 'QUEUED' && isOrderFinalized && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      In queue
                    </span>
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
  )
}

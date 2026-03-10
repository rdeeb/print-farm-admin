'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil, Save, XCircle } from 'lucide-react'
import { formatDateUTC } from '@/lib/utils'
import type { Order } from '@/model/order'
import type { LucideIcon } from 'lucide-react'

interface OrderDetailHeaderProps {
  order: Order
  orderStatus: { label: string; variant: 'secondary' | 'default' | 'success' | 'warning' | 'destructive' | 'outline'; icon: LucideIcon }
  canEdit: boolean
  isEditingDueDate: boolean
  isSaving: boolean
  onEditDueDate: () => void
  onSaveDueDate: () => void
  onCancelDueDateEdit: () => void
  onMarkAssembled: () => void
  onMarkDelivered: () => void
  onCancelOrder: () => void
}

export function OrderDetailHeader({
  order,
  orderStatus,
  canEdit,
  isEditingDueDate,
  isSaving,
  onEditDueDate,
  onSaveDueDate,
  onCancelDueDateEdit,
  onMarkAssembled,
  onMarkDelivered,
  onCancelOrder,
}: OrderDetailHeaderProps) {
  const OrderStatusIcon = orderStatus.icon
  const isOrderFinalized = ['CANCELLED', 'DELIVERED', 'COMPLETED'].includes(order.status)

  return (
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
          {!isOrderFinalized && (
            <>
              {isEditingDueDate ? (
                <>
                  <Button variant="outline" onClick={onCancelDueDateEdit}>
                    Cancel
                  </Button>
                  <Button onClick={onSaveDueDate} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={onEditDueDate}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Due Date
                </Button>
              )}
            </>
          )}
          {!['CANCELLED', 'DELIVERED', 'COMPLETED'].includes(order.status) && (
            <Button variant="destructive" onClick={onCancelOrder} disabled={isSaving}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          )}
          {order.status === 'WAITING' && (
            <Button onClick={onMarkAssembled} disabled={isSaving}>
              Mark Assembled
            </Button>
          )}
          {order.status === 'ASSEMBLED' && (
            <Button onClick={onMarkDelivered} disabled={isSaving}>
              Mark Delivered
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

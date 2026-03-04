'use client'

import { Badge } from '@/components/ui/badge'
import { OrderBoardCard } from './OrderBoardCard'
import { boardColumns } from '../../constants'
import type { Order } from '@/model/order'

interface OrdersBoardViewProps {
  orders: Order[]
}

export function OrdersBoardView({ orders }: OrdersBoardViewProps) {
  return (
    <div className="grid grid-cols-5 gap-4 min-w-0">
      {boardColumns.map((column) => {
        const columnOrders = orders.filter((order) => order.status === column.status)

        return (
          <div
            key={column.status}
            className={`min-w-0 rounded-lg border-2 ${column.color}`}
          >
            <div className="p-3 border-b bg-white/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnOrders.length}
                </Badge>
              </div>
            </div>

            <div className="p-2 space-y-3 min-h-[200px] max-h-[calc(100vh-320px)] overflow-y-auto">
              {columnOrders.map((order) => (
                <OrderBoardCard key={order.id} order={order} />
              ))}

              {columnOrders.length === 0 && (
                <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                  No orders
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

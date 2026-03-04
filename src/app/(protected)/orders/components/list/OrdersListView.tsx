'use client'

import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { OrderListCard } from './OrderListCard'
import type { Order } from '@/model/order'

interface OrdersListViewProps {
  orders: Order[]
  totalOrderCount: number
}

export function OrdersListView({ orders, totalOrderCount }: OrdersListViewProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 text-center mb-4">
            {totalOrderCount === 0
              ? "You haven't created any orders yet."
              : 'No orders match your current filters.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderListCard key={order.id} order={order} />
      ))}
    </div>
  )
}

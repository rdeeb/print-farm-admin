'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateUTC } from '@/lib/utils'
import { priorityConfig } from '../../constants'
import type { Order } from '@/model/order'

interface OrderBoardCardProps {
  order: Order
}

export function OrderBoardCard({ order }: OrderBoardCardProps) {
  const priority = priorityConfig[order.priority ?? 'MEDIUM']
  const isOverdue = order.dueDate && new Date(order.dueDate) < new Date()
  const progressPercent =
    (order.partsTotal ?? 0) > 0
      ? ((order.partsPrinted ?? 0) / (order.partsTotal ?? 0)) * 100
      : 0

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white mx-1 my-1">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{order.orderNumber}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-medium ${priority.className}`}
              >
                {priority.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">{order.project.name}</p>
            <p className="text-xs text-gray-500 truncate">{order.client.name}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                {order.partsPrinted ?? 0}/{order.partsTotal ?? 0} parts
              </span>
              {order.dueDate && (
                <span
                  className={
                    isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                  }
                >
                  {formatDateUTC(order.dueDate)}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

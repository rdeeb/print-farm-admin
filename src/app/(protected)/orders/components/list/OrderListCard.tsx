'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import { formatDateUTC } from '@/lib/utils'
import { statusConfig, priorityConfig, fallbackOrderStatus } from '../../constants'
import type { Order } from '@/model/order'

interface OrderListCardProps {
  order: Order
}

export function OrderListCard({ order }: OrderListCardProps) {
  const status = statusConfig[order.status] ?? fallbackOrderStatus
  const priority = priorityConfig[order.priority ?? 'MEDIUM']
  const StatusIcon = status.icon

  return (
    <Card>
      <CardContent className="p-6">
        <Link href={`/orders/${order.id}`} className="block">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{order.orderNumber}</h3>
                  <Badge variant={status.variant}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${priority.className}`}
                  >
                    {priority.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {order.project.name} - {order.client.name}
                </p>
                {order.client.phone && (
                  <p className="text-xs text-gray-500">{order.client.phone}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">
                {order.partsPrinted ?? 0} / {order.partsTotal ?? 0} parts printed
              </p>
              {order.dueDate && (
                <p className="text-sm text-gray-500">
                  Due: {formatDateUTC(order.dueDate)}
                </p>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}

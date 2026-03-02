'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDateUTC } from '@/lib/utils'
import type { Order } from '@/model/order'

interface OrderInfoCardProps {
  order: Order
  isEditingDueDate: boolean
  dueDateForm: string
  onDueDateChange: (value: string) => void
}

export function OrderInfoCard({
  order,
  isEditingDueDate,
  dueDateForm,
  onDueDateChange,
}: OrderInfoCardProps) {
  return (
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
                onChange={(e) => onDueDateChange(e.target.value)}
              />
            </div>
          ) : (
            <span>{order.dueDate ? formatDateUTC(order.dueDate) : 'Not set'}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

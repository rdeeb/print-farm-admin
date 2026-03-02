import { CheckCircle, Clock, Package, Truck } from 'lucide-react'

export const statusConfig = {
  PENDING: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
  IN_PROGRESS: { label: 'In Progress', variant: 'default' as const, icon: Clock },
  WAITING: { label: 'Ready for Assembly', variant: 'default' as const, icon: Package },
  ASSEMBLED: { label: 'Assembled', variant: 'default' as const, icon: CheckCircle },
  DELIVERED: { label: 'Delivered', variant: 'success' as const, icon: Truck },
  COMPLETED: { label: 'Delivered', variant: 'success' as const, icon: Truck },
  ON_HOLD: { label: 'On Hold', variant: 'warning' as const, icon: Clock },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' as const, icon: Package },
} as const

export const partStatusConfig = {
  WAITING: { label: 'Waiting', variant: 'secondary' as const },
  QUEUED: { label: 'Queued', variant: 'warning' as const },
  PRINTING: { label: 'Printing', variant: 'default' as const },
  PRINTED: { label: 'Printed', variant: 'success' as const },
} as const

export const fallbackOrderStatus = { label: 'Unknown', variant: 'secondary' as const, icon: Clock }
export const fallbackPartStatus = { label: 'Unknown', variant: 'secondary' as const }

export const priorityConfig = {
  LOW: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
} as const

// Board columns configuration - defines the workflow stages shown in board view
export const boardColumns = [
  { status: 'PENDING' as const, label: 'Pending', color: 'bg-gray-100 border-gray-300' },
  { status: 'IN_PROGRESS' as const, label: 'In Progress', color: 'bg-blue-50 border-blue-300' },
  { status: 'WAITING' as const, label: 'Ready for Assembly', color: 'bg-orange-50 border-orange-300' },
  { status: 'ASSEMBLED' as const, label: 'Assembled', color: 'bg-purple-50 border-purple-300' },
  { status: 'DELIVERED' as const, label: 'Delivered', color: 'bg-green-50 border-green-300' },
] as const

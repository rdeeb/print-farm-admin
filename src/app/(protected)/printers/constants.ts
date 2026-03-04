import {
  Power,
  Play,
  Pause,
  AlertTriangle,
  Wrench,
} from 'lucide-react'

export const statusConfig = {
  IDLE: {
    label: 'Idle',
    variant: 'secondary' as const,
    icon: Power,
    color: 'text-green-500',
  },
  PRINTING: {
    label: 'Printing',
    variant: 'default' as const,
    icon: Play,
    color: 'text-blue-500',
  },
  PAUSED: {
    label: 'Paused',
    variant: 'warning' as const,
    icon: Pause,
    color: 'text-yellow-500',
  },
  ERROR: {
    label: 'Error',
    variant: 'destructive' as const,
    icon: AlertTriangle,
    color: 'text-red-500',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    variant: 'outline' as const,
    icon: Wrench,
    color: 'text-orange-500',
  },
  OFFLINE: {
    label: 'Offline',
    variant: 'secondary' as const,
    icon: Power,
    color: 'text-gray-500',
  },
}

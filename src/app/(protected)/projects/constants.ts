import type { HardwareUnit } from '@/model/hardware'

export const statusConfig = {
  DRAFT: { label: 'Draft', variant: 'secondary' as const },
  ACTIVE: { label: 'Active', variant: 'default' as const },
  COMPLETED: { label: 'Completed', variant: 'success' as const },
  ARCHIVED: { label: 'Archived', variant: 'outline' as const },
}

export const UNIT_LABELS: Record<HardwareUnit, string> = {
  ITEMS: 'items',
  ML: 'ml',
  GRAMS: 'grams',
  CM: 'cm',
  UNITS: 'units',
}

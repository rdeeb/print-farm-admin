import type { PrinterInfo } from './printer'

export type HardwareUnit = 'ITEMS' | 'ML' | 'GRAMS' | 'CM' | 'UNITS'

export interface Hardware {
  id: string
  name: string
  packPrice: number
  packQuantity: number
  packUnit: HardwareUnit
  description?: string | null
  _count?: {
    projects: number
  }
}

export interface HardwareItem {
  id: string
  name: string
  packPrice: number
  packQuantity: number
  packUnit: string
  description: string | null
}

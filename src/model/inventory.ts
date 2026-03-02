import type { PrinterInfo } from './printer'
import type { HardwareItem } from './hardware'

export interface InventorySummary {
  totalSpools: number
  totalWeight: number
  lowStockCount: number
  typeBreakdown: Array<{
    type: string
    count: number
    totalWeight: number
  }>
  printers: {
    total: number
    active: number
    idle: number
    printing: number
    maintenance: number
    offline: number
    printers: PrinterInfo[]
  }
  hardware: {
    total: number
    items: HardwareItem[]
  }
}

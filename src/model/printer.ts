export type PrinterStatus =
  | 'IDLE'
  | 'PRINTING'
  | 'PAUSED'
  | 'ERROR'
  | 'MAINTENANCE'
  | 'OFFLINE'

export type PrinterTechnology = 'FDM' | 'SLA' | 'SLS'

export interface PrinterData {
  id: string
  name: string
  model: string
  brand: string | null
  technology: PrinterTechnology
  status: PrinterStatus
  buildVolume: { x: number; y: number; z: number } | null
  nozzleSize: number | null
  powerConsumption: number | null
  cost: number | null
  isActive: boolean
  maintenanceIntervalDays?: number | null
  nextMaintenanceDue?: string | null
  _count: {
    printJobs: number
  }
}

export interface PrinterMaintenanceLog {
  id: string
  printerId: string
  type: string
  notes: string | null
  performedAt: string
  performedBy: string | null
  createdAt: string
}

export interface PrinterModel {
  id: string
  brand: string
  model: string
  technology: PrinterTechnology
  buildVolumeX: number
  buildVolumeY: number
  buildVolumeZ: number
  defaultNozzle: number
  avgPowerConsumption: number | null
  releaseYear: number | null
}

export interface Printer {
  id: string
  name: string
  model: string
  brand: string | null
  technology: PrinterTechnology
  status: PrinterStatus
  isActive: boolean
  queueCount?: number
}

export interface PrinterInfo {
  id: string
  name: string
  model: string
  brand: string | null
  technology: PrinterTechnology
  status: PrinterStatus
  isActive: boolean
}

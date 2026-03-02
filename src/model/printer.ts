export type PrinterStatus =
  | 'IDLE'
  | 'PRINTING'
  | 'PAUSED'
  | 'ERROR'
  | 'MAINTENANCE'
  | 'OFFLINE'

export interface PrinterData {
  id: string
  name: string
  model: string
  brand: string | null
  status: PrinterStatus
  buildVolume: { x: number; y: number; z: number } | null
  nozzleSize: number | null
  powerConsumption: number | null
  cost: number | null
  isActive: boolean
  _count: {
    printJobs: number
  }
}

export interface PrinterModel {
  id: string
  brand: string
  model: string
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
  status: PrinterStatus
  isActive: boolean
  queueCount?: number
}

export interface PrinterInfo {
  id: string
  name: string
  model: string
  brand: string | null
  status: PrinterStatus
  isActive: boolean
}

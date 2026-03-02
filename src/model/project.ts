import type { HardwareUnit } from './hardware'

export type { HardwareUnit }

export interface ProjectPart {
  id: string
  name: string
  description: string | null
  filamentWeight: number
  printTime: number | null
  quantity: number
  filamentColor: {
    id: string
    name: string
    hex: string
    type: {
      id: string
      name: string
      code: string
    }
  } | null
  spool: {
    id: string
    filament: {
      brand: string
      color: {
        id: string
        name: string
        hex: string
      }
      type: {
        id: string
        name: string
        code: string
      }
    }
  } | null
}

export interface ProjectHardware {
  id: string
  quantity: number
  hardware: {
    id: string
    name: string
    packPrice: number
    packQuantity: number
    packUnit: HardwareUnit
  }
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  assemblyTime?: number | null
  salesPrice?: number | null
  parts?: ProjectPart[]
  hardware?: ProjectHardware[]
  createdAt: string
  _count?: {
    parts?: number
    orders: number
  }
}

export interface CostBreakdown {
  filamentCost: number
  laborCost: number
  energyCost: number
  hardwareCost: number
  printerOperatingCost: number
  totalCost: number
}

export interface ProjectFilament {
  id: string
  brand: string
  totalRemainingWeight: number
  type: { id: string; name: string; code: string }
  color: { id: string; name: string; hex: string }
}

// Re-export from filament for project context
export type { FilamentType, FilamentColor } from './filament'

// Used by production-utils for cost calculation
export interface ProjectCostBreakdown {
  filamentCost: number
  laborCost: number
  energyCost: number
  hardwareCost: number
  printerOperatingCost: number
  totalCost: number
}

export interface ProjectForCostCalculation {
  parts: {
    filamentWeight: number
    quantity: number
    printTime: number | null
    filamentColorId?: string | null
    spool?: {
      filament?: {
        costPerKg?: number | null
        colorId?: string
      } | null
    } | null
  }[]
  hardware: {
    quantity: number
    hardware: {
      packPrice: number
      packQuantity: number
    }
  }[]
  assemblyTime: number | null
}

export interface TenantSettingsForCost {
  costPerKwh: number
  laborCostPerHour: number
  filamentMultiplier: number
  printerLaborCostMultiplier: number
  hardwareMultiplier: number
}

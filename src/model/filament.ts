export interface FilamentSpool {
  id: string
  brand?: string
  weight: number
  remainingWeight: number
  capacity?: number | null
  remainingQuantity?: number | null
  landedCostTotal?: number | null
  remainingPercent: number
  purchaseDate?: string | null
  notes?: string | null
  costPerKg?: number | null
  type?: {
    id: string
    name: string
    code: string
  }
  color?: {
    id: string
    name: string
    hex: string
  }
  supplier?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Filament {
  id: string
  brand: string
  costPerKg?: number | null
  baseLandedCostPerUnit?: number | null
  technology?: 'FDM' | 'SLA' | 'SLS'
  defaultUnit?: 'GRAM' | 'MILLILITER'
  supplier?: string | null
  notes?: string | null
  type: { id: string; name: string; code: string }
  color: { id: string; name: string; hex: string }
  spools?: FilamentSpool[]
  _count?: { spools: number }
  totalWeight?: number
  totalRemainingWeight?: number
}

export interface FilamentType {
  id: string
  name: string
  code: string
  technology?: 'FDM' | 'SLA' | 'SLS'
}

export interface FilamentColor {
  id: string
  name: string
  hex: string
  typeId: string
}

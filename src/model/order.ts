export interface Order {
  id: string
  orderNumber: string
  quantity: number
  status: 'PENDING' | 'IN_PROGRESS' | 'WAITING' | 'ASSEMBLED' | 'DELIVERED' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: string | null
  client: {
    id: string
    name: string
    phone: string | null
    email: string | null
    source?: string
  }
  partsTotal?: number
  partsPrinted?: number
  notes?: string | null
  project: {
    id: string
    name: string
  }
  orderParts?: OrderPart[]
  createdAt: string
}

export interface OrderPart {
  id: string
  quantity: number
  status: 'WAITING' | 'QUEUED' | 'PRINTING' | 'PRINTED'
  filament: OrderFilament | null
  printerId?: string | null
  part: {
    id: string
    name: string
    filamentWeight: number
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
  }
}

export interface OrderFilament {
  id: string
  brand: string
  totalRemainingWeight: number
  type: { id: string; name: string; code: string }
  color: { id: string; name: string; hex: string }
}

export interface ProjectSummary {
  id: string
  name: string
}

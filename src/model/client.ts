export interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string
  address?: string | null
  notes?: string | null
  createdAt?: string
  _count?: {
    orders: number
  }
}

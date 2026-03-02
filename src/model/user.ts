export interface User {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER'
  isActive?: boolean
  tenantId?: string
  tenant?: {
    id: string
    name: string
    slug: string
  }
  createdAt?: string
}

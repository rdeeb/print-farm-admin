import { create } from 'zustand'

interface DashboardStats {
  pendingOrders: number
  totalFilament: number
  lowStockSpools: number
  activePrinters: number
  completedJobsToday: number
}

interface DashboardState {
  stats: DashboardStats | null
  notifications: Array<{
    id: string
    type: 'FILAMENT_LOW' | 'FILAMENT_OUT' | 'ORDER_OVERDUE' | 'PRINTER_ERROR' | 'JOB_COMPLETED' | 'JOB_FAILED'
    title: string
    message: string
    read: boolean
    createdAt: string
  }>
  isLoading: boolean
  lastUpdated: string | null
}

interface DashboardActions {
  setStats: (stats: DashboardStats) => void
  setNotifications: (notifications: DashboardState['notifications']) => void
  markNotificationRead: (id: string) => void
  setLoading: (loading: boolean) => void
  setLastUpdated: (timestamp: string) => void
}

export const useDashboardStore = create<DashboardState & DashboardActions>()((set) => ({
  stats: null,
  notifications: [],
  isLoading: false,
  lastUpdated: null,

  setStats: (stats) => set({ stats }),
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),
}))
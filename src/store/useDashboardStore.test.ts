import { useDashboardStore } from './useDashboardStore'
import { act, renderHook } from '@testing-library/react'

const mockStats = {
  pendingOrders: 5,
  totalFilament: 1500,
  lowStockSpools: 2,
  activePrinters: 3,
  completedJobsToday: 10,
}

const mockNotifications = [
  {
    id: '1',
    type: 'FILAMENT_LOW' as const,
    title: 'Low Filament',
    message: 'PLA Black is running low',
    read: false,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    type: 'JOB_COMPLETED' as const,
    title: 'Print Complete',
    message: 'Job #123 has finished',
    read: false,
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: '3',
    type: 'PRINTER_ERROR' as const,
    title: 'Printer Error',
    message: 'Printer 1 has an error',
    read: true,
    createdAt: '2024-01-15T08:00:00Z',
  },
]

describe('useDashboardStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDashboardStore.setState({
      stats: null,
      notifications: [],
      isLoading: false,
      lastUpdated: null,
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDashboardStore())

    expect(result.current.stats).toBeNull()
    expect(result.current.notifications).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.lastUpdated).toBeNull()
  })

  it('should set stats correctly', () => {
    const { result } = renderHook(() => useDashboardStore())

    act(() => {
      result.current.setStats(mockStats)
    })

    expect(result.current.stats).toEqual(mockStats)
    expect(result.current.stats?.pendingOrders).toBe(5)
    expect(result.current.stats?.totalFilament).toBe(1500)
    expect(result.current.stats?.lowStockSpools).toBe(2)
    expect(result.current.stats?.activePrinters).toBe(3)
    expect(result.current.stats?.completedJobsToday).toBe(10)
  })

  it('should set notifications correctly', () => {
    const { result } = renderHook(() => useDashboardStore())

    act(() => {
      result.current.setNotifications(mockNotifications)
    })

    expect(result.current.notifications).toEqual(mockNotifications)
    expect(result.current.notifications).toHaveLength(3)
  })

  it('should mark notification as read', () => {
    const { result } = renderHook(() => useDashboardStore())

    act(() => {
      result.current.setNotifications(mockNotifications)
    })

    // Initially notification 1 is unread
    expect(result.current.notifications.find(n => n.id === '1')?.read).toBe(false)

    act(() => {
      result.current.markNotificationRead('1')
    })

    // After marking, notification 1 should be read
    expect(result.current.notifications.find(n => n.id === '1')?.read).toBe(true)
    // Other notifications should be unchanged
    expect(result.current.notifications.find(n => n.id === '2')?.read).toBe(false)
    expect(result.current.notifications.find(n => n.id === '3')?.read).toBe(true)
  })

  it('should not affect other notifications when marking one as read', () => {
    const { result } = renderHook(() => useDashboardStore())

    act(() => {
      result.current.setNotifications(mockNotifications)
    })

    act(() => {
      result.current.markNotificationRead('1')
    })

    expect(result.current.notifications).toHaveLength(3)
    expect(result.current.notifications.find(n => n.id === '2')?.read).toBe(false)
  })

  it('should set loading state', () => {
    const { result } = renderHook(() => useDashboardStore())

    expect(result.current.isLoading).toBe(false)

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('should set lastUpdated timestamp', () => {
    const { result } = renderHook(() => useDashboardStore())
    const timestamp = '2024-01-15T12:00:00Z'

    expect(result.current.lastUpdated).toBeNull()

    act(() => {
      result.current.setLastUpdated(timestamp)
    })

    expect(result.current.lastUpdated).toBe(timestamp)
  })

  it('should update lastUpdated timestamp', () => {
    const { result } = renderHook(() => useDashboardStore())
    const firstTimestamp = '2024-01-15T12:00:00Z'
    const secondTimestamp = '2024-01-15T13:00:00Z'

    act(() => {
      result.current.setLastUpdated(firstTimestamp)
    })

    expect(result.current.lastUpdated).toBe(firstTimestamp)

    act(() => {
      result.current.setLastUpdated(secondTimestamp)
    })

    expect(result.current.lastUpdated).toBe(secondTimestamp)
  })

  it('should handle marking non-existent notification as read', () => {
    const { result } = renderHook(() => useDashboardStore())

    act(() => {
      result.current.setNotifications(mockNotifications)
    })

    // This should not throw and notifications should remain unchanged
    act(() => {
      result.current.markNotificationRead('non-existent-id')
    })

    expect(result.current.notifications).toHaveLength(3)
    expect(result.current.notifications).toEqual(mockNotifications)
  })
})

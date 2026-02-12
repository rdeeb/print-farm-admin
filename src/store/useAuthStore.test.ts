import { useAuthStore } from './useAuthStore'
import { act, renderHook } from '@testing-library/react'

const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'ADMIN' as const,
  tenantId: 'test-tenant-id',
  tenant: {
    id: 'test-tenant-id',
    name: 'Test Tenant',
    slug: 'test-tenant',
  },
}

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('should login user correctly', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.login(mockUser, 'test-token')
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe('test-token')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should logout user correctly', () => {
    const { result } = renderHook(() => useAuthStore())

    // First login
    act(() => {
      result.current.login(mockUser, 'test-token')
    })

    // Then logout
    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should set loading state', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('should set user', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setUser(mockUser)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.setUser(null)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should set token', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setToken('new-token')
    })

    expect(result.current.token).toBe('new-token')

    act(() => {
      result.current.setToken(null)
    })

    expect(result.current.token).toBeNull()
  })
})
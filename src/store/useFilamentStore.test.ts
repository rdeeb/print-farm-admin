import { useFilamentStore } from './useFilamentStore'
import { act, renderHook } from '@testing-library/react'

const mockSpool = {
  id: 'spool-1',
  brand: 'eSUN',
  weight: 1000,
  remainingWeight: 750,
  remainingPercent: 75,
  lowStockThreshold: 20,
  costPerKg: 25.99,
  type: {
    id: 'type-1',
    name: 'PLA',
    code: 'PLA',
  },
  color: {
    id: 'color-1',
    name: 'Black',
    hex: '#000000',
  },
  supplier: 'Amazon',
  notes: 'Test spool',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
}

const mockSpool2 = {
  id: 'spool-2',
  brand: 'Hatchbox',
  weight: 1000,
  remainingWeight: 500,
  remainingPercent: 50,
  lowStockThreshold: 20,
  costPerKg: 22.99,
  type: {
    id: 'type-2',
    name: 'PETG',
    code: 'PETG',
  },
  color: {
    id: 'color-2',
    name: 'White',
    hex: '#FFFFFF',
  },
  supplier: null,
  notes: null,
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-16T00:00:00Z',
}

const mockTypes = [
  { id: 'type-1', name: 'PLA', code: 'PLA' },
  { id: 'type-2', name: 'PETG', code: 'PETG' },
  { id: 'type-3', name: 'ABS', code: 'ABS' },
]

const mockColors = [
  { id: 'color-1', name: 'Black', hex: '#000000', typeId: 'type-1' },
  { id: 'color-2', name: 'White', hex: '#FFFFFF', typeId: 'type-1' },
  { id: 'color-3', name: 'Red', hex: '#FF0000', typeId: 'type-2' },
]

describe('useFilamentStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFilamentStore.setState({
      spools: [],
      types: [],
      colors: [],
      isLoading: false,
      selectedSpool: null,
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFilamentStore())

    expect(result.current.spools).toEqual([])
    expect(result.current.types).toEqual([])
    expect(result.current.colors).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.selectedSpool).toBeNull()
  })

  describe('setSpools', () => {
    it('should set spools correctly', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSpools([mockSpool, mockSpool2])
      })

      expect(result.current.spools).toHaveLength(2)
      expect(result.current.spools[0]).toEqual(mockSpool)
      expect(result.current.spools[1]).toEqual(mockSpool2)
    })

    it('should replace existing spools', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSpools([mockSpool])
      })

      expect(result.current.spools).toHaveLength(1)

      act(() => {
        result.current.setSpools([mockSpool2])
      })

      expect(result.current.spools).toHaveLength(1)
      expect(result.current.spools[0]).toEqual(mockSpool2)
    })
  })

  describe('setTypes', () => {
    it('should set types correctly', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setTypes(mockTypes)
      })

      expect(result.current.types).toHaveLength(3)
      expect(result.current.types).toEqual(mockTypes)
    })
  })

  describe('setColors', () => {
    it('should set colors correctly', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setColors(mockColors)
      })

      expect(result.current.colors).toHaveLength(3)
      expect(result.current.colors).toEqual(mockColors)
    })
  })

  describe('setLoading', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useFilamentStore())

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
  })

  describe('setSelectedSpool', () => {
    it('should set selected spool', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSelectedSpool(mockSpool)
      })

      expect(result.current.selectedSpool).toEqual(mockSpool)
    })

    it('should clear selected spool when set to null', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSelectedSpool(mockSpool)
      })

      expect(result.current.selectedSpool).toEqual(mockSpool)

      act(() => {
        result.current.setSelectedSpool(null)
      })

      expect(result.current.selectedSpool).toBeNull()
    })
  })

  describe('updateSpool', () => {
    it('should update spool properties', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSpools([mockSpool, mockSpool2])
      })

      act(() => {
        result.current.updateSpool('spool-1', {
          remainingWeight: 500,
          remainingPercent: 50,
        })
      })

      const updatedSpool = result.current.spools.find(s => s.id === 'spool-1')
      expect(updatedSpool?.remainingWeight).toBe(500)
      expect(updatedSpool?.remainingPercent).toBe(50)
      // Other properties should remain unchanged
      expect(updatedSpool?.brand).toBe('eSUN')
    })

    it('should not affect other spools when updating one', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSpools([mockSpool, mockSpool2])
      })

      act(() => {
        result.current.updateSpool('spool-1', { remainingWeight: 500 })
      })

      const otherSpool = result.current.spools.find(s => s.id === 'spool-2')
      expect(otherSpool?.remainingWeight).toBe(500)
    })

    it('should handle updating non-existent spool', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSpools([mockSpool])
      })

      act(() => {
        result.current.updateSpool('non-existent', { remainingWeight: 100 })
      })

      expect(result.current.spools).toHaveLength(1)
      expect(result.current.spools[0].remainingWeight).toBe(750)
    })
  })

  describe('addSpool', () => {
    it('should add spool to the beginning of the list', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSpools([mockSpool])
      })

      act(() => {
        result.current.addSpool(mockSpool2)
      })

      expect(result.current.spools).toHaveLength(2)
      expect(result.current.spools[0]).toEqual(mockSpool2)
      expect(result.current.spools[1]).toEqual(mockSpool)
    })

    it('should add spool to empty list', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.addSpool(mockSpool)
      })

      expect(result.current.spools).toHaveLength(1)
      expect(result.current.spools[0]).toEqual(mockSpool)
    })
  })

  describe('removeSpool', () => {
    it('should remove spool from list', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSpools([mockSpool, mockSpool2])
      })

      act(() => {
        result.current.removeSpool('spool-1')
      })

      expect(result.current.spools).toHaveLength(1)
      expect(result.current.spools[0]).toEqual(mockSpool2)
    })

    it('should clear selectedSpool if removed spool was selected', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSpools([mockSpool, mockSpool2])
        result.current.setSelectedSpool(mockSpool)
      })

      expect(result.current.selectedSpool).toEqual(mockSpool)

      act(() => {
        result.current.removeSpool('spool-1')
      })

      expect(result.current.selectedSpool).toBeNull()
    })

    it('should not clear selectedSpool if different spool was removed', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSpools([mockSpool, mockSpool2])
        result.current.setSelectedSpool(mockSpool)
      })

      act(() => {
        result.current.removeSpool('spool-2')
      })

      expect(result.current.selectedSpool).toEqual(mockSpool)
    })

    it('should handle removing non-existent spool', () => {
      const { result } = renderHook(() => useFilamentStore())

      act(() => {
        result.current.setSpools([mockSpool])
      })

      act(() => {
        result.current.removeSpool('non-existent')
      })

      expect(result.current.spools).toHaveLength(1)
    })
  })
})

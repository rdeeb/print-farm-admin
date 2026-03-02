import { create } from 'zustand'
import type { FilamentSpool, FilamentType, FilamentColor } from '@/model/filament'

interface FilamentState {
  spools: FilamentSpool[]
  types: FilamentType[]
  colors: FilamentColor[]
  isLoading: boolean
  selectedSpool: FilamentSpool | null
}

interface FilamentActions {
  setSpools: (spools: FilamentSpool[]) => void
  setTypes: (types: FilamentType[]) => void
  setColors: (colors: FilamentColor[]) => void
  setLoading: (loading: boolean) => void
  setSelectedSpool: (spool: FilamentSpool | null) => void
  updateSpool: (id: string, updates: Partial<FilamentSpool>) => void
  addSpool: (spool: FilamentSpool) => void
  removeSpool: (id: string) => void
}

export const useFilamentStore = create<FilamentState & FilamentActions>()((set) => ({
  spools: [],
  types: [],
  colors: [],
  isLoading: false,
  selectedSpool: null,

  setSpools: (spools) => set({ spools }),
  setTypes: (types) => set({ types }),
  setColors: (colors) => set({ colors }),
  setLoading: (isLoading) => set({ isLoading }),
  setSelectedSpool: (selectedSpool) => set({ selectedSpool }),

  updateSpool: (id, updates) => set((state) => ({
    spools: state.spools.map(spool =>
      spool.id === id ? { ...spool, ...updates } : spool
    )
  })),

  addSpool: (spool) => set((state) => ({
    spools: [spool, ...state.spools]
  })),

  removeSpool: (id) => set((state) => ({
    spools: state.spools.filter(spool => spool.id !== id),
    selectedSpool: state.selectedSpool?.id === id ? null : state.selectedSpool
  })),
}))
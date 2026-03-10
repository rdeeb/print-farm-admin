'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import type { TenantSettings, SettingsContextType } from '@/model/settings'

const defaultSettings: TenantSettings = {
  currency: 'USD',
  softExpensePostingMode: 'SOFT_ONLY',
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => { },
})

export const useSettings = () => useContext(SettingsContext)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [settings, setSettings] = useState<TenantSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    if (status !== 'authenticated') return

    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          currency: data.currency || 'USD',
          softExpensePostingMode:
            data.softExpensePostingMode === 'POST_AS_EXPENSE'
              ? 'POST_AS_EXPENSE'
              : 'SOFT_ONLY',
          defaultLowStockThreshold:
            typeof data.defaultLowStockThreshold === 'number'
              ? data.defaultLowStockThreshold
              : 20,
        })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, fetchSettings])

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

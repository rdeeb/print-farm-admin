export interface TenantSettings {
  currency: string
  softExpensePostingMode?: 'SOFT_ONLY' | 'POST_AS_EXPENSE'
  defaultLowStockThreshold?: number
}

export interface SettingsContextType {
  settings: TenantSettings
  loading: boolean
  refreshSettings: () => Promise<void>
}

export interface TenantSettings {
  currency: string
}

export interface SettingsContextType {
  settings: TenantSettings
  loading: boolean
  refreshSettings: () => Promise<void>
}

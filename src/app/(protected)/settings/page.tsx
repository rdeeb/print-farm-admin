'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useSettings } from '@/components/providers/SettingsProvider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building, CalendarDays, DollarSign, Sliders, Save, Coins } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const { refreshSettings } = useSettings()

  const defaultPrintingDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]

  const [settings, setSettings] = useState({
    tenantName: '',
    printingHoursDay: 24,
    printingDays: defaultPrintingDays,
    costPerKwh: 0,
    laborCostPerHour: 0,
    filamentMultiplier: 1,
    printerLaborCostMultiplier: 1,
    hardwareMultiplier: 1,
    softExpensePostingMode: 'SOFT_ONLY',
    currency: 'USD',
  })

  const currencies = [
    { label: 'US Dollar ($)', value: 'USD' },
    { label: 'Euro (€)', value: 'EUR' },
    { label: 'British Pound (£)', value: 'GBP' },
    { label: 'Japanese Yen (¥)', value: 'JPY' },
    { label: 'Canadian Dollar (C$)', value: 'CAD' },
    { label: 'Australian Dollar (A$)', value: 'AUD' },
    { label: 'Swiss Franc (CHF)', value: 'CHF' },
    { label: 'Brazilian Real (R$)', value: 'BRL' },
  ]

  useEffect(() => {
    // Only admins can access settings
    if (session?.user?.role && session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    if (session?.user?.role === 'ADMIN') {
      fetchSettings()
    }
  }, [session, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (!response.ok) {
        throw new Error('Failed to load settings')
      }
      const data = await response.json()
      const normalizedDays = Array.isArray(data.printingDays)
        ? data.printingDays.filter((day: string) => defaultPrintingDays.includes(day))
        : defaultPrintingDays

      setSettings({
        tenantName:
          typeof data.tenantName === 'string'
            ? data.tenantName
            : session?.user?.tenant?.name ?? '',
        printingHoursDay:
          typeof data.printingHoursDay === 'number' ? data.printingHoursDay : 24,
        printingDays: normalizedDays,
        costPerKwh: typeof data.costPerKwh === 'number' ? data.costPerKwh : 0,
        laborCostPerHour:
          typeof data.laborCostPerHour === 'number' ? data.laborCostPerHour : 0,
        filamentMultiplier:
          typeof data.filamentMultiplier === 'number' ? data.filamentMultiplier : 1,
        printerLaborCostMultiplier:
          typeof data.printerLaborCostMultiplier === 'number'
            ? data.printerLaborCostMultiplier
            : 1,
        hardwareMultiplier:
          typeof data.hardwareMultiplier === 'number' ? data.hardwareMultiplier : 1,
        softExpensePostingMode:
          data.softExpensePostingMode === 'POST_AS_EXPENSE'
            ? 'POST_AS_EXPENSE'
            : 'SOFT_ONLY',
        currency: typeof data.currency === 'string' ? data.currency : 'USD',
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const parseNumberInput = (value: string, fallback: number) => {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const togglePrintingDay = (day: string) => {
    setSettings(prev => {
      const isActive = prev.printingDays.includes(day)
      const nextDays = isActive
        ? prev.printingDays.filter(item => item !== day)
        : [...prev.printingDays, day]
      return {
        ...prev,
        printingDays: defaultPrintingDays.filter(item => nextDays.includes(item)),
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          printingDays: defaultPrintingDays.filter(day => settings.printingDays.includes(day)),
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated.',
      })
      await refreshSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Unable to save settings',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your farm configuration and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization
          </CardTitle>
          <CardDescription>Update your tenant details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenantName">Tenant Name</Label>
            <Input
              id="tenantName"
              value={settings.tenantName}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  tenantName: e.target.value,
                }))
              }
              placeholder="Your tenant name"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Soft Expense Posting
          </CardTitle>
          <CardDescription>
            Control whether soft expenses stay non-cash or post as real expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="softExpensePostingMode">Posting Mode</Label>
            <Select
              value={settings.softExpensePostingMode}
              onValueChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  softExpensePostingMode: value,
                }))
              }
            >
              <SelectTrigger id="softExpensePostingMode" className="w-full">
                <SelectValue placeholder="Select posting mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOFT_ONLY">Store as soft (non-cash)</SelectItem>
                <SelectItem value="POST_AS_EXPENSE">Post directly as expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Localization
          </CardTitle>
          <CardDescription>Configure regional settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  currency: value,
                }))
              }
            >
              <SelectTrigger id="currency" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              The currency used for all cost and price displays.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Printing Schedule
          </CardTitle>
          <CardDescription>Define your daily capacity and allowed print days</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="printingHoursDay">Daily Printing Capacity (Hours)</Label>
            <Input
              id="printingHoursDay"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={settings.printingHoursDay}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  printingHoursDay: parseNumberInput(e.target.value, prev.printingHoursDay),
                }))
              }
            />
            <p className="text-xs text-gray-500">
              Maximum hours your farm can print in a single day.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Printing Days</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {defaultPrintingDays.map(day => {
                const isActive = settings.printingDays.includes(day)
                return (
                  <label key={day} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={isActive}
                      onChange={() => togglePrintingDay(day)}
                    />
                    {day}
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-gray-500">
              Select which days the farm is available to print.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Costing
          </CardTitle>
          <CardDescription>Track energy and labor costs for estimates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="costPerKwh">Cost per Kilowatt Hour</Label>
            <Input
              id="costPerKwh"
              type="number"
              min="0"
              step="0.01"
              value={settings.costPerKwh}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  costPerKwh: parseNumberInput(e.target.value, prev.costPerKwh),
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="laborCostPerHour">Labor Cost per Hour</Label>
            <Input
              id="laborCostPerHour"
              type="number"
              min="0"
              step="0.01"
              value={settings.laborCostPerHour}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  laborCostPerHour: parseNumberInput(e.target.value, prev.laborCostPerHour),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Multipliers
          </CardTitle>
          <CardDescription>Add buffers to cost estimates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filamentMultiplier">Material Multiplier</Label>
            <Input
              id="filamentMultiplier"
              type="number"
              min="0"
              step="0.01"
              value={settings.filamentMultiplier}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  filamentMultiplier: parseNumberInput(e.target.value, prev.filamentMultiplier),
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="printerLaborCostMultiplier">Printer Labor Cost Multiplier</Label>
            <Input
              id="printerLaborCostMultiplier"
              type="number"
              min="0"
              step="0.01"
              value={settings.printerLaborCostMultiplier}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  printerLaborCostMultiplier: parseNumberInput(
                    e.target.value,
                    prev.printerLaborCostMultiplier
                  ),
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hardwareMultiplier">Hardware Multiplier</Label>
            <Input
              id="hardwareMultiplier"
              type="number"
              min="0"
              step="0.01"
              value={settings.hardwareMultiplier}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  hardwareMultiplier: parseNumberInput(e.target.value, prev.hardwareMultiplier),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

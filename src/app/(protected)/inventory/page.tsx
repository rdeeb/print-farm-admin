'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle, TrendingDown, TrendingUp, Printer, Wrench, CheckCircle, Clock, XCircle } from 'lucide-react'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'

interface PrinterInfo {
  id: string
  name: string
  model: string
  brand: string | null
  status: 'IDLE' | 'PRINTING' | 'PAUSED' | 'ERROR' | 'MAINTENANCE' | 'OFFLINE'
  isActive: boolean
}

interface HardwareItem {
  id: string
  name: string
  packPrice: number
  packQuantity: number
  packUnit: string
  description: string | null
}

interface InventorySummary {
  totalSpools: number
  totalWeight: number
  lowStockCount: number
  typeBreakdown: Array<{
    type: string
    count: number
    totalWeight: number
  }>
  printers: {
    total: number
    active: number
    idle: number
    printing: number
    maintenance: number
    offline: number
    printers: PrinterInfo[]
  }
  hardware: {
    total: number
    items: HardwareItem[]
  }
}

const printerStatusConfig = {
  IDLE: { label: 'Idle', variant: 'success' as const, icon: CheckCircle },
  PRINTING: { label: 'Printing', variant: 'default' as const, icon: Clock },
  PAUSED: { label: 'Paused', variant: 'warning' as const, icon: Clock },
  ERROR: { label: 'Error', variant: 'destructive' as const, icon: XCircle },
  MAINTENANCE: { label: 'Maintenance', variant: 'warning' as const, icon: Wrench },
  OFFLINE: { label: 'Offline', variant: 'secondary' as const, icon: XCircle },
}

export default function InventoryPage() {
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory/summary')
        if (response.ok) {
          const data = await response.json()
          setSummary(data)
        }
      } catch (error) {
        console.error('Error fetching inventory:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInventory()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor your overall inventory status and stock levels
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spools</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalSpools || 0}</div>
            <p className="text-xs text-muted-foreground">Filament spools in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((summary?.totalWeight || 0) / 1000).toFixed(1)} kg
            </div>
            <p className="text-xs text-muted-foreground">Remaining filament</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary?.lowStockCount || 0}</div>
            <p className="text-xs text-muted-foreground">Spools below 20%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Types</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.typeBreakdown?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Different filament types</p>
          </CardContent>
        </Card>
      </div>

      {/* Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory by Type</CardTitle>
          <CardDescription>Breakdown of filament inventory by type</CardDescription>
        </CardHeader>
        <CardContent>
          {summary?.typeBreakdown && summary.typeBreakdown.length > 0 ? (
            <div className="space-y-4">
              {summary.typeBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.type}</h4>
                    <p className="text-sm text-gray-500">{item.count} spool{item.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{(item.totalWeight / 1000).toFixed(1)} kg</p>
                    <p className="text-sm text-gray-500">total remaining</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No inventory data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {summary?.lowStockCount && summary.lowStockCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              You have {summary.lowStockCount} spool{summary.lowStockCount !== 1 ? 's' : ''} with less than 20% remaining.
              Consider restocking soon to avoid running out during print jobs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Printers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Printer className="h-5 w-5 mr-2" />
            Printers
          </CardTitle>
          <CardDescription>
            {summary?.printers?.total || 0} printer{summary?.printers?.total !== 1 ? 's' : ''} •{' '}
            <span className="text-green-600">{summary?.printers?.idle || 0} idle</span> •{' '}
            <span className="text-blue-600">{summary?.printers?.printing || 0} printing</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary?.printers?.printers && summary.printers.printers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.printers.printers.map((printer) => {
                const statusInfo = printerStatusConfig[printer.status]
                const StatusIcon = statusInfo.icon
                return (
                  <div
                    key={printer.id}
                    className={`p-4 rounded-lg border ${!printer.isActive ? 'bg-gray-50 opacity-60' : 'bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{printer.name}</h4>
                      <Badge variant={statusInfo.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {printer.brand && `${printer.brand} `}{printer.model}
                    </p>
                    {!printer.isActive && (
                      <p className="text-xs text-gray-400 mt-1">Inactive</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Printer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No printers configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hardware Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="h-5 w-5 mr-2" />
            Hardware & Consumables
          </CardTitle>
          <CardDescription>
            {summary?.hardware?.total || 0} item{summary?.hardware?.total !== 1 ? 's' : ''} in inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary?.hardware?.items && summary.hardware.items.length > 0 ? (
            <div className="space-y-3">
              {summary.hardware.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.packPrice.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {item.packQuantity} {item.packUnit.toLowerCase()}/pack
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hardware items configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

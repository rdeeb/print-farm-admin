'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  Calendar,
  Printer,
  Clock,
  DollarSign,
  TrendingUp,
  XCircle,
  Zap,
  ChevronRight,
  Package,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'

interface DashboardStats {
  // Action items
  ordersDueToday: number
  ordersNeedingAction: number
  printingPrinters: number
  totalPrinters: number
  failedJobsWeek: number
  queuedJobs: number
  overdueOrders: number
  lowStockSpools: number

  // Financial
  revenueThisWeek: number
  revenueThisMonth: number
  profitThisWeek: number
  profitThisMonth: number
  outstandingValue: number
  avgOrderValue: number
  estimatedLossFromFails: number
  ordersCompletedThisWeek: number
  ordersCompletedThisMonth: number

  // Work stats
  pendingOrders: number
  completedJobsWeek: number
  successRate: number

  // Breakdowns
  ordersBreakdown: Record<string, number>
  printersBreakdown: Record<string, number>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Generate smart insight
  const smartInsight = useMemo(() => {
    if (!stats) return null

    if (stats.failedJobsWeek > 0 && stats.estimatedLossFromFails > 0) {
      return {
        type: 'warning',
        text: `You lost ~$${stats.estimatedLossFromFails.toFixed(0)} this week to ${stats.failedJobsWeek} failed print${stats.failedJobsWeek > 1 ? 's' : ''}.`,
      }
    }

    if (stats.successRate < 90 && stats.completedJobsWeek > 0) {
      return {
        type: 'warning',
        text: `Your success rate is ${stats.successRate}%. Consider checking printer calibration.`,
      }
    }

    if (stats.ordersCompletedThisWeek > 0 && stats.avgOrderValue > 0) {
      return {
        type: 'info',
        text: `Average order value: $${stats.avgOrderValue.toFixed(0)}. You completed ${stats.ordersCompletedThisWeek} order${stats.ordersCompletedThisWeek > 1 ? 's' : ''} this week.`,
      }
    }

    if (stats.printingPrinters === 0 && stats.queuedJobs > 0) {
      return {
        type: 'action',
        text: `${stats.queuedJobs} job${stats.queuedJobs > 1 ? 's' : ''} waiting in queue. Start printing to stay on schedule.`,
      }
    }

    return {
      type: 'success',
      text: 'All systems running smoothly. Keep up the good work!',
    }
  }, [stats])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <PrinterLoaderIcon size={64} color="#4f46e5" />
      </div>
    )
  }

  const workInProgressData = stats?.ordersBreakdown
    ? Object.entries(stats.ordersBreakdown)
      .filter(([status]) => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(status))
      .map(([status, count]) => ({ status, count }))
    : []

  const totalWIP = workInProgressData.reduce((sum, item) => sum + item.count, 0)

  // Printer utilization (printing vs idle)
  const idlePrinters = stats?.printersBreakdown?.IDLE || 0
  const printingNow = stats?.printingPrinters || 0
  const totalPrinters = stats?.totalPrinters || 1
  const utilizationPercent = totalPrinters > 0 ? Math.round((printingNow / totalPrinters) * 100) : 0

  return (
    <div className="space-y-6 pb-8">
      {/* ============================================
          SECTION 1: ACTION STRIP - What to do NOW
          ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Due Today */}
        <Link href="/orders?filter=due-today" className="block h-full">
          <Card className={`h-full cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${(stats?.ordersDueToday || 0) > 0 ? 'border-amber-300 bg-amber-50' : ''
            }`}>
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Calendar className={`h-5 w-5 ${(stats?.ordersDueToday || 0) > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className={`text-3xl font-bold ${(stats?.ordersDueToday || 0) > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                {stats?.ordersDueToday || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Due Today</p>
              <p className="text-xs font-medium mt-auto opacity-0">placeholder</p>
            </CardContent>
          </Card>
        </Link>

        {/* Need Action (Overdue + Pending) */}
        <Link href="/orders?filter=need-action" className="block h-full">
          <Card className={`h-full cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${((stats?.overdueOrders || 0) + (stats?.ordersNeedingAction || 0)) > 0 ? 'border-red-300 bg-red-50' : ''
            }`}>
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className={`h-5 w-5 ${((stats?.overdueOrders || 0) + (stats?.ordersNeedingAction || 0)) > 0 ? 'text-red-600' : 'text-gray-400'
                  }`} />
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className={`text-3xl font-bold ${((stats?.overdueOrders || 0) + (stats?.ordersNeedingAction || 0)) > 0 ? 'text-red-700' : 'text-gray-700'
                }`}>
                {(stats?.overdueOrders || 0) + (stats?.ordersNeedingAction || 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Need Action</p>
              <p className={`text-xs font-medium mt-auto ${(stats?.overdueOrders || 0) > 0 ? 'text-red-600' : 'opacity-0'}`}>
                {(stats?.overdueOrders || 0) > 0 ? `${stats?.overdueOrders} overdue` : 'placeholder'}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Printers Running */}
        <Link href="/queue" className="block h-full">
          <Card className={`h-full cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${printingNow > 0 ? 'border-blue-300 bg-blue-50' : ''
            }`}>
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Printer className={`h-5 w-5 ${printingNow > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className={`text-3xl font-bold ${printingNow > 0 ? 'text-blue-700' : 'text-gray-700'}`}>
                {printingNow}/{totalPrinters}
              </div>
              <p className="text-xs text-gray-600 mt-1">Printers Running</p>
              <p className={`text-xs font-medium mt-auto ${(stats?.queuedJobs || 0) > 0 ? 'text-blue-600' : 'opacity-0'}`}>
                {(stats?.queuedJobs || 0) > 0 ? `${stats?.queuedJobs} queued` : 'placeholder'}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Failed Prints */}
        <Link href="/queue?status=FAILED" className="block h-full">
          <Card className={`h-full cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${(stats?.failedJobsWeek || 0) > 0 ? 'border-red-300 bg-red-50' : ''
            }`}>
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <XCircle className={`h-5 w-5 ${(stats?.failedJobsWeek || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className={`text-3xl font-bold ${(stats?.failedJobsWeek || 0) > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                {stats?.failedJobsWeek || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Failed This Week</p>
              <p className="text-xs font-medium mt-auto opacity-0">placeholder</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ============================================
          SECTION 2: MONEY SNAPSHOT
          ============================================ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Profit - EMPHASIZED */}
            <div className="col-span-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Profit</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-600">
                ${(stats?.profitThisWeek || 0).toFixed(0)}
              </p>
            </div>

            {/* Revenue */}
            <div className="col-span-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Revenue</p>
              <p className="text-xl font-semibold text-gray-700">
                ${(stats?.revenueThisWeek || 0).toFixed(0)}
              </p>
            </div>

            {/* Outstanding */}
            <div className="col-span-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Value</p>
              <p className="text-xl font-semibold text-amber-600">
                ${(stats?.outstandingValue || 0).toFixed(0)}
              </p>
            </div>

            {/* Avg Order */}
            <div className="col-span-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Order</p>
              <p className="text-xl font-semibold text-gray-700">
                ${(stats?.avgOrderValue || 0).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Month comparison */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <span className="text-gray-500">This Month</span>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                Revenue: <span className="font-medium">${(stats?.revenueThisMonth || 0).toFixed(0)}</span>
              </span>
              <span className="text-green-600">
                Profit: <span className="font-medium">${(stats?.profitThisMonth || 0).toFixed(0)}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================
          SECTION 3 & 4: WORK IN PROGRESS + UTILIZATION
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Work in Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Work in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalWIP > 0 ? (
              <div className="space-y-3">
                {/* Visual bar */}
                <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                  {workInProgressData.map((item, index) => {
                    const percent = (item.count / totalWIP) * 100
                    return (
                      <div
                        key={item.status}
                        className={`${getStatusBarColor(item.status)}`}
                        style={{ width: `${percent}%` }}
                        title={`${formatStatus(item.status)}: ${item.count}`}
                      />
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {workInProgressData.map(item => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${getStatusDotColor(item.status)}`} />
                        <span className="text-gray-600">{formatStatus(item.status)}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t">
                  <Link href="/orders" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    View all orders <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No orders in progress</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Printer Utilization */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Printer Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {/* Circular progress */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${utilizationPercent * 2.51} 251`}
                    className={utilizationPercent > 70 ? 'text-green-500' : utilizationPercent > 30 ? 'text-blue-500' : 'text-gray-400'}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{utilizationPercent}%</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span className="text-sm text-gray-600">Printing</span>
                  </div>
                  <span className="font-medium">{printingNow}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span className="text-sm text-gray-600">Idle</span>
                  </div>
                  <span className="font-medium">{idlePrinters}</span>
                </div>
                {(stats?.queuedJobs || 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-amber-500" />
                      <span className="text-sm text-gray-600">In Queue</span>
                    </div>
                    <span className="font-medium">{stats?.queuedJobs}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Insight */}
            {idlePrinters > 0 && (stats?.queuedJobs || 0) > 0 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                <Zap className="h-4 w-4 inline mr-1" />
                {idlePrinters} idle printer{idlePrinters > 1 ? 's' : ''} with {stats?.queuedJobs} job{(stats?.queuedJobs || 0) > 1 ? 's' : ''} waiting
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          SECTION 5: FAILURES & LOSS (Compact)
          ============================================ */}
      {(stats?.failedJobsWeek || 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">
                    {stats?.failedJobsWeek} failed print{(stats?.failedJobsWeek || 0) > 1 ? 's' : ''} this week
                  </p>
                  <p className="text-sm text-red-600">
                    Estimated loss: ${(stats?.estimatedLossFromFails || 0).toFixed(0)}
                  </p>
                </div>
              </div>
              <Link href="/queue?status=FAILED">
                <button className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                  Review
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================
          SECTION 6: LOW STOCK ALERT (Compact)
          ============================================ */}
      {(stats?.lowStockSpools || 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">
                    {stats?.lowStockSpools} spool{(stats?.lowStockSpools || 0) > 1 ? 's' : ''} running low
                  </p>
                  <p className="text-sm text-amber-600">
                    Less than 20% remaining
                  </p>
                </div>
              </div>
              <Link href="/filament?lowStock=true">
                <button className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors">
                  View
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================
          SECTION 7: SMART INSIGHT
          ============================================ */}
      {smartInsight && (
        <Card className={`${smartInsight.type === 'warning' ? 'border-amber-200 bg-amber-50' :
            smartInsight.type === 'action' ? 'border-blue-200 bg-blue-50' :
              smartInsight.type === 'success' ? 'border-green-200 bg-green-50' :
                'border-gray-200 bg-gray-50'
          }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className={`h-5 w-5 ${smartInsight.type === 'warning' ? 'text-amber-600' :
                  smartInsight.type === 'action' ? 'text-blue-600' :
                    smartInsight.type === 'success' ? 'text-green-600' :
                      'text-gray-600'
                }`} />
              <p className={`text-sm font-medium ${smartInsight.type === 'warning' ? 'text-amber-800' :
                  smartInsight.type === 'action' ? 'text-blue-800' :
                    smartInsight.type === 'success' ? 'text-green-800' :
                      'text-gray-800'
                }`}>
                {smartInsight.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper functions
function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'Printing',
    WAITING: 'Assembly',
    ASSEMBLED: 'Ready',
    ON_HOLD: 'On Hold',
    QUEUED: 'Queued',
  }
  return labels[status] || status.charAt(0) + status.slice(1).toLowerCase()
}

function getStatusBarColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-400',
    IN_PROGRESS: 'bg-blue-500',
    WAITING: 'bg-orange-400',
    ASSEMBLED: 'bg-purple-500',
    ON_HOLD: 'bg-gray-400',
    QUEUED: 'bg-amber-400',
  }
  return colors[status] || 'bg-gray-400'
}

function getStatusDotColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-400',
    IN_PROGRESS: 'bg-blue-500',
    WAITING: 'bg-orange-400',
    ASSEMBLED: 'bg-purple-500',
    ON_HOLD: 'bg-gray-400',
    QUEUED: 'bg-amber-400',
  }
  return colors[status] || 'bg-gray-400'
}

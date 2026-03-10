'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Clock, CheckCircle, Package, Printer, AlertCircle } from 'lucide-react'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'
import type { AnalyticsData } from '@/model/analytics'
import type { TimeseriesDataPoint } from '@/types/analytics'
import { OrdersOverTimeChart } from './components/OrdersOverTimeChart'
import { RevenueOverTimeChart } from './components/RevenueOverTimeChart'
import { FilamentUsageChart } from './components/FilamentUsageChart'
import { FailureBreakdownChart, type FailureDataPoint } from './components/FailureBreakdownChart'

type DateRange = '3m' | '6m' | '12m' | 'ytd'

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '12M', value: '12m' },
  { label: 'YTD', value: 'ytd' },
]

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [timeseriesData, setTimeseriesData] = useState<TimeseriesDataPoint[]>([])
  const [timeseriesLoading, setTimeseriesLoading] = useState(true)
  const [timeseriesError, setTimeseriesError] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState<DateRange>('6m')

  const [failureData, setFailureData] = useState<FailureDataPoint[]>([])
  const [failureLoading, setFailureLoading] = useState(true)
  const [failureError, setFailureError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics')
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const fetchTimeseries = useCallback(async (range: DateRange) => {
    setTimeseriesLoading(true)
    setTimeseriesError(null)
    try {
      const response = await fetch(`/api/analytics/timeseries?range=${range}`)
      if (response.ok) {
        const json = await response.json()
        setTimeseriesData(json ?? [])
      } else {
        setTimeseriesError('Failed to load chart data. Please try again.')
      }
    } catch (error) {
      console.error('Error fetching timeseries data:', error)
      setTimeseriesError('Failed to load chart data. Please try again.')
    } finally {
      setTimeseriesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTimeseries(selectedRange)
  }, [selectedRange, fetchTimeseries])

  const fetchFailures = useCallback(async () => {
    setFailureLoading(true)
    setFailureError(null)
    try {
      const response = await fetch('/api/analytics/failures')
      if (response.ok) {
        const data = await response.json()
        setFailureData(data ?? [])
      } else {
        setFailureError('Failed to load failure data. Please try again.')
      }
    } catch (error) {
      console.error('Error fetching failure analytics:', error)
      setFailureError('Failed to load failure data. Please try again.')
    } finally {
      setFailureLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFailures()
  }, [fetchFailures])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const completionRate = analytics?.totalOrders
    ? Math.round((analytics.completedOrders / analytics.totalOrders) * 100)
    : 0

  const successRate = analytics?.totalPrintJobs
    ? Math.round((analytics.completedJobs / analytics.totalPrintJobs) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your 3D printing farm performance and metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.completedOrders || 0} of {analytics?.totalOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Print Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.completedJobs || 0} successful prints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Print Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.averagePrintTime ? `${Math.round(analytics.averagePrintTime / 60)}h` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Per print job</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Material Used</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.filamentUsed ? `${(analytics.filamentUsed / 1000).toFixed(1)}kg` : '0kg'}
            </div>
            <p className="text-xs text-muted-foreground">Total consumption</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Period:</span>
        <div className="flex gap-1">
          {DATE_RANGE_OPTIONS.map(({ label, value }) => (
            <Button
              key={value}
              variant={selectedRange === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(value)}
              className="min-w-[48px]"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeseries error banner */}
      {timeseriesError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{timeseriesError}</span>
          <button
            onClick={() => fetchTimeseries(selectedRange)}
            className="ml-auto underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Orders Over Time
            </CardTitle>
            <CardDescription>Monthly order trends</CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersOverTimeChart data={timeseriesData} isLoading={timeseriesLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Over Time
            </CardTitle>
            <CardDescription>Monthly income from orders</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueOverTimeChart data={timeseriesData} isLoading={timeseriesLoading} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Filament Consumption
            </CardTitle>
            <CardDescription>Filament used by completed print jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <FilamentUsageChart data={timeseriesData} isLoading={timeseriesLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Printer Utilization
            </CardTitle>
            <CardDescription>Usage across all printers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <Printer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Chart Coming Soon</p>
                <p className="text-sm">Printer utilization metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failure analytics error banner */}
      {failureError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{failureError}</span>
          <button
            onClick={() => fetchFailures()}
            className="ml-auto underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Failure Reason Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Failure Reason Breakdown
            </CardTitle>
            <CardDescription>Failed print jobs grouped by reason</CardDescription>
          </CardHeader>
          <CardContent>
            <FailureBreakdownChart data={failureData} isLoading={failureLoading} />
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Overall production statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold">{analytics?.totalOrders || 0}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold">{analytics?.totalPrintJobs || 0}</p>
              <p className="text-sm text-gray-500">Total Print Jobs</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{analytics?.failedJobs || 0}</p>
              <p className="text-sm text-gray-500">Failed Jobs</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold">{analytics?.printerUtilization || 0}%</p>
              <p className="text-sm text-gray-500">Utilization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

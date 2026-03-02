'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, CheckCircle, Package, Printer } from 'lucide-react'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'
import type { AnalyticsData } from '@/model/analytics'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
            <CardTitle className="text-sm font-medium">Filament Used</CardTitle>
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

      {/* Charts Placeholder */}
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
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Chart Coming Soon</p>
                <p className="text-sm">Order analytics visualization</p>
              </div>
            </div>
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
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <Printer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Chart Coming Soon</p>
                <p className="text-sm">Printer utilization metrics</p>
              </div>
            </div>
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

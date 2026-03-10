'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle, XCircle, Pause, RotateCcw, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { ReprintConfirmDialog } from './ReprintConfirmDialog'
import { formatDuration } from '@/lib/utils'

export interface JobHistoryItem {
  id: string
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED'
  partName: string
  partId: string
  orderNumber: string
  orderId: string
  printerName: string | null
  printerId: string | null
  filament: {
    brand: string
    colorName: string
    colorHex: string
  } | null
  duration: number | null
  failureReason: string | null
  failureNotes: string | null
  createdAt: string
}

interface HistoryResponse {
  jobs: JobHistoryItem[]
  total: number
  page: number
  totalPages: number
}

interface PrinterOption {
  id: string
  name: string
}

interface JobHistoryListProps {
  onReprintSuccess: () => void
  canEdit: boolean
}

const statusConfig = {
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'text-green-700 bg-green-100',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    className: 'text-red-700 bg-red-100',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Pause,
    className: 'text-gray-600 bg-gray-100',
  },
}

const PAGE_LIMIT = 20

export function JobHistoryList({ onReprintSuccess, canEdit }: JobHistoryListProps) {
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPrinter, setFilterPrinter] = useState<string>('all')
  const [reprintJob, setReprintJob] = useState<JobHistoryItem | null>(null)
  // refreshKey increments after a successful reprint to trigger a history refetch
  const [refreshKey, setRefreshKey] = useState(0)

  // Pre-fetched full printer list for the filter dropdown
  const [printers, setPrinters] = useState<PrinterOption[]>([])

  // Fetch tenant printer list once on mount
  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const res = await fetch('/api/printers')
        if (res.ok) {
          const json: { id: string; name: string }[] = await res.json()
          setPrinters(
            json
              .map(p => ({ id: p.id, name: p.name }))
              .sort((a, b) => a.name.localeCompare(b.name))
          )
        }
      } catch {
        // Silently ignore — printer filter will just be hidden
      }
    }
    fetchPrinters()
  }, [])

  const fetchHistory = useCallback(async (currentPage: number, status: string, printer: string) => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('limit', String(PAGE_LIMIT))
      if (status !== 'all') params.set('status', status)
      if (printer !== 'all') params.set('printerId', printer)

      const res = await fetch(`/api/queue/history?${params.toString()}`)
      if (res.ok) {
        const json: HistoryResponse = await res.json()
        setData(json)
      } else {
        const json = await res.json().catch(() => ({}))
        setFetchError((json as { error?: string }).error ?? 'Failed to load job history.')
      }
    } catch {
      setFetchError('An unexpected error occurred while loading job history.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refetch when page, filters, or refreshKey changes
  useEffect(() => {
    fetchHistory(page, filterStatus, filterPrinter)
  }, [page, filterStatus, filterPrinter, refreshKey, fetchHistory])

  const handleFilterStatus = (value: string) => {
    setFilterStatus(value)
    setPage(1)
  }

  const handleFilterPrinter = (value: string) => {
    setFilterPrinter(value)
    setPage(1)
  }

  const handleReprintSuccess = () => {
    setReprintJob(null)
    setRefreshKey(k => k + 1)
    onReprintSuccess()
  }

  const jobs = data?.jobs ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={handleFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {printers.length > 0 && (
          <Select value={filterPrinter} onValueChange={handleFilterPrinter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Printer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Printers</SelectItem>
              {printers.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-500">
              Loading history...
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-sm text-gray-500">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-red-600">{fetchError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchHistory(page, filterStatus, filterPrinter)}
              >
                Retry
              </Button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-500">
              <p>No job history found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th scope="col" className="px-4 py-3">Part</th>
                    <th scope="col" className="px-4 py-3">Order</th>
                    <th scope="col" className="px-4 py-3">Printer</th>
                    <th scope="col" className="px-4 py-3">Filament</th>
                    <th scope="col" className="px-4 py-3">Duration</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Reason</th>
                    <th scope="col" className="px-4 py-3">Date</th>
                    {canEdit && <th scope="col" className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobs.map(job => {
                    const cfg = statusConfig[job.status]
                    const StatusIcon = cfg.icon
                    return (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{job.partName}</td>
                        <td className="px-4 py-3 text-gray-600">{job.orderNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{job.printerName ?? '—'}</td>
                        <td className="px-4 py-3">
                          {job.filament ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="inline-block h-3 w-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: job.filament.colorHex }}
                              />
                              <span className="text-gray-600">
                                {job.filament.brand} {job.filament.colorName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {job.duration != null ? formatDuration(job.duration) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">
                          {job.failureReason ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReprintJob(job)}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Reprint
                            </Button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total count — always shown when data is loaded; pagination buttons only when needed */}
      {!isLoading && data !== null && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{data.total} total {data.total === 1 ? 'job' : 'jobs'}</span>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reprint confirmation dialog */}
      {reprintJob && (
        <ReprintConfirmDialog
          open={!!reprintJob}
          onOpenChange={open => { if (!open) setReprintJob(null) }}
          job={reprintJob}
          onSuccess={handleReprintSuccess}
        />
      )}
    </div>
  )
}

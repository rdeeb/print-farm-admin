'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock, Play, CheckCircle, XCircle, Pause, Printer, ListOrdered, ExternalLink, Trash2 } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'

interface PrintJob {
  id: string
  status: 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startTime: string | null
  endTime: string | null
  estimatedTime: number | null
  actualTime: number | null
  failureReason: string | null
  notes: string | null
  orderId: string
  partId: string
  printerId: string | null
  spoolId: string | null
  quantity: number
  order: {
    id: string
    orderNumber: string
    clientName: string
  }
  part: {
    id: string
    name: string
  }
  printer: {
    id: string
    name: string
    status: string
  } | null
  spool: {
    id: string
    brand: string
    filamentId: string
    color: {
      name: string
      hex: string
    }
  } | null
  createdAt: string
}

const statusConfig = {
  QUEUED: { label: 'Queued', variant: 'secondary' as const, icon: Clock },
  PRINTING: { label: 'Printing', variant: 'default' as const, icon: Play },
  COMPLETED: { label: 'Completed', variant: 'success' as const, icon: CheckCircle },
  FAILED: { label: 'Failed', variant: 'destructive' as const, icon: XCircle },
  CANCELLED: { label: 'Cancelled', variant: 'outline' as const, icon: Pause },
}

const priorityConfig = {
  LOW: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
}

export default function QueuePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterPrinter, setFilterPrinter] = useState<string>('')

  const canEdit = session?.user?.role !== 'VIEWER'

  // Initialize state from URL on mount and when URL changes
  useEffect(() => {
    setFilterStatus(searchParams.get('status') ?? '')
    setFilterPriority(searchParams.get('priority') ?? '')
    setFilterPrinter(searchParams.get('printer') ?? '')
  }, [searchParams])

  // Push filter state to URL when user changes filters (skip first run)
  const hasAppliedUrlSync = useRef(false)
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterPriority) params.set('priority', filterPriority)
    if (filterPrinter) params.set('printer', filterPrinter)
    const qs = params.toString()
    router.replace(qs ? `/queue?${qs}` : '/queue', { scroll: false })
  }, [filterStatus, filterPriority, filterPrinter, router])

  useEffect(() => {
    if (!hasAppliedUrlSync.current) {
      hasAppliedUrlSync.current = true
      return
    }
    updateUrl()
  }, [filterStatus, filterPriority, filterPrinter, updateUrl])

  // Get unique printers from jobs
  const printers = useMemo(() => {
    const printerMap = new Map<string, { id: string; name: string }>()
    jobs.forEach(job => {
      if (job.printer) {
        printerMap.set(job.printer.id, job.printer)
      }
    })
    return Array.from(printerMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [jobs])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/queue')
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('Error fetching queue:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()

    // Refresh every 30 seconds
    const interval = setInterval(fetchJobs, 30000)
    return () => clearInterval(interval)
  }, [])

  // Start printing a queued job
  const startPrinting = async (job: PrintJob) => {
    if (!job.printerId || !job.spool?.filamentId) {
      alert('Job is missing printer or filament information')
      return
    }

    // Check if printer is IDLE
    if (job.printer?.status !== 'IDLE') {
      alert('Printer is not available. It must be IDLE to start printing.')
      return
    }

    setIsUpdating(job.id)
    try {
      // Find the order part ID by querying the order parts
      const orderPartsRes = await fetch(`/api/orders/${job.orderId}`)
      if (!orderPartsRes.ok) {
        throw new Error('Failed to fetch order')
      }
      const order = await orderPartsRes.json()
      const orderPart = order.orderParts?.find((op: { part: { id: string }, status: string }) =>
        op.part.id === job.partId && op.status === 'QUEUED'
      )

      if (!orderPart) {
        alert('Could not find the queued order part')
        return
      }

      const response = await fetch(`/api/orders/${job.orderId}/parts/${orderPart.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PRINTING',
          filamentId: job.spool.filamentId,
          printerId: job.printerId,
        }),
      })

      if (response.ok) {
        await fetchJobs()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start printing')
      }
    } catch (error) {
      console.error('Error starting print:', error)
      alert('Failed to start printing')
    } finally {
      setIsUpdating(null)
    }
  }

  // Mark a printing job as printed
  const markPrinted = async (job: PrintJob) => {
    setIsUpdating(job.id)
    try {
      // Find the order part ID
      const orderPartsRes = await fetch(`/api/orders/${job.orderId}`)
      if (!orderPartsRes.ok) {
        throw new Error('Failed to fetch order')
      }
      const order = await orderPartsRes.json()
      const orderPart = order.orderParts?.find((op: { part: { id: string }, status: string }) =>
        op.part.id === job.partId && op.status === 'PRINTING'
      )

      if (!orderPart) {
        alert('Could not find the printing order part')
        return
      }

      const response = await fetch(`/api/orders/${job.orderId}/parts/${orderPart.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PRINTED' }),
      })

      if (response.ok) {
        await fetchJobs()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to mark as printed')
      }
    } catch (error) {
      console.error('Error marking as printed:', error)
      alert('Failed to mark as printed')
    } finally {
      setIsUpdating(null)
    }
  }

  // Cancel a queued job
  const cancelJob = async (job: PrintJob) => {
    if (!confirm('Are you sure you want to cancel this print job?')) return

    setIsUpdating(job.id)
    try {
      const response = await fetch(`/api/queue/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (response.ok) {
        await fetchJobs()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to cancel job')
      }
    } catch (error) {
      console.error('Error cancelling job:', error)
      alert('Failed to cancel job')
    } finally {
      setIsUpdating(null)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = !filterStatus || job.status === filterStatus
    const matchesPriority = !filterPriority || job.priority === filterPriority
    const matchesPrinter = !filterPrinter || job.printer?.id === filterPrinter
    return matchesStatus && matchesPriority && matchesPrinter
  })

  const queuedJobs = filteredJobs.filter(j => j.status === 'QUEUED')
  const activeJobs = filteredJobs.filter(j => j.status === 'PRINTING')
  const completedJobs = filteredJobs.filter(j => ['COMPLETED', 'FAILED', 'CANCELLED'].includes(j.status))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading print queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Print Queue</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage your print jobs
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{queuedJobs.length}</div>
            <p className="text-sm text-gray-500">In Queue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{activeJobs.length}</div>
            <p className="text-sm text-gray-500">Printing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter(j => j.status === 'COMPLETED').length}
            </div>
            <p className="text-sm text-gray-500">Completed Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {jobs.filter(j => j.status === 'FAILED').length}
            </div>
            <p className="text-sm text-gray-500">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="QUEUED">Queued</SelectItem>
                <SelectItem value="PRINTING">Printing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority || 'all'} onValueChange={(v) => setFilterPriority(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPrinter || 'all'} onValueChange={(v) => setFilterPrinter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Printer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Printers</SelectItem>
                {printers.map(printer => (
                  <SelectItem key={printer.id} value={printer.id}>
                    {printer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Currently Printing</h2>
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                canEdit={canEdit}
                isUpdating={isUpdating === job.id}
                onMarkPrinted={() => markPrinted(job)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Queued Jobs */}
      {queuedJobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Queue ({queuedJobs.length})</h2>
          <div className="space-y-4">
            {queuedJobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                canEdit={canEdit}
                isUpdating={isUpdating === job.id}
                queuePosition={index + 1}
                onStartPrinting={job.printer?.status === 'IDLE' ? () => startPrinting(job) : undefined}
                onCancel={() => cancelJob(job)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent ({completedJobs.length})</h2>
          <div className="space-y-4">
            {completedJobs.slice(0, 10).map((job) => (
              <JobCard key={job.id} job={job} canEdit={false} isUpdating={false} />
            ))}
          </div>
        </div>
      )}

      {filteredJobs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListOrdered className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No print jobs</h3>
            <p className="text-gray-500 text-center">
              {jobs.length === 0
                ? "There are no print jobs in the queue."
                : "No jobs match your current filters."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface JobCardProps {
  job: PrintJob
  canEdit: boolean
  isUpdating: boolean
  queuePosition?: number
  onStartPrinting?: () => void
  onMarkPrinted?: () => void
  onCancel?: () => void
}

function JobCard({ job, canEdit, isUpdating, queuePosition, onStartPrinting, onMarkPrinted, onCancel }: JobCardProps) {
  const status = statusConfig[job.status]
  const priority = priorityConfig[job.priority]
  const StatusIcon = status.icon

  // Calculate elapsed time for printing jobs
  const elapsedTime = useMemo(() => {
    if (job.status !== 'PRINTING' || !job.startTime) return null
    const start = new Date(job.startTime).getTime()
    const now = Date.now()
    return Math.floor((now - start) / 60000) // minutes
  }, [job.status, job.startTime])

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {queuePosition && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                {queuePosition}
              </div>
            )}
            <div className="p-2 bg-gray-100 rounded-lg">
              <Printer className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium">{job.part.name}</h3>
                {job.quantity > 1 && (
                  <span className="text-sm text-gray-500">x{job.quantity}</span>
                )}
                <Badge variant={status.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority.className}`}>
                  {priority.label}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Link
                  href={`/orders/${job.order.id}`}
                  className="hover:text-indigo-600 hover:underline flex items-center"
                >
                  {job.order.orderNumber}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
                <span>•</span>
                <span>{job.order.clientName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right text-sm">
              {job.printer && (
                <div className="flex items-center justify-end space-x-2">
                  <p className="font-medium">{job.printer.name}</p>
                  {job.status === 'QUEUED' && (
                    <span className={`w-2 h-2 rounded-full ${job.printer.status === 'IDLE' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  )}
                </div>
              )}
              {job.spool && (
                <div className="flex items-center justify-end space-x-1">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: job.spool.color.hex }}
                  />
                  <span className="text-gray-500">{job.spool.color.name}</span>
                </div>
              )}
              {job.status === 'PRINTING' && elapsedTime !== null && (
                <p className="text-blue-600">
                  {formatDuration(elapsedTime)} elapsed
                  {job.estimatedTime && ` / ${formatDuration(job.estimatedTime)}`}
                </p>
              )}
              {job.status === 'QUEUED' && job.estimatedTime && (
                <p className="text-gray-400">
                  Est. {formatDuration(job.estimatedTime)}
                </p>
              )}
              {job.status === 'COMPLETED' && job.actualTime && (
                <p className="text-green-600">
                  Completed in {formatDuration(job.actualTime)}
                </p>
              )}
            </div>
            {canEdit && (
              <div className="flex items-center space-x-2">
                {job.status === 'QUEUED' && onStartPrinting && (
                  <Button
                    size="sm"
                    onClick={onStartPrinting}
                    disabled={isUpdating}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {isUpdating ? 'Starting...' : 'Start'}
                  </Button>
                )}
                {job.status === 'QUEUED' && !onStartPrinting && (
                  <span className="text-xs text-amber-600">Printer busy</span>
                )}
                {job.status === 'QUEUED' && onCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {job.status === 'PRINTING' && onMarkPrinted && (
                  <Button
                    size="sm"
                    onClick={onMarkPrinted}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {isUpdating ? 'Completing...' : 'Mark Printed'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

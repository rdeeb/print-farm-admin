'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle, Clock, Trash2, Plus } from 'lucide-react'
import type { PrinterMaintenanceLog } from '@/model/printer'

interface MaintenanceTabProps {
  printerId: string
  printerName: string
  maintenanceIntervalDays: number | null
  nextMaintenanceDue: string | null
}

const MAINTENANCE_TYPES = [
  { value: 'routine', label: 'Routine' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'calibration', label: 'Calibration' },
  { value: 'repair', label: 'Repair' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function todayInputValue() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function MaintenanceTab({
  printerId,
  maintenanceIntervalDays,
  nextMaintenanceDue,
}: MaintenanceTabProps) {
  const [logs, setLogs] = useState<PrinterMaintenanceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formType, setFormType] = useState('routine')
  const [formNotes, setFormNotes] = useState('')
  const [formPerformedBy, setFormPerformedBy] = useState('')
  const [formPerformedAt, setFormPerformedAt] = useState(todayInputValue())

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/printers/${printerId}/maintenance`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch (err) {
      console.error('Error fetching maintenance logs:', err)
    } finally {
      setIsLoading(false)
    }
  }, [printerId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/printers/${printerId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          notes: formNotes || undefined,
          performedBy: formPerformedBy || undefined,
          performedAt: formPerformedAt ? new Date(formPerformedAt).toISOString() : undefined,
        }),
      })
      if (res.ok) {
        setFormNotes('')
        setFormPerformedBy('')
        setFormPerformedAt(todayInputValue())
        setFormType('routine')
        await fetchLogs()
      }
    } catch (err) {
      console.error('Error logging maintenance:', err)
      setErrorMessage('Failed to log maintenance. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (logId: string) => {
    setDeletingId(logId)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/printers/${printerId}/maintenance/${logId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== logId))
      }
    } catch (err) {
      console.error('Error deleting maintenance log:', err)
      setErrorMessage('Failed to delete log. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const now = new Date()
  const dueDateObj = nextMaintenanceDue ? new Date(nextMaintenanceDue) : null
  const isOverdue = dueDateObj && dueDateObj < now
  const isDueSoon =
    dueDateObj &&
    !isOverdue &&
    dueDateObj.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000

  return (
    <div className="space-y-5">
      {/* Status Banner */}
      <div className="space-y-2">
        {maintenanceIntervalDays && (
          <div className="text-sm text-muted-foreground">
            Maintenance interval:{' '}
            <span className="font-medium text-foreground">
              every {maintenanceIntervalDays} day{maintenanceIntervalDays !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        {dueDateObj ? (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Next due:</span>
            {isOverdue ? (
              <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue — {formatDate(nextMaintenanceDue!)}
              </Badge>
            ) : isDueSoon ? (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Due Soon — {formatDate(nextMaintenanceDue!)}
              </Badge>
            ) : (
              <span className="text-sm font-medium">{formatDate(nextMaintenanceDue!)}</span>
            )}
          </div>
        ) : (
          !maintenanceIntervalDays && (
            <p className="text-sm text-muted-foreground">
              No maintenance interval set. Set one in the Details tab.
            </p>
          )
        )}
      </div>

      {/* Log Maintenance Form */}
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Log Maintenance
        </h4>
        {errorMessage && <p className="text-sm text-red-600 mb-2">{errorMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="maint-type">Type</Label>
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger id="maint-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="maint-performed-at">Date Performed</Label>
            <Input
              id="maint-performed-at"
              type="date"
              value={formPerformedAt}
              onChange={(e) => setFormPerformedAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="maint-performed-by">Performed By</Label>
            <Input
              id="maint-performed-by"
              value={formPerformedBy}
              onChange={(e) => setFormPerformedBy(e.target.value)}
              placeholder="Name or initials"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="maint-notes">Notes</Label>
            <Textarea
              id="maint-notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Optional notes about what was done"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={isSubmitting} size="sm" className="w-full">
            {isSubmitting ? 'Saving...' : 'Log Maintenance'}
          </Button>
        </form>
      </div>

      {/* Log History */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">History</h4>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No maintenance logged yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{log.type}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(log.performedAt)}
                    </span>
                  </div>
                  {log.performedBy && (
                    <p className="text-xs text-muted-foreground">By: {log.performedBy}</p>
                  )}
                  {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-red-600"
                  onClick={() => handleDelete(log.id)}
                  disabled={deletingId === log.id}
                  aria-label="Delete log"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

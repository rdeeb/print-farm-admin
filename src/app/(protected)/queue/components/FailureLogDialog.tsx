'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const FAILURE_REASONS = [
  'Filament Jam',
  'Bed Adhesion',
  'Power Loss',
  'File Error',
  'Stringing',
  'Warping',
  'Operator Error',
  'Other',
] as const

export type FailureReason = (typeof FAILURE_REASONS)[number]

export interface FailureLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  onSuccess: () => void
}

export function FailureLogDialog({
  open,
  onOpenChange,
  jobId,
  onSuccess,
}: FailureLogDialogProps) {
  const [selectedReason, setSelectedReason] = useState<FailureReason | ''>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a failure reason.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const trimmedNotes = notes.trim()

    try {
      const response = await fetch(`/api/queue/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'FAILED',
          failureReason: selectedReason,
          ...(trimmedNotes && { failureNotes: trimmedNotes }),
        }),
      })

      if (response.ok) {
        onOpenChange(false)
        setSelectedReason('')
        setNotes('')
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to mark job as failed.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedReason('')
      setNotes('')
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Job as Failed</DialogTitle>
          <DialogDescription>
            Select the reason for the print failure. This will be logged for analytics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="failure-reason">Failure Reason</Label>
            <Select
              value={selectedReason}
              onValueChange={(v) => {
                setSelectedReason(v as FailureReason)
                setError(null)
              }}
            >
              <SelectTrigger id="failure-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {FAILURE_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="failure-notes">
              Additional Notes{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="failure-notes"
              placeholder="Describe what went wrong..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
          >
            {isSubmitting ? 'Saving...' : 'Mark as Failed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
import { RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import type { JobHistoryItem } from './JobHistoryList'

export interface ReprintConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: JobHistoryItem
  onSuccess: () => void
}

export function ReprintConfirmDialog({
  open,
  onOpenChange,
  job,
  onSuccess,
}: ReprintConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/queue/${job.id}/reprint`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Reprint queued',
          description: `"${job.partName}" has been added to the queue. Assign a printer and spool before starting.`,
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to queue reprint.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) setError(null)
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reprint Job</DialogTitle>
          <DialogDescription>
            Reprint{' '}
            <span className="font-medium text-foreground">{job.partName}</span>
            {job.printerName && (
              <>
                {' '}on{' '}
                <span className="font-medium text-foreground">{job.printerName}</span>
              </>
            )}
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 text-sm text-gray-600">
          <p>
            A new print job will be created with status <span className="font-medium">Queued</span>.
            Printer and spool will be left unassigned so you can pick a current, active one.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Queuing...' : 'Confirm Reprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

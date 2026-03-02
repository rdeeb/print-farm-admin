export interface PrintJob {
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

export interface JobCardProps {
  job: PrintJob
  canEdit: boolean
  isUpdating: boolean
  queuePosition?: number
  onStartPrinting?: () => void
  onMarkPrinted?: () => void
  onCancel?: () => void
}

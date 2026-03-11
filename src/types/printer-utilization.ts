export interface PrinterUtilizationData {
  printerId: string
  printerName: string
  totalJobs: number
  completedJobs: number
  failedJobs: number
  successRate: number
  totalHours: number
  avgJobMinutes: number
}

export interface CalendarJob {
  id: string
  orderNumber: string
  projectName: string
  status: string
  priority: string
  printTime: number
  isOverdue: boolean
}

export interface DayStats {
  jobs: CalendarJob[]
  totalMinutes: number
  capacityMinutes: number
  allocationPercentage: number
  remainingMinutes: number
  hasOverdue: boolean
}

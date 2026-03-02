export interface DashboardStats {
  ordersDueToday: number
  ordersNeedingAction: number
  printingPrinters: number
  totalPrinters: number
  failedJobsWeek: number
  queuedJobs: number
  overdueOrders: number
  lowStockSpools: number
  revenueThisWeek: number
  revenueThisMonth: number
  profitThisWeek: number
  profitThisMonth: number
  outstandingValue: number
  avgOrderValue: number
  estimatedLossFromFails: number
  ordersCompletedThisWeek: number
  ordersCompletedThisMonth: number
  pendingOrders: number
  completedJobsWeek: number
  successRate: number
  ordersBreakdown: Record<string, number>
  printersBreakdown: Record<string, number>
}

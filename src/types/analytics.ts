export interface TimeseriesDataPoint {
  month: string       // e.g. "Jan 2025"
  monthKey: string    // e.g. "2025-01"
  ordersCount: number
  revenue: number
  filamentUsedGrams: number
}

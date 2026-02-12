/**
 * UTC-based date utilities so all date calculations are timezone-independent.
 * Use these for business logic (e.g. "today", "this week", overdue, suggested due date).
 */

/**
 * Start of the current day in UTC (00:00:00.000 UTC).
 */
export function getStartOfTodayUTC(): Date {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 0, 0, 0, 0))
}

/**
 * End of the current day in UTC (23:59:59.999 UTC).
 */
export function getEndOfTodayUTC(): Date {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 23, 59, 59, 999))
}

/**
 * Start of the given date's day in UTC.
 */
export function getStartOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
}

/**
 * End of the given date's day in UTC.
 */
export function getEndOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))
}

/**
 * Start of the current day minus N days, in UTC (00:00:00.000 UTC).
 */
export function getStartOfDaysAgoUTC(daysAgo: number): Date {
  const start = getStartOfTodayUTC()
  const result = new Date(start)
  result.setUTCDate(result.getUTCDate() - daysAgo)
  return result
}

/**
 * Start of the given month in UTC (month 0–11).
 */
export function getStartOfMonthUTC(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
}

/**
 * End of the given month in UTC (month 0–11).
 */
export function getEndOfMonthUTC(year: number, month: number): Date {
  return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
}

/**
 * Parse YYYY-MM string as start of that month in UTC.
 */
export function parseMonthUTC(monthStr: string): { start: Date; end: Date } {
  const [y, m] = monthStr.split('-').map(Number)
  const monthIndex = (m ?? 1) - 1
  return {
    start: getStartOfMonthUTC(y ?? 0, monthIndex),
    end: getEndOfMonthUTC(y ?? 0, monthIndex),
  }
}

/**
 * Format a date as YYYY-MM-DD using UTC components.
 */
export function formatDateKeyUTC(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Create a Date at start of day UTC for the given UTC year, month (0–11), and day.
 */
export function dateFromUTC(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
}

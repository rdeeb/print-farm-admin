/**
 * Cache for max printer operating cost per hour per tenant.
 * Operating cost per hour = printer.cost / OPERATING_HOURS_DIVISOR (13140).
 * Invalidated when printers are created or updated.
 */

export const OPERATING_HOURS_DIVISOR = 13140

interface CacheEntry {
  value: number
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const TTL_MS = 5 * 60 * 1000 // 5 minutes

export function getMaxOperatingCostPerHour(tenantId: string): number | undefined {
  const entry = cache.get(tenantId)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    cache.delete(tenantId)
    return undefined
  }
  return entry.value
}

export function setMaxOperatingCostPerHour(tenantId: string, value: number): void {
  cache.set(tenantId, {
    value,
    expiresAt: Date.now() + TTL_MS,
  })
}

export function invalidatePrinterCostCache(tenantId: string): void {
  cache.delete(tenantId)
}

import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

// How long a lease lasts without renewal (30 seconds in production)
const DEFAULT_LEASE_DURATION_MS = 30_000

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const code = (err as { code?: string })?.code
      if ((code === 'P2034' || code === 'P2002') && attempt < maxAttempts) {
        lastError = err
        await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 10))
        continue
      }
      throw err
    }
  }
  throw lastError
}

export interface LeaseResult {
  role: 'ACTIVE' | 'STANDBY'
  leaseExpiresAt?: Date // only set for ACTIVE
}

export interface AcquireLeaseOptions {
  tenantId: string
  printerId: string
  connectorAgentId: string
  leaseDurationMs?: number // injectable for tests
}

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

/**
 * Called when a connector heartbeats or first connects for a printer.
 * - If no lease exists → create one, grant ACTIVE
 * - If lease exists and belongs to this connector → renew it, return ACTIVE
 * - If lease exists, belongs to a different connector, and is NOT expired → return STANDBY
 * - If lease exists, belongs to a different connector, and IS expired → take over:
 *   update lease to this connector, bump leaseVersion, set lastSwitchReason = 'heartbeat_timeout', return ACTIVE
 */
export async function acquireOrRenewLease(opts: AcquireLeaseOptions): Promise<LeaseResult> {
  const { tenantId, printerId, connectorAgentId, leaseDurationMs = DEFAULT_LEASE_DURATION_MS } = opts

  return withRetry(() => prisma.$transaction(
    async (tx: TxClient) => {
      const now = new Date()
      const leaseExpiresAt = new Date(now.getTime() + leaseDurationMs)

      const existing = await tx.printerReporterLease.findUnique({
        where: { printerId },
      })

      if (existing && existing.tenantId !== opts.tenantId) {
        throw new Error(
          `printerId "${opts.printerId}" does not belong to tenant "${opts.tenantId}"`
        )
      }

      // No lease exists — create one and grant ACTIVE
      if (!existing) {
        await tx.printerReporterLease.create({
          data: {
            tenantId,
            printerId,
            activeConnectorAgentId: connectorAgentId,
            leaseVersion: 1,
            leaseExpiresAt,
          },
        })
        return { role: 'ACTIVE' as const, leaseExpiresAt }
      }

      // Lease belongs to this connector — renew it
      if (existing.activeConnectorAgentId === connectorAgentId) {
        await tx.printerReporterLease.update({
          where: { printerId },
          data: { leaseExpiresAt },
        })
        return { role: 'ACTIVE' as const, leaseExpiresAt }
      }

      // Lease belongs to a different connector
      const isExpired = existing.leaseExpiresAt <= now

      if (!isExpired) {
        // Still valid — this connector is STANDBY
        return { role: 'STANDBY' as const }
      }

      // Expired — take over the lease
      await tx.printerReporterLease.update({
        where: { printerId },
        data: {
          activeConnectorAgentId: connectorAgentId,
          leaseVersion: { increment: 1 },
          leaseExpiresAt,
          lastSwitchReason: 'heartbeat_timeout',
        },
      })
      return { role: 'ACTIVE' as const, leaseExpiresAt }
    },
    { isolationLevel: 'Serializable' },
  ))
}

/**
 * Called when a connector disconnects cleanly. Marks the lease as expired immediately
 * so standby connectors can take over on next heartbeat.
 * Only acts if the connector currently holds the active lease.
 */
export async function releaseLease(
  tenantId: string,
  printerId: string,
  connectorAgentId: string,
): Promise<void> {
  // Set to Unix epoch (effectively "already expired") so standby connectors
  // can immediately take over on their next heartbeat. The schema requires a
  // non-null DateTime, so null is not an option here.
  const past = new Date(0)
  await prisma.printerReporterLease.updateMany({
    where: {
      printerId,
      tenantId,
      activeConnectorAgentId: connectorAgentId,
    },
    data: {
      leaseExpiresAt: past,
    },
  })
}

/**
 * Returns the active connector agent ID for the given printer, or null if
 * no valid (unexpired) lease exists.
 *
 * @remarks
 * This is a best-effort snapshot read. The result may be stale by the time
 * the caller acts on it. Do NOT use this as the sole authorization check for
 * write operations — always re-validate inside the authoritative transaction.
 */
export async function getActiveLease(tenantId: string, printerId: string): Promise<string | null> {
  const lease = await prisma.printerReporterLease.findUnique({
    where: { printerId },
  })

  if (!lease) return null
  if (lease.tenantId !== tenantId) return null

  const now = new Date()
  if (lease.leaseExpiresAt <= now) return null

  return lease.activeConnectorAgentId
}

/**
 * Check all printers in a tenant for expired leases.
 * Returns list of printerIds with expired leases.
 * Used by background monitoring to detect stale reporters.
 */
export async function findExpiredLeases(tenantId: string): Promise<string[]> {
  const now = new Date()
  const leases = await prisma.printerReporterLease.findMany({
    where: {
      tenantId,
      leaseExpiresAt: { lte: now },
    },
    select: { printerId: true },
  })

  return leases.map((l) => l.printerId)
}

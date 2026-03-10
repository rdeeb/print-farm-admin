import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'

const DEDUPE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

const DEFAULT_TITLES: Record<NotificationType, string> = {
  FILAMENT_LOW: 'Filament low',
  FILAMENT_OUT: 'Filament out',
  ORDER_OVERDUE: 'Order overdue',
  PRINTER_ERROR: 'Printer error',
  JOB_COMPLETED: 'Job completed',
  JOB_FAILED: 'Job failed',
  SYSTEM: 'System notification',
}

export interface CreateNotificationOptions {
  tenantId: string
  type: NotificationType
  message: string
  title?: string
  metadata?: Record<string, unknown>
  userId?: string
  /** If set, deduplication will also match on this key (e.g. entity id) */
  dedupeKey?: string
}

/**
 * Creates a notification and writes it to the database.
 * Deduplication: skips creating a duplicate if the same tenant + type (and optional dedupeKey)
 * was already created within the last 5 minutes.
 */
export async function createNotification(options: CreateNotificationOptions) {
  const { tenantId, type, message, metadata, userId, dedupeKey } = options
  const title = options.title ?? DEFAULT_TITLES[type]

  const since = new Date(Date.now() - DEDUPE_WINDOW_MS)

  const candidates = await prisma.notification.findMany({
    where: {
      tenantId,
      type,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const existing =
    dedupeKey != null
      ? candidates.find((n) => (n.data as Record<string, unknown>)?.dedupeKey === dedupeKey)
      : candidates[0]

  if (existing) {
    return existing
  }

  const data =
    metadata || dedupeKey
      ? { ...metadata, ...(dedupeKey && { dedupeKey }) }
      : undefined

  return prisma.notification.create({
    data: {
      tenantId,
      type,
      title,
      message,
      data: data as Prisma.InputJsonValue | undefined,
      userId: userId ?? null,
    },
  })
}

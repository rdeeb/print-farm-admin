import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'
import { sendEmail } from '@/lib/email'
import { FilamentLowEmail } from '@/emails/FilamentLowEmail'
import { JobFailedEmail } from '@/emails/JobFailedEmail'
import { OrderOverdueEmail } from '@/emails/OrderOverdueEmail'
import React from 'react'

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

  const notification = await prisma.notification.create({
    data: {
      tenantId,
      type,
      title,
      message,
      data: data as Prisma.InputJsonValue | undefined,
      userId: userId ?? null,
    },
  })

  // Fire-and-forget email sending — errors must not break notification creation
  void sendNotificationEmail({ tenantId, type, metadata: metadata ?? {} }).catch((err) => {
    console.error('[notifications] Failed to send notification email:', err)
  })

  return notification
}

async function sendNotificationEmail({
  tenantId,
  type,
  metadata,
}: {
  tenantId: string
  type: NotificationType
  metadata: Record<string, unknown>
}): Promise<void> {
  // Only send emails for actionable notification types
  if (type !== 'FILAMENT_LOW' && type !== 'JOB_FAILED' && type !== 'ORDER_OVERDUE') {
    return
  }

  // Look up tenant settings to check notification preferences
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: {
      notifyFilamentLow: true,
      notifyJobFailed: true,
      notifyOrderOverdue: true,
    },
  })

  // Check preference gate
  if (type === 'FILAMENT_LOW' && settings?.notifyFilamentLow === false) return
  if (type === 'JOB_FAILED' && settings?.notifyJobFailed === false) return
  if (type === 'ORDER_OVERDUE' && settings?.notifyOrderOverdue === false) return

  // Look up admin email and tenant name in parallel
  const [adminUser, tenant] = await Promise.all([
    prisma.user.findFirst({
      where: { tenantId, role: 'ADMIN' },
      select: { email: true },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    }),
  ])

  if (!adminUser?.email) {
    console.warn('[notifications] No admin user email found for tenant:', tenantId)
    return
  }

  const farmName = tenant?.name ?? 'Your Farm'
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  if (type === 'FILAMENT_LOW') {
    const filamentName = String(metadata?.filamentName ?? 'Unknown filament')
    const color = String(metadata?.color ?? '')
    const remainingPercent = Number(metadata?.remainingPercent ?? 0)

    await sendEmail({
      to: adminUser.email,
      subject: `Low filament alert: ${filamentName}`,
      react: React.createElement(FilamentLowEmail, {
        filamentName,
        color,
        remainingPercent,
        farmName,
        appUrl,
      }),
    })
  } else if (type === 'JOB_FAILED') {
    const jobName = String(metadata?.jobName ?? 'Unknown job')
    const printerName = String(metadata?.printerName ?? 'Unknown printer')
    const failureReason = String(metadata?.failureReason ?? 'No reason provided')

    await sendEmail({
      to: adminUser.email,
      subject: `Print job failed: ${jobName}`,
      react: React.createElement(JobFailedEmail, {
        jobName,
        printerName,
        failureReason,
        farmName,
        appUrl,
      }),
    })
  } else if (type === 'ORDER_OVERDUE') {
    const orderName = String(metadata?.orderName ?? 'Unknown order')
    const clientName = String(metadata?.clientName ?? 'Unknown client')
    const dueDate = String(metadata?.dueDate ?? '')

    await sendEmail({
      to: adminUser.email,
      subject: `Order overdue: ${orderName}`,
      react: React.createElement(OrderOverdueEmail, {
        orderName,
        clientName,
        dueDate,
        farmName,
        appUrl,
      }),
    })
  }
}

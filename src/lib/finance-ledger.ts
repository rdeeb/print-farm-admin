import { prisma } from '@/lib/prisma'
import type { LedgerEntryType, LedgerSource, SoftExpensePostingMode } from '@prisma/client'
import type { Prisma } from '@prisma/client'

type CreateLedgerEntryInput = {
  tenantId: string
  amount: number
  type: LedgerEntryType
  source: LedgerSource
  currency?: string
  date?: Date
  isNonCash?: boolean
  autoKey?: string
  note?: string
  metadata?: Prisma.InputJsonValue
  orderId?: string
  spoolId?: string
  projectId?: string
}

export async function createLedgerEntry(input: CreateLedgerEntryInput) {
  const normalizedAmount = Number.isFinite(input.amount) ? Number(input.amount) : 0
  if (normalizedAmount <= 0) {
    return null
  }

  try {
    return await prisma.financeLedgerEntry.create({
      data: {
        tenantId: input.tenantId,
        amount: normalizedAmount,
        type: input.type,
        source: input.source,
        currency: input.currency || 'USD',
        date: input.date || new Date(),
        isNonCash: Boolean(input.isNonCash),
        autoKey: input.autoKey,
        note: input.note || null,
        metadata: input.metadata || undefined,
        orderId: input.orderId || null,
        spoolId: input.spoolId || null,
        projectId: input.projectId || null,
      },
    })
  } catch (error) {
    if (
      input.autoKey &&
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return null
    }
    throw error
  }
}

export async function getTenantFinanceContext(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: {
      currency: true,
      softExpensePostingMode: true,
    },
  })

  return {
    currency: settings?.currency || 'USD',
    softExpensePostingMode: (settings?.softExpensePostingMode ||
      'SOFT_ONLY') as SoftExpensePostingMode,
  }
}

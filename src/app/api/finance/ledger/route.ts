export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { LedgerEntryType, LedgerSource } from '@prisma/client'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as LedgerEntryType | null
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)

    const entries = await prisma.financeLedgerEntry.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(type ? { type } : {}),
      },
      include: {
        order: {
          select: { id: true, orderNumber: true },
        },
        project: {
          select: { id: true, name: true },
        },
        spool: {
          select: { id: true },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })

    return apiSuccess(entries)
  } catch (error) {
    console.error('Finance ledger GET error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }
    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const body = await request.json()
    const amount = Number(body.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return apiError('BAD_REQUEST', 'Amount must be greater than 0', 400)
    }

    const type = (body.type || 'ADJUSTMENT') as LedgerEntryType
    const source = (body.source || 'MANUAL') as LedgerSource

    const entry = await prisma.financeLedgerEntry.create({
      data: {
        tenantId: session.user.tenantId,
        amount,
        type,
        source,
        currency: typeof body.currency === 'string' ? body.currency : 'USD',
        date: body.date ? new Date(body.date) : new Date(),
        isNonCash: Boolean(body.isNonCash),
        note: typeof body.note === 'string' ? body.note : null,
        metadata: body.metadata || undefined,
      },
    })

    return apiSuccess(entry, 201)
  } catch (error) {
    console.error('Finance ledger POST error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

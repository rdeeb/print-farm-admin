import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'
import { invalidatePrinterCostCache } from '@/lib/printer-cost-cache'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const printer = await prisma.printer.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { printJobs: true },
        },
      },
    })

    if (!printer) {
      return apiError('NOT_FOUND', 'Printer not found', 404)
    }

    return apiSuccess(printer)
  } catch (error) {
    console.error('Error fetching printer:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const existing = await prisma.printer.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Printer not found', 404)
    }

    const body = await request.json()
    const { name, model, brand, technology, nozzleSize, buildVolume, powerConsumption, cost } = body

    const printer = await prisma.printer.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(model !== undefined && { model }),
        ...(brand !== undefined && { brand: brand || null }),
        ...(technology !== undefined && { technology }),
        ...(nozzleSize !== undefined && { nozzleSize: nozzleSize ?? null }),
        ...(buildVolume !== undefined && { buildVolume: buildVolume ?? null }),
        ...(powerConsumption !== undefined && { powerConsumption: powerConsumption ?? null }),
        ...(cost !== undefined && { cost: cost === '' || cost == null ? null : parseFloat(cost) }),
      },
      include: {
        _count: {
          select: { printJobs: true },
        },
      },
    })

    invalidatePrinterCostCache(session.user.tenantId)

    return apiSuccess(printer)
  } catch (error) {
    console.error('Error updating printer:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

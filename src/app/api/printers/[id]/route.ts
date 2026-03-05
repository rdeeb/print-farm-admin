import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { invalidatePrinterCostCache } from '@/lib/printer-cost-cache'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 })
    }

    return NextResponse.json(printer)
  } catch (error) {
    console.error('Error fetching printer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.printer.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 })
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

    return NextResponse.json(printer)
  } catch (error) {
    console.error('Error updating printer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId

    // Get all spools for this tenant (through filament relation)
    const spools = await prisma.filamentSpool.findMany({
      where: {
        filament: {
          tenantId,
        },
      },
      include: {
        filament: {
          include: {
            type: true,
          },
        },
      },
    })

    // Calculate totals
    const totalSpools = spools.length
    const totalWeight = spools.reduce((sum, spool) => sum + spool.remainingWeight, 0)
    const lowStockCount = spools.filter(spool => spool.remainingPercent < 20).length

    // Group by type
    const typeMap = new Map<string, { name: string; count: number; totalWeight: number }>()

    spools.forEach(spool => {
      const typeId = spool.filament.typeId
      const typeName = spool.filament.type.name

      if (!typeMap.has(typeId)) {
        typeMap.set(typeId, { name: typeName, count: 0, totalWeight: 0 })
      }

      const entry = typeMap.get(typeId)!
      entry.count += 1
      entry.totalWeight += spool.remainingWeight
    })

    const typeBreakdown = Array.from(typeMap.values()).map(item => ({
      type: item.name,
      count: item.count,
      totalWeight: item.totalWeight,
    }))

    // Get printers
    const printers = await prisma.printer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })

    const printerSummary = {
      total: printers.length,
      active: printers.filter(p => p.isActive).length,
      idle: printers.filter(p => p.status === 'IDLE' && p.isActive).length,
      printing: printers.filter(p => p.status === 'PRINTING').length,
      maintenance: printers.filter(p => p.status === 'MAINTENANCE').length,
      offline: printers.filter(p => p.status === 'OFFLINE' || !p.isActive).length,
      printers: printers.map(p => ({
        id: p.id,
        name: p.name,
        model: p.model,
        brand: p.brand,
        status: p.status,
        isActive: p.isActive,
      })),
    }

    // Get hardware items
    const hardware = await prisma.hardware.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })

    const hardwareSummary = {
      total: hardware.length,
      items: hardware.map(h => ({
        id: h.id,
        name: h.name,
        packPrice: h.packPrice,
        packQuantity: h.packQuantity,
        packUnit: h.packUnit,
        description: h.description,
      })),
    }

    return NextResponse.json({
      totalSpools,
      totalWeight,
      lowStockCount,
      typeBreakdown,
      printers: printerSummary,
      hardware: hardwareSummary,
    })
  } catch (error) {
    console.error('Error fetching inventory summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

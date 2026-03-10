import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import type { MaterialUnit, PrinterTechnology } from '@prisma/client'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const technology = searchParams.get('technology') as PrinterTechnology | null

    const filaments = await prisma.filament.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(technology ? { technology } : {}),
      },
      include: {
        type: true,
        color: true,
        spools: {
          orderBy: {
            remainingPercent: 'desc',
          },
        },
        _count: {
          select: {
            spools: true,
          },
        },
      },
      orderBy: [
        { brand: 'asc' },
        { type: { name: 'asc' } },
      ],
    })

    // Exclude 0% spools from totals and visualization; only include usable spools
    const filamentsWithTotals = filaments.map(filament => {
      const usableSpools = filament.spools.filter(s => s.remainingPercent > 0)
      const isMilliliter = filament.defaultUnit === 'MILLILITER'
      return {
        ...filament,
        spools: usableSpools,
        totalWeight: usableSpools.reduce(
          (sum, s) => sum + (s.capacity ?? s.weight),
          0
        ),
        totalRemainingWeight: usableSpools.reduce(
          (sum, s) => sum + (s.remainingQuantity ?? s.remainingWeight),
          0
        ),
        totalQuantity: usableSpools.reduce(
          (sum, s) => sum + (s.remainingQuantity ?? s.remainingWeight),
          0
        ),
        unit: isMilliliter ? 'ml' : 'g',
        _count: { spools: usableSpools.length },
      }
    })

    return apiSuccess(filamentsWithTotals)
  } catch (error) {
    console.error('Error fetching filaments:', error)
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
    const {
      brand,
      typeId,
      colorId,
      costPerKg,
      supplier,
      notes,
      technology,
      defaultUnit,
      baseLandedCostPerUnit,
    } = body

    const normalizedTechnology =
      technology === 'SLA' || technology === 'SLS' || technology === 'FDM'
        ? technology
        : 'FDM'
    const normalizedDefaultUnit: MaterialUnit =
      defaultUnit === 'MILLILITER' ||
      (normalizedTechnology === 'SLA' && defaultUnit !== 'GRAM')
        ? 'MILLILITER'
        : 'GRAM'

    const normalizedBaseLandedCost =
      typeof baseLandedCostPerUnit === 'number'
        ? baseLandedCostPerUnit
        : costPerKg
          ? costPerKg / 1000
          : null

    // Check if filament already exists
    const existing = await prisma.filament.findFirst({
      where: {
        brand,
        typeId,
        colorId,
        tenantId: session.user.tenantId,
      },
    })

    if (existing) {
      return apiError('CONFLICT', 'This filament combination already exists', 409)
    }

    const filament = await prisma.filament.create({
      data: {
        brand,
        typeId,
        colorId,
        costPerKg: costPerKg || null,
        baseLandedCostPerUnit: normalizedBaseLandedCost,
        technology: normalizedTechnology,
        defaultUnit: normalizedDefaultUnit,
        supplier: supplier || null,
        notes: notes || null,
        tenantId: session.user.tenantId,
      },
      include: {
        type: true,
        color: true,
        spools: true,
        _count: {
          select: {
            spools: true,
          },
        },
      },
    })

    return apiSuccess({
      ...filament,
      totalWeight: 0,
      totalRemainingWeight: 0,
    }, 201)
  } catch (error) {
    console.error('Error creating filament:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

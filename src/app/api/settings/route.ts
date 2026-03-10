import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    let settings = await prisma.tenantSettings.findUnique({
      where: {
        tenantId: session.user.tenantId,
      },
    })

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId: session.user.tenantId,
          printingHoursDay: 24.0,
          printingDays: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          costPerKwh: 0,
          laborCostPerHour: 0,
          filamentMultiplier: 1,
          printerLaborCostMultiplier: 1,
          hardwareMultiplier: 1,
          softExpensePostingMode: 'SOFT_ONLY',
          currency: 'USD',
        },
      })
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        id: session.user.tenantId,
      },
      select: {
        name: true,
      },
    })

    return apiSuccess({
      ...settings,
      tenantName: tenant?.name ?? '',
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const body = await request.json()
    const {
      tenantName,
      printingHoursDay,
      printingDays,
      costPerKwh,
      laborCostPerHour,
      filamentMultiplier,
      printerLaborCostMultiplier,
      hardwareMultiplier,
      softExpensePostingMode,
      currency,
    } = body

    const defaultPrintingDays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]

    const toNumber = (value: unknown, fallback: number) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return Number.isFinite(parsed) ? parsed : fallback
      }
      return fallback
    }

    const normalizedPrintingDays = Array.isArray(printingDays)
      ? printingDays.filter((day: string) => defaultPrintingDays.includes(day))
      : defaultPrintingDays

    const settings = await prisma.tenantSettings.upsert({
      where: {
        tenantId: session.user.tenantId,
      },
      update: {
        printingHoursDay: toNumber(printingHoursDay, 24),
        printingDays: normalizedPrintingDays,
        costPerKwh: toNumber(costPerKwh, 0),
        laborCostPerHour: toNumber(laborCostPerHour, 0),
        filamentMultiplier: toNumber(filamentMultiplier, 1),
        printerLaborCostMultiplier: toNumber(printerLaborCostMultiplier, 1),
        hardwareMultiplier: toNumber(hardwareMultiplier, 1),
        softExpensePostingMode:
          softExpensePostingMode === 'POST_AS_EXPENSE'
            ? 'POST_AS_EXPENSE'
            : 'SOFT_ONLY',
        currency: typeof currency === 'string' ? currency : 'USD',
      },
      create: {
        tenantId: session.user.tenantId,
        printingHoursDay: toNumber(printingHoursDay, 24),
        printingDays: normalizedPrintingDays,
        costPerKwh: toNumber(costPerKwh, 0),
        laborCostPerHour: toNumber(laborCostPerHour, 0),
        filamentMultiplier: toNumber(filamentMultiplier, 1),
        printerLaborCostMultiplier: toNumber(printerLaborCostMultiplier, 1),
        hardwareMultiplier: toNumber(hardwareMultiplier, 1),
        softExpensePostingMode:
          softExpensePostingMode === 'POST_AS_EXPENSE'
            ? 'POST_AS_EXPENSE'
            : 'SOFT_ONLY',
        currency: typeof currency === 'string' ? currency : 'USD',
      },
    })

    if (typeof tenantName === 'string' && tenantName.trim().length > 0) {
      await prisma.tenant.update({
        where: {
          id: session.user.tenantId,
        },
        data: {
          name: tenantName.trim(),
        },
      })
    }

    return apiSuccess({
      ...settings,
      tenantName: typeof tenantName === 'string' ? tenantName.trim() : undefined,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

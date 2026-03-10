import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const technology = searchParams.get('technology')

    const printerModels = await prisma.printerModel.findMany({
      where: {
        isActive: true,
        ...(brand && { brand }),
        ...(technology ? { technology: technology as 'FDM' | 'SLA' | 'SLS' } : {}),
      },
      orderBy: [
        { brand: 'asc' },
        { model: 'asc' },
      ],
    })

    // Group by brand for easier UI rendering
    const grouped = printerModels.reduce((acc, model) => {
      if (!acc[model.brand]) {
        acc[model.brand] = []
      }
      acc[model.brand].push(model)
      return acc
    }, {} as Record<string, typeof printerModels>)

    return apiSuccess({
      models: printerModels,
      grouped,
      brands: Object.keys(grouped).sort(),
    })
  } catch (error) {
    console.error('Printer models error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

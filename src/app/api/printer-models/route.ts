import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')

    const printerModels = await prisma.printerModel.findMany({
      where: {
        isActive: true,
        ...(brand && { brand }),
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

    return NextResponse.json({
      models: printerModels,
      grouped,
      brands: Object.keys(grouped).sort(),
    })
  } catch (error) {
    console.error('Printer models error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

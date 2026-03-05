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
    const technology = searchParams.get('technology')

    const types = await prisma.filamentType.findMany({
      where: {
        ...(technology ? { technology: technology as 'FDM' | 'SLA' | 'SLS' } : {}),
      },
      include: {
        _count: {
          select: { filaments: true }
        }
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(types)
  } catch (error) {
    console.error('Get filament types error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
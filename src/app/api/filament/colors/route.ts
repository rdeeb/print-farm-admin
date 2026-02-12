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
    const typeId = searchParams.get('typeId')

    const where = typeId ? { typeId } : {}

    const colors = await prisma.filamentColor.findMany({
      where,
      include: {
        type: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(colors)
  } catch (error) {
    console.error('Get filament colors error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
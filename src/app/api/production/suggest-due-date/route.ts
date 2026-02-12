import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { calculateSuggestedDueDate } from '@/lib/production-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const quantity = parseInt(searchParams.get('quantity') || '1')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Calculate total print time for the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId: session.user.tenantId,
      },
      include: {
        parts: {
          select: {
            printTime: true,
            quantity: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const totalPrintTimePerProject = project.parts.reduce((acc, part) => {
      return acc + (part.printTime || 0) * part.quantity
    }, 0)

    const totalAdditionalMinutes = totalPrintTimePerProject * quantity

    const suggestedDueDate = await calculateSuggestedDueDate(
      session.user.tenantId,
      totalAdditionalMinutes
    )

    return NextResponse.json({ suggestedDueDate })
  } catch (error) {
    console.error('Error suggesting due date:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

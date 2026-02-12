import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; hardwareId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify project belongs to tenant
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Find the project hardware entry
    const projectHardware = await prisma.projectHardware.findFirst({
      where: {
        projectId: params.id,
        hardwareId: params.hardwareId,
      },
    })

    if (!projectHardware) {
      return NextResponse.json({ error: 'Hardware not found in project' }, { status: 404 })
    }

    const body = await request.json()
    const { quantity } = body

    const updated = await prisma.projectHardware.update({
      where: { id: projectHardware.id },
      data: {
        quantity: quantity !== undefined ? parseFloat(quantity) : projectHardware.quantity,
      },
      include: {
        hardware: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating project hardware:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; hardwareId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify project belongs to tenant
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Find and delete the project hardware entry
    const projectHardware = await prisma.projectHardware.findFirst({
      where: {
        projectId: params.id,
        hardwareId: params.hardwareId,
      },
    })

    if (!projectHardware) {
      return NextResponse.json({ error: 'Hardware not found in project' }, { status: 404 })
    }

    await prisma.projectHardware.delete({
      where: { id: projectHardware.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing hardware from project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const projectHardware = await prisma.projectHardware.findMany({
      where: {
        projectId: params.id,
      },
      include: {
        hardware: true,
      },
      orderBy: {
        hardware: {
          name: 'asc',
        },
      },
    })

    return NextResponse.json(projectHardware)
  } catch (error) {
    console.error('Error fetching project hardware:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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

    const body = await request.json()
    const { hardwareId, quantity } = body

    if (!hardwareId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify hardware belongs to tenant
    const hardware = await prisma.hardware.findFirst({
      where: {
        id: hardwareId,
        tenantId: session.user.tenantId,
      },
    })

    if (!hardware) {
      return NextResponse.json({ error: 'Hardware not found' }, { status: 404 })
    }

    // Check if already exists
    const existing = await prisma.projectHardware.findFirst({
      where: {
        projectId: params.id,
        hardwareId,
      },
    })

    if (existing) {
      // Update quantity instead
      const updated = await prisma.projectHardware.update({
        where: { id: existing.id },
        data: { quantity: parseFloat(quantity) },
        include: { hardware: true },
      })
      return NextResponse.json(updated)
    }

    const projectHardware = await prisma.projectHardware.create({
      data: {
        projectId: params.id,
        hardwareId,
        quantity: parseFloat(quantity),
      },
      include: {
        hardware: true,
      },
    })

    return NextResponse.json(projectHardware, { status: 201 })
  } catch (error) {
    console.error('Error adding hardware to project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

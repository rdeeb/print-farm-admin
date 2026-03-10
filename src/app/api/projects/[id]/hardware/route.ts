import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    // Verify project belongs to tenant
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!project) {
      return apiError('NOT_FOUND', 'Project not found', 404)
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

    return apiSuccess(projectHardware)
  } catch (error) {
    console.error('Error fetching project hardware:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    // Verify project belongs to tenant
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!project) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    const body = await request.json()
    const { hardwareId, quantity } = body

    if (!hardwareId || quantity === undefined) {
      return apiError('BAD_REQUEST', 'Missing required fields', 400)
    }

    // Verify hardware belongs to tenant
    const hardware = await prisma.hardware.findFirst({
      where: {
        id: hardwareId,
        tenantId: session.user.tenantId,
      },
    })

    if (!hardware) {
      return apiError('NOT_FOUND', 'Hardware not found', 404)
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
      return apiSuccess(updated)
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

    return apiSuccess(projectHardware, 201)
  } catch (error) {
    console.error('Error adding hardware to project:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

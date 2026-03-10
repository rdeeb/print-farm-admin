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

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        orders: {
          include: {
            project: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    if (!client) {
      return apiError('NOT_FOUND', 'Client not found', 404)
    }

    return apiSuccess(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function PATCH(
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

    // Verify client belongs to tenant
    const existing = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Client not found', 404)
    }

    const body = await request.json()
    const { name, phone, email, source, address, notes } = body

    // Check if email is being changed and if it conflicts
    if (email && email !== existing.email) {
      const conflict = await prisma.client.findFirst({
        where: {
          email,
          tenantId: session.user.tenantId,
          NOT: { id: params.id },
        },
      })

      if (conflict) {
        return apiError('CONFLICT', 'A client with this email already exists', 409)
      }
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        source,
        address: address || null,
        notes: notes || null,
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    return apiSuccess(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    // Verify client belongs to tenant
    const existing = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Client not found', 404)
    }

    // Prevent deletion if client has orders
    if (existing._count.orders > 0) {
      return apiError('BAD_REQUEST', 'Cannot delete client with existing orders', 400)
    }

    await prisma.client.delete({
      where: { id: params.id },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

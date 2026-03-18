export const dynamic = 'force-dynamic'

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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const clients = await prisma.client.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return apiSuccess(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const body = await request.json()
    const { name, phone, email, source, address, notes } = body

    if (!name) {
      return apiError('BAD_REQUEST', 'Name is required', 400)
    }

    // Check if client with same email already exists for this tenant
    if (email) {
      const existing = await prisma.client.findFirst({
        where: {
          email,
          tenantId: session.user.tenantId,
        },
      })

      if (existing) {
        return apiError('CONFLICT', 'A client with this email already exists', 409)
      }
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        source: source || 'DIRECT',
        address: address || null,
        notes: notes || null,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    return apiSuccess(client, 201)
  } catch (error) {
    console.error('Error creating client:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

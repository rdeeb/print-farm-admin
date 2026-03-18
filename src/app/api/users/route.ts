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

    // Only admins can view users
    if (session.user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const users = await prisma.user.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return apiSuccess(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    // Only admins can create users
    if (session.user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const body = await request.json()
    const { name, email, role } = body

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return apiError('CONFLICT', 'Email already exists', 400)
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'VIEWER',
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return apiSuccess(user, 201)
  } catch (error) {
    console.error('Error creating user:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

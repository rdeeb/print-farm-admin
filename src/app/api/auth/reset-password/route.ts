export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || typeof token !== 'string') {
      return apiError('BAD_REQUEST', 'Token is required', 400)
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return apiError('BAD_REQUEST', 'Password must be at least 8 characters', 400)
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return apiError('BAD_REQUEST', 'Invalid or expired reset link', 400)
    }

    if (resetToken.usedAt) {
      return apiError('BAD_REQUEST', 'This reset link has already been used', 400)
    }

    if (new Date() > resetToken.expiresAt) {
      return apiError('BAD_REQUEST', 'This reset link has expired', 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return apiSuccess({ message: 'Password has been reset. You can now sign in.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

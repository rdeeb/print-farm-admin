import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import crypto from 'crypto'

const TOKEN_EXPIRY_HOURS = 1

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return apiError('BAD_REQUEST', 'Email is required', 400)
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!user) {
      return apiSuccess({ message: 'If an account exists, a reset link will be sent.' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`

    if (process.env.NODE_ENV === 'development') {
      console.log('[Forgot Password] Reset URL:', resetUrl)
    }

    return apiSuccess({ message: 'If an account exists, a reset link will be sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

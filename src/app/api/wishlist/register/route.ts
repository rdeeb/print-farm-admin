import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      printerCountAndMonitoring,
      biggestProblem,
      toolsTried,
      magicWandFix,
      worthPerMonth,
      doublePrintersBreak,
    } = body

    if (!email || typeof email !== 'string') {
      return apiError('BAD_REQUEST', 'Email is required', 400)
    }

    const trimmedEmail = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return apiError('BAD_REQUEST', 'Please enter a valid email address', 400)
    }

    const existing = await prisma.wishlistRegistration.findFirst({
      where: { email: trimmedEmail },
    })
    if (existing) {
      return apiError('CONFLICT', 'This email is already on the waitlist', 409)
    }

    await prisma.wishlistRegistration.create({
      data: {
        email: trimmedEmail,
        printerCountAndMonitoring:
          typeof printerCountAndMonitoring === 'string'
            ? printerCountAndMonitoring.trim() || null
            : null,
        biggestProblem:
          typeof biggestProblem === 'string' ? biggestProblem.trim() || null : null,
        toolsTried: typeof toolsTried === 'string' ? toolsTried.trim() || null : null,
        magicWandFix:
          typeof magicWandFix === 'string' ? magicWandFix.trim() || null : null,
        worthPerMonth:
          typeof worthPerMonth === 'string' ? worthPerMonth.trim() || null : null,
        doublePrintersBreak:
          typeof doublePrintersBreak === 'string'
            ? doublePrintersBreak.trim() || null
            : null,
      },
    })

    return apiSuccess(
      { message: "You're on the list. We'll be in touch when we launch." },
      201
    )
  } catch (error) {
    console.error('Wishlist registration error:', error)
    return apiError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500)
  }
}

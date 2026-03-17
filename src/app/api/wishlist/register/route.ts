import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const DISCOUNT_PERCENT = 25
const DISCOUNT_DURATION_MONTHS = 12

function generateCode(): string {
  let code = 'EARLY25-'
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode()
    const existing = await prisma.discountCode.findUnique({ where: { code } })
    if (!existing) return code
  }
  throw new Error('Failed to generate unique discount code')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      printerCountAndMonitoring,
      biggestProblem,
      toolsTried,
      doublePrintersBreak,
      worthPerMonth,
    } = body

    if (!email || typeof email !== 'string') {
      return apiError('BAD_REQUEST', 'Email is required', 400)
    }

    const trimmedEmail = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return apiError('BAD_REQUEST', 'Please enter a valid email address', 400)
    }

    const existing = await prisma.wishlistRegistration.findUnique({
      where: { email: trimmedEmail },
    })
    if (existing) {
      return apiError('CONFLICT', 'This email is already on the waitlist', 409)
    }

    const answeredSurvey =
      typeof printerCountAndMonitoring === 'string' && printerCountAndMonitoring.trim().length > 0 &&
      typeof biggestProblem === 'string' && biggestProblem.trim().length > 0 &&
      typeof worthPerMonth === 'string' && worthPerMonth.trim().length > 0

    const registration = await prisma.wishlistRegistration.create({
      data: {
        email: trimmedEmail,
        printerCountAndMonitoring:
          typeof printerCountAndMonitoring === 'string' ? printerCountAndMonitoring.trim() || null : null,
        biggestProblem:
          typeof biggestProblem === 'string' ? biggestProblem.trim() || null : null,
        toolsTried:
          typeof toolsTried === 'string' ? toolsTried.trim() || null : null,
        doublePrintersBreak:
          typeof doublePrintersBreak === 'string' ? doublePrintersBreak.trim() || null : null,
        worthPerMonth:
          typeof worthPerMonth === 'string' ? worthPerMonth.trim() || null : null,
      },
    })

    let discountCode: string | null = null

    if (answeredSurvey) {
      const code = await generateUniqueCode()
      await prisma.discountCode.create({
        data: {
          code,
          discountPercent: DISCOUNT_PERCENT,
          durationMonths: DISCOUNT_DURATION_MONTHS,
          maxUses: 1,
          wishlistRegistrationId: registration.id,
        },
      })
      discountCode = code
    }

    return apiSuccess(
      {
        message: "You're on the list. We'll be in touch when we launch.",
        discountCode,
      },
      201
    )
  } catch (error) {
    console.error('Wishlist registration error:', error)
    return apiError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500)
  }
}

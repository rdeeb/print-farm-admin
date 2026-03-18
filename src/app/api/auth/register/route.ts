export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { seedTenantFilaments } from '@/lib/seed-utils'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { tenantName, userName, email, password } = await req.json()

    if (!tenantName || !userName || !email || !password) {
      return apiError('BAD_REQUEST', 'Missing required fields', 400)
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return apiError('CONFLICT', 'User with this email already exists', 400)
    }

    // Create a slug for the tenant
    const slug = tenantName
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '')

    // Check if slug exists, if so append random string
    let finalSlug = slug
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    })

    if (existingTenant) {
      finalSlug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Trial ends 14 days from now
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    // Step 1: Create DB records first (tenant, user, subscription skeleton without stripeCustomerId)
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: finalSlug,
        },
      })

      const user = await tx.user.create({
        data: {
          name: userName,
          email: email,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      })

      // Create TRIAL subscription skeleton — stripeCustomerId filled in after the transaction
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          tier: 'TRIAL',
          status: 'trialing',
          trialEndsAt,
        },
      })

      // Seed the tenant with default filaments
      await seedTenantFilaments(tenant.id)

      return { tenant, user }
    })

    // Step 2: Create Stripe customer AFTER the transaction has committed
    // If this fails, the user is still registered and can link Stripe later
    try {
      const stripeCustomer = await getStripe().customers.create({
        email,
        name: tenantName,
      })

      // Step 3: Add tenantId to Stripe customer metadata for reverse-mapping
      await getStripe().customers.update(stripeCustomer.id, {
        metadata: { tenantId: result.tenant.id },
      })

      // Step 4: Persist the Stripe customer ID on the subscription record
      await prisma.subscription.update({
        where: { tenantId: result.tenant.id },
        data: { stripeCustomerId: stripeCustomer.id },
      })
    } catch (stripeError: unknown) {
      // Stripe failure is non-fatal — log and continue; user can link Stripe later
      console.error('Stripe customer creation failed after registration:', stripeError)
    }

    return apiSuccess(
      { message: 'Account created successfully', userId: result.user.id },
      201
    )
  } catch (error: unknown) {
    console.error('Registration error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return apiError('INTERNAL_ERROR', message, 500)
  }
}

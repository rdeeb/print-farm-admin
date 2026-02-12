import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { seedTenantFilaments } from '@/lib/seed-utils'

export async function POST(req: Request) {
  try {
    const { tenantName, userName, email, password } = await req.json()

    if (!tenantName || !userName || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
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

      // Seed the tenant with default filaments
      await seedTenantFilaments(tenant.id)

      return { tenant, user }
    })

    return NextResponse.json(
      { message: 'Account created successfully', userId: result.user.id },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

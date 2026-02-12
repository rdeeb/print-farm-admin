import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTenantFilaments(tenantId: string) {
  // Get all global filament types and colors
  const filamentTypes = await prisma.filamentType.findMany({
    include: {
      colors: true,
    },
  })

  if (filamentTypes.length === 0) {
    console.warn('No filament types found in database. Please run global seed first.')
    return
  }

  const defaultBrand = 'Generic'
  const defaultSupplier = 'Default'
  
  // We'll create a few basic filaments for each type to get them started
  // Black and White for each type
  const targetColors = ['Black', 'White']

  for (const type of filamentTypes) {
    const relevantColors = type.colors.filter(c => targetColors.includes(c.name))
    
    for (const color of relevantColors) {
      await prisma.filament.upsert({
        where: {
          brand_typeId_colorId_tenantId: {
            brand: defaultBrand,
            typeId: type.id,
            colorId: color.id,
            tenantId: tenantId,
          },
        },
        update: {},
        create: {
          brand: defaultBrand,
          supplier: defaultSupplier,
          costPerKg: 20.0,
          tenantId: tenantId,
          typeId: type.id,
          colorId: color.id,
        },
      })
    }
  }
}

async function main() {
  const tenants = await prisma.tenant.findMany()
  console.log(`Found ${tenants.length} tenants. Seeding filaments...`)

  for (const tenant of tenants) {
    console.log(`Seeding filaments for tenant: ${tenant.name} (${tenant.id})`)
    await seedTenantFilaments(tenant.id)
  }

  console.log('✅ All tenants seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding existing tenants:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { prisma } from './prisma'

export async function seedTenantFilaments(tenantId: string) {
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
  // For example, Black and White for each type
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

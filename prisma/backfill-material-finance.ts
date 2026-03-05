import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Backfilling material and finance defaults...')

  const filaments = await prisma.filament.findMany({
    select: { id: true, costPerKg: true, baseLandedCostPerUnit: true },
  })

  for (const filament of filaments) {
    if (filament.baseLandedCostPerUnit == null) {
      await prisma.filament.update({
        where: { id: filament.id },
        data: {
          baseLandedCostPerUnit:
            filament.costPerKg != null ? filament.costPerKg / 1000 : null,
        },
      })
    }
  }

  const spools = await prisma.filamentSpool.findMany({
    include: {
      filament: {
        select: {
          baseLandedCostPerUnit: true,
        },
      },
    },
  })

  for (const spool of spools) {
    const capacity = spool.capacity ?? spool.weight
    const remainingQuantity = spool.remainingQuantity ?? spool.remainingWeight
    const landedCostTotal =
      spool.landedCostTotal ??
      (spool.filament.baseLandedCostPerUnit != null
        ? spool.filament.baseLandedCostPerUnit * capacity
        : null)

    await prisma.filamentSpool.update({
      where: { id: spool.id },
      data: {
        capacity,
        remainingQuantity,
        landedCostTotal,
      },
    })
  }

  console.log('Backfill complete')
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

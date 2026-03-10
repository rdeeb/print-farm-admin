import { PrismaClient } from '@prisma/client'
import type { PrinterTechnology } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Printer models data - global library
const printerModelsData = [
  // Bambu Lab Printers
  { brand: 'Bambu Lab', model: 'X1 Carbon', buildVolumeX: 256, buildVolumeY: 256, buildVolumeZ: 256, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2022 },
  { brand: 'Bambu Lab', model: 'X1 Carbon Combo', buildVolumeX: 256, buildVolumeY: 256, buildVolumeZ: 256, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2022 },
  { brand: 'Bambu Lab', model: 'X1E', buildVolumeX: 256, buildVolumeY: 256, buildVolumeZ: 256, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2023 },
  { brand: 'Bambu Lab', model: 'P1S', buildVolumeX: 256, buildVolumeY: 256, buildVolumeZ: 256, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2023 },
  { brand: 'Bambu Lab', model: 'P1S Combo', buildVolumeX: 256, buildVolumeY: 256, buildVolumeZ: 256, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2023 },
  { brand: 'Bambu Lab', model: 'P1P', buildVolumeX: 256, buildVolumeY: 256, buildVolumeZ: 256, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2023 },
  { brand: 'Bambu Lab', model: 'A1', buildVolumeX: 256, buildVolumeY: 256, buildVolumeZ: 256, defaultNozzle: 0.4, avgPowerConsumption: 150, releaseYear: 2023 },
  { brand: 'Bambu Lab', model: 'A1 Combo', buildVolumeX: 256, buildVolumeY: 256, buildVolumeZ: 256, defaultNozzle: 0.4, avgPowerConsumption: 150, releaseYear: 2023 },
  { brand: 'Bambu Lab', model: 'A1 mini', buildVolumeX: 180, buildVolumeY: 180, buildVolumeZ: 180, defaultNozzle: 0.4, avgPowerConsumption: 120, releaseYear: 2023 },
  { brand: 'Bambu Lab', model: 'A1 mini Combo', buildVolumeX: 180, buildVolumeY: 180, buildVolumeZ: 180, defaultNozzle: 0.4, avgPowerConsumption: 120, releaseYear: 2023 },

  // Prusa Research Printers
  { brand: 'Prusa Research', model: 'MK4S', buildVolumeX: 250, buildVolumeY: 210, buildVolumeZ: 220, defaultNozzle: 0.4, avgPowerConsumption: 150, releaseYear: 2024 },
  { brand: 'Prusa Research', model: 'MK4', buildVolumeX: 250, buildVolumeY: 210, buildVolumeZ: 220, defaultNozzle: 0.4, avgPowerConsumption: 150, releaseYear: 2023 },
  { brand: 'Prusa Research', model: 'MK3S+', buildVolumeX: 250, buildVolumeY: 210, buildVolumeZ: 210, defaultNozzle: 0.4, avgPowerConsumption: 120, releaseYear: 2021 },
  { brand: 'Prusa Research', model: 'MINI+', buildVolumeX: 180, buildVolumeY: 180, buildVolumeZ: 180, defaultNozzle: 0.4, avgPowerConsumption: 100, releaseYear: 2020 },
  { brand: 'Prusa Research', model: 'XL (Single)', buildVolumeX: 360, buildVolumeY: 360, buildVolumeZ: 360, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2023 },
  { brand: 'Prusa Research', model: 'XL (2-tool)', buildVolumeX: 360, buildVolumeY: 360, buildVolumeZ: 360, defaultNozzle: 0.4, avgPowerConsumption: 400, releaseYear: 2023 },
  { brand: 'Prusa Research', model: 'XL (5-tool)', buildVolumeX: 360, buildVolumeY: 360, buildVolumeZ: 360, defaultNozzle: 0.4, avgPowerConsumption: 450, releaseYear: 2023 },
  { brand: 'Prusa Research', model: 'Core ONE', buildVolumeX: 250, buildVolumeY: 220, buildVolumeZ: 270, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2024 },

  // Creality Printers
  { brand: 'Creality', model: 'Ender 3 V3', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 270, releaseYear: 2024 },
  { brand: 'Creality', model: 'Ender 3 V3 SE', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 150, releaseYear: 2023 },
  { brand: 'Creality', model: 'Ender 3 V3 KE', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 240, defaultNozzle: 0.4, avgPowerConsumption: 260, releaseYear: 2023 },
  { brand: 'Creality', model: 'Ender 3 V3 Plus', buildVolumeX: 300, buildVolumeY: 300, buildVolumeZ: 330, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2024 },
  { brand: 'Creality', model: 'Ender 3 S1 Pro', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 270, defaultNozzle: 0.4, avgPowerConsumption: 270, releaseYear: 2022 },
  { brand: 'Creality', model: 'Ender 3 Pro', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 270, releaseYear: 2018 },
  { brand: 'Creality', model: 'Ender 5 S1', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 280, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2022 },
  { brand: 'Creality', model: 'K1', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2023 },
  { brand: 'Creality', model: 'K1 Max', buildVolumeX: 300, buildVolumeY: 300, buildVolumeZ: 300, defaultNozzle: 0.4, avgPowerConsumption: 500, releaseYear: 2023 },
  { brand: 'Creality', model: 'K1C', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2024 },
  { brand: 'Creality', model: 'K2 Plus', buildVolumeX: 350, buildVolumeY: 350, buildVolumeZ: 350, defaultNozzle: 0.4, avgPowerConsumption: 500, releaseYear: 2024 },
  { brand: 'Creality', model: 'CR-10 Smart Pro', buildVolumeX: 300, buildVolumeY: 300, buildVolumeZ: 400, defaultNozzle: 0.4, avgPowerConsumption: 450, releaseYear: 2022 },
  { brand: 'Creality', model: 'Sermoon V1 Pro', buildVolumeX: 175, buildVolumeY: 175, buildVolumeZ: 165, defaultNozzle: 0.4, avgPowerConsumption: 200, releaseYear: 2022 },

  // Anycubic Printers
  { brand: 'Anycubic', model: 'Kobra 3', buildVolumeX: 250, buildVolumeY: 250, buildVolumeZ: 260, defaultNozzle: 0.4, avgPowerConsumption: 400, releaseYear: 2024 },
  { brand: 'Anycubic', model: 'Kobra 3 Combo', buildVolumeX: 250, buildVolumeY: 250, buildVolumeZ: 260, defaultNozzle: 0.4, avgPowerConsumption: 400, releaseYear: 2024 },
  { brand: 'Anycubic', model: 'Kobra 2 Pro', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 400, releaseYear: 2023 },
  { brand: 'Anycubic', model: 'Kobra 2 Max', buildVolumeX: 420, buildVolumeY: 420, buildVolumeZ: 500, defaultNozzle: 0.4, avgPowerConsumption: 500, releaseYear: 2023 },
  { brand: 'Anycubic', model: 'Kobra 2 Neo', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2023 },
  { brand: 'Anycubic', model: 'Vyper', buildVolumeX: 245, buildVolumeY: 245, buildVolumeZ: 260, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2021 },
  { brand: 'Anycubic', model: 'i3 Mega S', buildVolumeX: 210, buildVolumeY: 210, buildVolumeZ: 205, defaultNozzle: 0.4, avgPowerConsumption: 250, releaseYear: 2019 },

  // Elegoo Printers
  { brand: 'Elegoo', model: 'Neptune 4 Pro', buildVolumeX: 225, buildVolumeY: 225, buildVolumeZ: 265, defaultNozzle: 0.4, avgPowerConsumption: 310, releaseYear: 2023 },
  { brand: 'Elegoo', model: 'Neptune 4 Plus', buildVolumeX: 320, buildVolumeY: 320, buildVolumeZ: 385, defaultNozzle: 0.4, avgPowerConsumption: 450, releaseYear: 2023 },
  { brand: 'Elegoo', model: 'Neptune 4 Max', buildVolumeX: 420, buildVolumeY: 420, buildVolumeZ: 480, defaultNozzle: 0.4, avgPowerConsumption: 550, releaseYear: 2023 },
  { brand: 'Elegoo', model: 'Neptune 4', buildVolumeX: 225, buildVolumeY: 225, buildVolumeZ: 265, defaultNozzle: 0.4, avgPowerConsumption: 310, releaseYear: 2023 },
  { brand: 'Elegoo', model: 'Neptune 3 Pro', buildVolumeX: 225, buildVolumeY: 225, buildVolumeZ: 280, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2022 },

  // Sovol Printers
  { brand: 'Sovol', model: 'SV07 Plus', buildVolumeX: 300, buildVolumeY: 300, buildVolumeZ: 400, defaultNozzle: 0.4, avgPowerConsumption: 400, releaseYear: 2023 },
  { brand: 'Sovol', model: 'SV07', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2023 },
  { brand: 'Sovol', model: 'SV06 Plus', buildVolumeX: 300, buildVolumeY: 300, buildVolumeZ: 340, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2022 },
  { brand: 'Sovol', model: 'SV06', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 280, releaseYear: 2022 },

  // QIDI Printers
  { brand: 'QIDI', model: 'X-Plus 3', buildVolumeX: 280, buildVolumeY: 260, buildVolumeZ: 260, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2023 },
  { brand: 'QIDI', model: 'X-Max 3', buildVolumeX: 325, buildVolumeY: 325, buildVolumeZ: 315, defaultNozzle: 0.4, avgPowerConsumption: 450, releaseYear: 2023 },
  { brand: 'QIDI', model: 'X-Smart 3', buildVolumeX: 175, buildVolumeY: 180, buildVolumeZ: 170, defaultNozzle: 0.4, avgPowerConsumption: 250, releaseYear: 2023 },

  // Flashforge Printers
  { brand: 'Flashforge', model: 'Adventurer 5M Pro', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 220, defaultNozzle: 0.4, avgPowerConsumption: 300, releaseYear: 2023 },
  { brand: 'Flashforge', model: 'Adventurer 5M', buildVolumeX: 220, buildVolumeY: 220, buildVolumeZ: 220, defaultNozzle: 0.4, avgPowerConsumption: 280, releaseYear: 2023 },
  { brand: 'Flashforge', model: 'Creator 4-A', buildVolumeX: 400, buildVolumeY: 350, buildVolumeZ: 500, defaultNozzle: 0.4, avgPowerConsumption: 800, releaseYear: 2022 },

  // Voron (Kit/DIY)
  { brand: 'Voron', model: '2.4 (350mm)', buildVolumeX: 350, buildVolumeY: 350, buildVolumeZ: 340, defaultNozzle: 0.4, avgPowerConsumption: 400, releaseYear: 2020 },
  { brand: 'Voron', model: '2.4 (300mm)', buildVolumeX: 300, buildVolumeY: 300, buildVolumeZ: 290, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2020 },
  { brand: 'Voron', model: '2.4 (250mm)', buildVolumeX: 250, buildVolumeY: 250, buildVolumeZ: 240, defaultNozzle: 0.4, avgPowerConsumption: 300, releaseYear: 2020 },
  { brand: 'Voron', model: 'Trident (350mm)', buildVolumeX: 350, buildVolumeY: 350, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 400, releaseYear: 2021 },
  { brand: 'Voron', model: 'Trident (300mm)', buildVolumeX: 300, buildVolumeY: 300, buildVolumeZ: 250, defaultNozzle: 0.4, avgPowerConsumption: 350, releaseYear: 2021 },
  { brand: 'Voron', model: '0.2', buildVolumeX: 120, buildVolumeY: 120, buildVolumeZ: 120, defaultNozzle: 0.4, avgPowerConsumption: 150, releaseYear: 2022 },

  // RatRig (Kit/DIY)
  { brand: 'RatRig', model: 'V-Core 4 (500mm)', buildVolumeX: 500, buildVolumeY: 500, buildVolumeZ: 500, defaultNozzle: 0.4, avgPowerConsumption: 600, releaseYear: 2024 },
  { brand: 'RatRig', model: 'V-Core 4 (400mm)', buildVolumeX: 400, buildVolumeY: 400, buildVolumeZ: 400, defaultNozzle: 0.4, avgPowerConsumption: 500, releaseYear: 2024 },
  { brand: 'RatRig', model: 'V-Core 4 (300mm)', buildVolumeX: 300, buildVolumeY: 300, buildVolumeZ: 300, defaultNozzle: 0.4, avgPowerConsumption: 400, releaseYear: 2024 },
  { brand: 'RatRig', model: 'V-Minion', buildVolumeX: 180, buildVolumeY: 180, buildVolumeZ: 180, defaultNozzle: 0.4, avgPowerConsumption: 200, releaseYear: 2022 },
  // SLA printers
  { brand: 'Formlabs', model: 'Form 4', technology: 'SLA', buildVolumeX: 200, buildVolumeY: 125, buildVolumeZ: 210, defaultNozzle: 0.0, avgPowerConsumption: 100, releaseYear: 2024 },
  { brand: 'Anycubic', model: 'Photon Mono M5s', technology: 'SLA', buildVolumeX: 218, buildVolumeY: 123, buildVolumeZ: 200, defaultNozzle: 0.0, avgPowerConsumption: 80, releaseYear: 2023 },
  { brand: 'Elegoo', model: 'Saturn 4 Ultra', technology: 'SLA', buildVolumeX: 218, buildVolumeY: 123, buildVolumeZ: 220, defaultNozzle: 0.0, avgPowerConsumption: 85, releaseYear: 2024 },
  // SLS printers
  { brand: 'Formlabs', model: 'Fuse 1+ 30W', technology: 'SLS', buildVolumeX: 165, buildVolumeY: 165, buildVolumeZ: 300, defaultNozzle: 0.0, avgPowerConsumption: 4500, releaseYear: 2023 },
  { brand: 'Sinterit', model: 'Lisa X', technology: 'SLS', buildVolumeX: 130, buildVolumeY: 180, buildVolumeZ: 330, defaultNozzle: 0.0, avgPowerConsumption: 2500, releaseYear: 2022 },
]

async function main() {
  // Seed printer models (global library)
  console.log('Seeding printer models...')
  for (const printerModel of printerModelsData) {
    const payload = {
      ...printerModel,
      technology: (printerModel.technology || 'FDM') as PrinterTechnology,
    }
    await prisma.printerModel.upsert({
      where: {
        brand_model_technology: {
          brand: payload.brand,
          model: payload.model,
          technology: payload.technology,
        },
      },
      update: payload,
      create: payload,
    })
  }
  console.log(`✅ Seeded ${printerModelsData.length} printer models`)

  // Create default material types per technology (FDM, SLA, SLS)
  const filamentTypes = await Promise.all([
    // FDM (filament) types
    prisma.filamentType.upsert({
      where: { code: 'PLA' },
      update: { technology: 'FDM' },
      create: { name: 'PLA', code: 'PLA', technology: 'FDM' },
    }),
    prisma.filamentType.upsert({
      where: { code: 'ABS' },
      update: { technology: 'FDM' },
      create: { name: 'ABS', code: 'ABS', technology: 'FDM' },
    }),
    prisma.filamentType.upsert({
      where: { code: 'PETG' },
      update: { technology: 'FDM' },
      create: { name: 'PETG', code: 'PETG', technology: 'FDM' },
    }),
    prisma.filamentType.upsert({
      where: { code: 'TPU' },
      update: { technology: 'FDM' },
      create: { name: 'TPU', code: 'TPU', technology: 'FDM' },
    }),
    // SLA (resin) types
    prisma.filamentType.upsert({
      where: { code: 'STD_RESIN' },
      update: { technology: 'SLA' },
      create: { name: 'Standard Resin', code: 'STD_RESIN', technology: 'SLA' },
    }),
    prisma.filamentType.upsert({
      where: { code: 'TOUGH_RESIN' },
      update: { technology: 'SLA' },
      create: { name: 'Tough Resin', code: 'TOUGH_RESIN', technology: 'SLA' },
    }),
    prisma.filamentType.upsert({
      where: { code: 'FLEX_RESIN' },
      update: { technology: 'SLA' },
      create: { name: 'Flexible Resin', code: 'FLEX_RESIN', technology: 'SLA' },
    }),
    prisma.filamentType.upsert({
      where: { code: 'DENTAL_RESIN' },
      update: { technology: 'SLA' },
      create: { name: 'Dental Resin', code: 'DENTAL_RESIN', technology: 'SLA' },
    }),
    prisma.filamentType.upsert({
      where: { code: 'CLEAR_RESIN' },
      update: { technology: 'SLA' },
      create: { name: 'Clear Resin', code: 'CLEAR_RESIN', technology: 'SLA' },
    }),
    prisma.filamentType.upsert({
      where: { code: 'CASTABLE_RESIN' },
      update: { technology: 'SLA' },
      create: { name: 'Castable Resin', code: 'CASTABLE_RESIN', technology: 'SLA' },
    }),
    // SLS (powder) types
    prisma.filamentType.upsert({
      where: { code: 'PA12' },
      update: { technology: 'SLS' },
      create: { name: 'PA12 (Nylon 12)', code: 'PA12', technology: 'SLS' },
    }),
    prisma.filamentType.upsert({
      where: { code: 'PA11' },
      update: { technology: 'SLS' },
      create: { name: 'PA11 (Nylon 11)', code: 'PA11', technology: 'SLS' },
    }),
    prisma.filamentType.upsert({
      where: { code: 'TPU_SLS' },
      update: { technology: 'SLS' },
      create: { name: 'TPU Powder', code: 'TPU_SLS', technology: 'SLS' },
    }),
  ])

  // Create default colors for each type
  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Green', hex: '#00FF00' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Orange', hex: '#FFA500' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Clear', hex: '#FFFFFF' },
    { name: 'Brown', hex: '#8B4513' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Navy', hex: '#000080' },
    { name: 'Cyan', hex: '#00FFFF' },
    { name: 'Magenta', hex: '#FF00FF' },
    { name: 'Lime', hex: '#32CD32' },
    { name: 'Teal', hex: '#008080' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Bronze', hex: '#CD7F32' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Olive', hex: '#808000' },
    { name: 'Maroon', hex: '#800000' },
    { name: 'Coral', hex: '#FF7F50' },
    { name: 'Salmon', hex: '#FA8072' },
    { name: 'Turquoise', hex: '#40E0D0' },
    { name: 'Lavender', hex: '#E6E6FA' },
    { name: 'Mint', hex: '#98FF98' },
    { name: 'Skin', hex: '#FFCBA4' },
    { name: 'Wood', hex: '#DEB887' },
  ]

  for (const type of filamentTypes) {
    for (const color of colors) {
      await prisma.filamentColor.upsert({
        where: {
          name_typeId: {
            name: color.name,
            typeId: type.id,
          },
        },
        update: {},
        create: {
          name: color.name,
          hex: color.hex,
          typeId: type.id,
        },
      })
    }
  }

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-farm' },
    update: {},
    create: {
      name: 'Demo 3D Farm',
      slug: 'demo-farm',
      settings: {
        create: {
          currency: 'USD',
        },
      },
    },
  })

  // Create demo admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      name: 'Demo Admin',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: demoTenant.id,
    },
  })

  // Create demo printers
  await prisma.printer.createMany({
    data: [
      {
        name: 'Ender 3 Pro #1',
        model: 'Ender 3 Pro',
        brand: 'Creality',
        status: 'IDLE',
        buildVolume: { x: 220, y: 220, z: 250 },
        nozzleSize: 0.4,
        powerConsumption: 270,
        tenantId: demoTenant.id,
      },
      {
        name: 'Prusa MK3S+ #1',
        model: 'MK3S+',
        brand: 'Prusa Research',
        status: 'IDLE',
        buildVolume: { x: 250, y: 210, z: 210 },
        nozzleSize: 0.4,
        powerConsumption: 120,
        tenantId: demoTenant.id,
      },
      {
        name: 'Bambu X1C #1',
        model: 'X1 Carbon',
        brand: 'Bambu Lab',
        status: 'IDLE',
        buildVolume: { x: 256, y: 256, z: 256 },
        nozzleSize: 0.4,
        powerConsumption: 350,
        tenantId: demoTenant.id,
      },
      {
        name: 'Bambu P1S #1',
        model: 'P1S',
        brand: 'Bambu Lab',
        status: 'IDLE',
        buildVolume: { x: 256, y: 256, z: 256 },
        nozzleSize: 0.4,
        powerConsumption: 350,
        tenantId: demoTenant.id,
      },
    ],
    skipDuplicates: true,
  })

  // Create demo filaments with spools
  const plaType = filamentTypes.find(t => t.code === 'PLA')
  const petgType = filamentTypes.find(t => t.code === 'PETG')

  const plaBlack = await prisma.filamentColor.findFirst({
    where: { name: 'Black', typeId: plaType?.id },
  })
  const plaWhite = await prisma.filamentColor.findFirst({
    where: { name: 'White', typeId: plaType?.id },
  })
  const plaOrange = await prisma.filamentColor.findFirst({
    where: { name: 'Orange', typeId: plaType?.id },
  })
  const petgBlack = await prisma.filamentColor.findFirst({
    where: { name: 'Black', typeId: petgType?.id },
  })

  // Check if filaments already exist
  const existingFilaments = await prisma.filament.count({
    where: { tenantId: demoTenant.id },
  })

  if (existingFilaments === 0 && plaType && petgType && plaBlack && plaWhite && plaOrange && petgBlack) {
    // Create Hatchbox PLA Black
    const hatchboxBlack = await prisma.filament.create({
      data: {
        brand: 'Hatchbox',
        costPerKg: 25.99,
        supplier: 'Amazon',
        tenantId: demoTenant.id,
        typeId: plaType.id,
        colorId: plaBlack.id,
      },
    })

    // Add spools to Hatchbox PLA Black
    await prisma.filamentSpool.createMany({
      data: [
        { weight: 1000, remainingWeight: 750, remainingPercent: 75, filamentId: hatchboxBlack.id },
        { weight: 1000, remainingWeight: 250, remainingPercent: 25, filamentId: hatchboxBlack.id },
      ],
    })

    // Create eSUN PLA White
    const esunWhite = await prisma.filament.create({
      data: {
        brand: 'eSUN',
        costPerKg: 22.99,
        supplier: 'Local Store',
        tenantId: demoTenant.id,
        typeId: plaType.id,
        colorId: plaWhite.id,
      },
    })

    await prisma.filamentSpool.createMany({
      data: [
        { weight: 1000, remainingWeight: 1000, remainingPercent: 100, filamentId: esunWhite.id },
        { weight: 1000, remainingWeight: 900, remainingPercent: 90, filamentId: esunWhite.id },
        { weight: 1000, remainingWeight: 500, remainingPercent: 50, filamentId: esunWhite.id },
      ],
    })

    // Create Bambu Lab PLA Orange
    const bambuOrange = await prisma.filament.create({
      data: {
        brand: 'Bambu Lab',
        costPerKg: 29.99,
        supplier: 'Bambu Lab Store',
        tenantId: demoTenant.id,
        typeId: plaType.id,
        colorId: plaOrange.id,
      },
    })

    await prisma.filamentSpool.createMany({
      data: [
        { weight: 1000, remainingWeight: 1000, remainingPercent: 100, filamentId: bambuOrange.id },
        { weight: 1000, remainingWeight: 1000, remainingPercent: 100, filamentId: bambuOrange.id },
        { weight: 1000, remainingWeight: 1000, remainingPercent: 100, filamentId: bambuOrange.id },
        { weight: 1000, remainingWeight: 1000, remainingPercent: 100, filamentId: bambuOrange.id },
        { weight: 1000, remainingWeight: 150, remainingPercent: 15, filamentId: bambuOrange.id },
      ],
    })

    // Create Overture PETG Black
    const overturePetg = await prisma.filament.create({
      data: {
        brand: 'Overture',
        costPerKg: 23.99,
        supplier: 'Amazon',
        tenantId: demoTenant.id,
        typeId: petgType.id,
        colorId: petgBlack.id,
      },
    })

    await prisma.filamentSpool.createMany({
      data: [
        { weight: 1000, remainingWeight: 800, remainingPercent: 80, filamentId: overturePetg.id },
        { weight: 1000, remainingWeight: 650, remainingPercent: 65, filamentId: overturePetg.id },
      ],
    })
  }

  // Create demo clients
  const existingClients = await prisma.client.count({
    where: { tenantId: demoTenant.id },
  })

  if (existingClients === 0) {
    await prisma.client.createMany({
      data: [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1 555-0101',
          source: 'DIRECT',
          tenantId: demoTenant.id,
        },
        {
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          phone: '+1 555-0102',
          source: 'FACEBOOK',
          tenantId: demoTenant.id,
        },
        {
          name: 'Mike Wilson',
          email: 'mike.wilson@example.com',
          phone: '+1 555-0103',
          source: 'INSTAGRAM',
          tenantId: demoTenant.id,
        },
        {
          name: 'Emily Brown',
          email: 'emily.b@example.com',
          phone: '+1 555-0104',
          source: 'REFERRAL',
          tenantId: demoTenant.id,
        },
        {
          name: 'David Lee',
          email: 'david.lee@example.com',
          phone: '+1 555-0105',
          source: 'WEBSITE',
          tenantId: demoTenant.id,
        },
      ],
    })
  }

  // Realistic demo data: orders in multiple statuses, failure logs, low-stock spools, job history
  const demoClients = await prisma.client.findMany({
    where: { tenantId: demoTenant.id },
    take: 5,
  })
  const demoPrinters = await prisma.printer.findMany({
    where: { tenantId: demoTenant.id },
    orderBy: { name: 'asc' },
  })
  const existingOrders = await prisma.order.count({
    where: { tenantId: demoTenant.id },
  })

  if (existingOrders === 0 && demoClients.length >= 3 && demoPrinters.length >= 4) {
    // Ensure 2 spools below threshold (e.g. 20%): one at 15% already in Bambu Orange; add/update one at 10%
    const lowSpools = await prisma.filamentSpool.findMany({
      where: {
        filament: { tenantId: demoTenant.id },
        remainingPercent: { lte: 25 },
      },
      take: 3,
    })
    if (lowSpools.length >= 1 && lowSpools[0].remainingPercent > 10) {
      await prisma.filamentSpool.update({
        where: { id: lowSpools[0].id },
        data: {
          remainingPercent: 10,
          remainingWeight: Math.round((lowSpools[0].capacity ?? lowSpools[0].weight) * 0.1),
          remainingQuantity: Math.round((lowSpools[0].capacity ?? lowSpools[0].weight) * 0.1),
        },
      })
    }

    // Projects with parts
    const projA = await prisma.project.create({
      data: {
        name: 'Widget Set A',
        description: 'Demo project with two parts',
        status: 'ACTIVE',
        salesPrice: 49.99,
        assemblyTime: 15,
        tenantId: demoTenant.id,
        createdById: adminUser.id,
        parts: {
          create: [
            { name: 'Widget Left', filamentWeight: 50, printTime: 120, quantity: 1 },
            { name: 'Widget Right', filamentWeight: 45, printTime: 95, quantity: 1 },
          ],
        },
      },
      include: { parts: true },
    })
    const projAPartIds = await prisma.projectPart.findMany({
      where: { projectId: projA.id },
      select: { id: true },
    })

    const projB = await prisma.project.create({
      data: {
        name: 'Gadget B',
        description: 'Single part demo',
        status: 'ACTIVE',
        salesPrice: 29.99,
        assemblyTime: 5,
        tenantId: demoTenant.id,
        createdById: adminUser.id,
        parts: {
          create: [
            { name: 'Gadget Base', filamentWeight: 80, printTime: 180, quantity: 1 },
          ],
        },
      },
      include: { parts: true },
    })
    const projBPartIds = await prisma.projectPart.findMany({
      where: { projectId: projB.id },
      select: { id: true },
    })

    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() - 14)

    // 3 active orders (different statuses)
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-DEMO-01',
        quantity: 2,
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        clientId: demoClients[0].id,
        tenantId: demoTenant.id,
        projectId: projA.id,
        createdById: adminUser.id,
      },
    })
    await prisma.orderPart.createMany({
      data: projAPartIds.map((p, i) => ({
        orderId: order1.id,
        partId: p.id,
        quantity: 2,
        status: i === 0 ? 'WAITING' : 'WAITING',
      })),
    })

    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-DEMO-02',
        quantity: 1,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        clientId: demoClients[1].id,
        tenantId: demoTenant.id,
        projectId: projA.id,
        createdById: adminUser.id,
      },
    })
    await prisma.orderPart.createMany({
      data: projAPartIds.map((p, i) => ({
        orderId: order2.id,
        partId: p.id,
        quantity: 1,
        status: i === 0 ? 'PRINTING' : 'WAITING',
      })),
    })
    const order2Parts = await prisma.orderPart.findMany({
      where: { orderId: order2.id },
      orderBy: { partId: 'asc' },
    })

    const order3 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-DEMO-03',
        quantity: 1,
        status: 'WAITING',
        priority: 'MEDIUM',
        dueDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        clientId: demoClients[2].id,
        tenantId: demoTenant.id,
        projectId: projB.id,
        createdById: adminUser.id,
      },
    })
    await prisma.orderPart.createMany({
      data: projBPartIds.map((p) => ({
        orderId: order3.id,
        partId: p.id,
        quantity: 1,
        status: 'PRINTED',
      })),
    })

    // 2 completed orders with failure logs (print jobs with FAILED + failureReason)
    const order4 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-DEMO-04',
        quantity: 1,
        status: 'DELIVERED',
        priority: 'MEDIUM',
        dueDate: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        clientId: demoClients[0].id,
        tenantId: demoTenant.id,
        projectId: projA.id,
        createdById: adminUser.id,
      },
    })
    await prisma.orderPart.createMany({
      data: projAPartIds.map((p) => ({
        orderId: order4.id,
        partId: p.id,
        quantity: 1,
        status: 'PRINTED',
      })),
    })
    const order4OrderParts = await prisma.orderPart.findMany({
      where: { orderId: order4.id },
      orderBy: { partId: 'asc' },
    })

    const order5 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-DEMO-05',
        quantity: 1,
        status: 'DELIVERED',
        priority: 'LOW',
        dueDate: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        clientId: demoClients[1].id,
        tenantId: demoTenant.id,
        projectId: projB.id,
        createdById: adminUser.id,
      },
    })
    await prisma.orderPart.createMany({
      data: projBPartIds.map((p) => ({
        orderId: order5.id,
        partId: p.id,
        quantity: 1,
        status: 'PRINTED',
      })),
    })
    const order5OrderParts = await prisma.orderPart.findMany({
      where: { orderId: order5.id },
      orderBy: { partId: 'asc' },
    })

    const spoolsForJobs = await prisma.filamentSpool.findMany({
      where: { filament: { tenantId: demoTenant.id } },
      take: 4,
    })

    // Print job history: 4 printers with mix of COMPLETED and FAILED (2 completed orders with failure logs)
    const startPast = new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const endPast = new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000)

    for (let i = 0; i < 4; i++) {
      const printer = demoPrinters[i]
      const orderPart4 = order4OrderParts[i % order4OrderParts.length]
      const orderPart5 = order5OrderParts[i % order5OrderParts.length]
      const spool = spoolsForJobs[i % spoolsForJobs.length]

      await prisma.printJob.create({
        data: {
          tenantId: demoTenant.id,
          orderId: order4.id,
          partId: orderPart4.partId,
          printerId: printer.id,
          spoolId: spool.id,
          createdById: adminUser.id,
          status: 'COMPLETED',
          startTime: startPast,
          endTime: endPast,
          actualTime: 110,
          estimatedTime: 120,
        },
      })
      await prisma.printJob.create({
        data: {
          tenantId: demoTenant.id,
          orderId: order4.id,
          partId: orderPart4.partId,
          printerId: printer.id,
          spoolId: spool.id,
          createdById: adminUser.id,
          status: 'FAILED',
          failureReason: i % 2 === 0 ? 'Bed Adhesion' : 'Filament Jam',
          startTime: new Date(startPast.getTime() - 2 * 60 * 60 * 1000),
          endTime: new Date(startPast.getTime() - 1.5 * 60 * 60 * 1000),
          actualTime: 45,
          estimatedTime: 120,
        },
      })
      await prisma.printJob.create({
        data: {
          tenantId: demoTenant.id,
          orderId: order5.id,
          partId: orderPart5.partId,
          printerId: printer.id,
          spoolId: spool.id,
          createdById: adminUser.id,
          status: 'COMPLETED',
          startTime: new Date(startPast.getTime() + 24 * 60 * 60 * 1000),
          endTime: new Date(endPast.getTime() + 24 * 60 * 60 * 1000),
          actualTime: 175,
          estimatedTime: 180,
        },
      })
      if (i < 2) {
        await prisma.printJob.create({
          data: {
            tenantId: demoTenant.id,
            orderId: order5.id,
            partId: orderPart5.partId,
            printerId: printer.id,
            spoolId: spool.id,
            createdById: adminUser.id,
            status: 'FAILED',
            failureReason: i === 0 ? 'Power Loss' : 'Warping',
            startTime: new Date(startPast.getTime() + 12 * 60 * 60 * 1000),
            endTime: new Date(startPast.getTime() + 12.5 * 60 * 60 * 1000),
            actualTime: 30,
            estimatedTime: 180,
          },
        })
      }
    }

    // One active queue job for order2 (IN_PROGRESS)
    const order2Part0 = order2Parts[0]
    if (order2Part0 && spoolsForJobs[0]) {
      await prisma.printJob.create({
        data: {
          tenantId: demoTenant.id,
          orderId: order2.id,
          partId: order2Part0.partId,
          printerId: demoPrinters[0].id,
          spoolId: spoolsForJobs[0].id,
          createdById: adminUser.id,
          status: 'PRINTING',
          startTime: new Date(),
          estimatedTime: 120,
        },
      })
    }

    console.log('✅ Demo orders, print job history, and low-stock spools seeded')
  }

  console.log('✅ Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
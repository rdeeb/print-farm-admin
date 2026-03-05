const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

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
  { brand: 'Formlabs', model: 'Form 4', technology: 'SLA', buildVolumeX: 200, buildVolumeY: 125, buildVolumeZ: 210, defaultNozzle: 0, avgPowerConsumption: 100, releaseYear: 2024 },
  { brand: 'Anycubic', model: 'Photon Mono M5s', technology: 'SLA', buildVolumeX: 218, buildVolumeY: 123, buildVolumeZ: 200, defaultNozzle: 0, avgPowerConsumption: 80, releaseYear: 2023 },
  { brand: 'Elegoo', model: 'Saturn 4 Ultra', technology: 'SLA', buildVolumeX: 218, buildVolumeY: 123, buildVolumeZ: 220, defaultNozzle: 0, avgPowerConsumption: 85, releaseYear: 2024 },
  { brand: 'Formlabs', model: 'Fuse 1+ 30W', technology: 'SLS', buildVolumeX: 165, buildVolumeY: 165, buildVolumeZ: 300, defaultNozzle: 0, avgPowerConsumption: 4500, releaseYear: 2023 },
  { brand: 'Sinterit', model: 'Lisa X', technology: 'SLS', buildVolumeX: 130, buildVolumeY: 180, buildVolumeZ: 330, defaultNozzle: 0, avgPowerConsumption: 2500, releaseYear: 2022 },
]

async function main() {
  console.log('Seeding printer models...')

  for (const printerModel of printerModelsData) {
    const payload = {
      ...printerModel,
      technology: printerModel.technology || 'FDM',
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

  const count = await prisma.printerModel.count()
  console.log(`Seeded ${count} printer models`)
}

main()
  .catch((e) => {
    console.error('Error seeding printer models:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

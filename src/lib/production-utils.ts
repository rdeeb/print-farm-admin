import { prisma } from './prisma'
import { addDays } from 'date-fns'
import { getStartOfTodayUTC } from './date-utils'
import {
  getMaxOperatingCostPerHour,
  setMaxOperatingCostPerHour,
  OPERATING_HOURS_DIVISOR,
} from './printer-cost-cache'
import type {
  ProjectCostBreakdown,
  ProjectForCostCalculation,
  TenantSettingsForCost,
} from '@/model/project'

export type { ProjectCostBreakdown, ProjectForCostCalculation, TenantSettingsForCost }

export type SoftExpenseAllocations = {
  labor: number
  energy: number
  printer: number
  total: number
}

/**
 * Calculates the landed cost for a project (per completed item/unit).
 * Includes filament, labor, energy, hardware, and printer operating costs.
 */
export function calculateProjectLandedCost(
  project: ProjectForCostCalculation,
  settings: TenantSettingsForCost,
  maxPrinterPowerConsumption: number | null,
  maxMaterialCostPerUnitByColorId: Record<string, number>,
  maxPrinterOperatingCostPerHour: number
): ProjectCostBreakdown {
  // 1. Filament Cost
  const filamentCost = project.parts.reduce((sum, part) => {
    const materialUsage = part.materialUsagePerUnit ?? part.filamentWeight
    const totalUsage = materialUsage * part.quantity
    const spoolUnitCost =
      part.spool?.landedCostTotal &&
      part.spool?.capacity &&
      part.spool.capacity > 0
        ? part.spool.landedCostTotal / part.spool.capacity
        : null
    const colorId = part.filamentColorId || part.spool?.filament?.colorId
    const fallbackCostPerUnit =
      (colorId ? maxMaterialCostPerUnitByColorId[colorId] : undefined) || 0
    const costPerUnit = spoolUnitCost ?? fallbackCostPerUnit
    return sum + (totalUsage * costPerUnit)
  }, 0) * settings.filamentMultiplier

  // 2. Labor Cost (assembly time only)
  const assemblyMinutes = project.assemblyTime || 0
  const totalHours = assemblyMinutes / 60
  const laborCost = totalHours * settings.laborCostPerHour * settings.printerLaborCostMultiplier

  // 3. Energy Cost (use printer power consumption)
  const totalPrintMinutes = project.parts.reduce((sum, part) =>
    sum + ((part.printTime || 0) * part.quantity), 0)
  const printHours = totalPrintMinutes / 60
  // Use provided power consumption or default 350W
  const powerWatts = maxPrinterPowerConsumption || 350
  const energyKwh = (powerWatts * printHours) / 1000
  const energyCost = energyKwh * settings.costPerKwh

  // 4. Hardware Cost
  const hardwareCost = project.hardware.reduce((sum, ph) => {
    const unitCost = ph.hardware.packPrice / ph.hardware.packQuantity
    return sum + (unitCost * ph.quantity)
  }, 0) * settings.hardwareMultiplier

  // 5. Printer Operating Cost (print hours × highest operating cost per hour; cost/13140 per printer)
  const printerOperatingCost = printHours * maxPrinterOperatingCostPerHour

  return {
    filamentCost,
    laborCost,
    energyCost,
    hardwareCost,
    printerOperatingCost,
    totalCost: filamentCost + laborCost + energyCost + hardwareCost + printerOperatingCost,
  }
}

export function getSoftExpenseAllocations(
  cost: ProjectCostBreakdown
): SoftExpenseAllocations {
  const total = cost.laborCost + cost.energyCost + cost.printerOperatingCost
  return {
    labor: cost.laborCost,
    energy: cost.energyCost,
    printer: cost.printerOperatingCost,
    total,
  }
}

/**
 * Fetches project data and calculates landed cost.
 */
export async function calculateProjectLandedCostById(
  projectId: string,
  tenantId: string
): Promise<ProjectCostBreakdown | null> {
  const [project, settings, printers, filaments] = await Promise.all([
    prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId,
      },
      include: {
        parts: {
          include: {
            spool: {
              include: {
                filament: true,
              },
            },
          },
        },
        hardware: {
          include: {
            hardware: true,
          },
        },
      },
    }),
    prisma.tenantSettings.findUnique({
      where: { tenantId },
    }),
    prisma.printer.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      select: {
        powerConsumption: true,
        cost: true,
      },
    }),
    prisma.filament.findMany({
      where: { tenantId },
      select: {
        colorId: true,
        costPerKg: true,
        baseLandedCostPerUnit: true,
      },
    }),
  ])

  if (!project || !settings) {
    return null
  }

  // Find max power consumption among active printers
  const maxPower = printers.reduce((max, p) =>
    (p.powerConsumption || 0) > max ? (p.powerConsumption || 0) : max, 0)

  // Max printer operating cost per hour (cached): cost/13140, use highest across printers
  let maxOperatingCostPerHour = getMaxOperatingCostPerHour(tenantId)
  if (maxOperatingCostPerHour === undefined) {
    const operatingCosts = printers.map((p) => (p.cost ?? 0) / OPERATING_HOURS_DIVISOR)
    maxOperatingCostPerHour = operatingCosts.length > 0 ? Math.max(0, ...operatingCosts) : 0
    setMaxOperatingCostPerHour(tenantId, maxOperatingCostPerHour)
  }

  const maxMaterialCostPerUnitByColorId = filaments.reduce<Record<string, number>>(
    (acc, filament) => {
      const costPerUnit =
        filament.baseLandedCostPerUnit ??
        (filament.costPerKg != null ? filament.costPerKg / 1000 : 0)
      if (!acc[filament.colorId] || costPerUnit > acc[filament.colorId]) {
        acc[filament.colorId] = costPerUnit
      }
      return acc
    },
    {}
  )

  return calculateProjectLandedCost(
    project,
    {
      costPerKwh: settings.costPerKwh,
      laborCostPerHour: settings.laborCostPerHour,
      filamentMultiplier: settings.filamentMultiplier,
      printerLaborCostMultiplier: settings.printerLaborCostMultiplier,
      hardwareMultiplier: settings.hardwareMultiplier,
    },
    maxPower || null,
    maxMaterialCostPerUnitByColorId,
    maxOperatingCostPerHour
  )
}

/**
 * Calculates the energy cost for a print job based on printer power consumption and print time.
 * @param powerConsumptionWatts The printer's average power consumption in Watts
 * @param printTimeMinutes The print time in minutes
 * @param costPerKwh The cost per kWh (from tenant settings)
 * @returns The energy cost in the tenant's currency
 */
export function calculateEnergyCost(
  powerConsumptionWatts: number | null,
  printTimeMinutes: number | null,
  costPerKwh: number
): number {
  if (!powerConsumptionWatts || !printTimeMinutes || costPerKwh <= 0) {
    return 0
  }

  // Convert minutes to hours
  const printTimeHours = printTimeMinutes / 60

  // Calculate energy consumption in kWh (Power in Watts * Time in Hours / 1000)
  const energyKwh = (powerConsumptionWatts * printTimeHours) / 1000

  // Calculate cost
  return energyKwh * costPerKwh
}

/**
 * Calculates the total energy cost for a print job, fetching printer and tenant data.
 * @param printerId The printer's ID
 * @param printTimeMinutes The print time in minutes
 * @param tenantId The tenant's ID
 * @returns The energy cost or null if unable to calculate
 */
export async function calculatePrintJobEnergyCost(
  printerId: string,
  printTimeMinutes: number,
  tenantId: string
): Promise<number | null> {
  const [printer, settings] = await Promise.all([
    prisma.printer.findUnique({
      where: { id: printerId },
      select: { powerConsumption: true },
    }),
    prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: { costPerKwh: true },
    }),
  ])

  if (!printer?.powerConsumption || !settings?.costPerKwh) {
    return null
  }

  return calculateEnergyCost(
    printer.powerConsumption,
    printTimeMinutes,
    settings.costPerKwh
  )
}

/**
 * Calculates the suggested due date for a new project/order based on the current queue.
 * @param tenantId The tenant's ID
 * @param additionalMinutes The estimated print time for the new order in minutes
 * @returns The suggested due date
 */
export async function calculateSuggestedDueDate(tenantId: string, additionalMinutes: number) {
  // 1. Get tenant settings for printing hours per day
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })

  const printingHoursPerDay = settings?.printingHoursDay || 24
  const printingMinutesPerDay = printingHoursPerDay * 60

  // 2. Get all active printers for the tenant
  const activePrinters = await prisma.printer.count({
    where: {
      tenantId,
      isActive: true,
      status: { not: 'OFFLINE' },
    },
  })

  // If no printers, we can't really print, but let's assume 1 printer to avoid division by zero
  // and to provide a suggestion even if the user hasn't added printers yet.
  const effectivePrinterCount = activePrinters > 0 ? activePrinters : 1
  const totalCapacityMinutesPerDay = effectivePrinterCount * printingMinutesPerDay

  // 3. Get all pending/in-progress print jobs to calculate remaining work in the queue
  const pendingJobs = await prisma.printJob.findMany({
    where: {
      tenantId,
      status: { in: ['QUEUED', 'PRINTING'] },
    },
    select: {
      estimatedTime: true,
      actualTime: true,
      status: true,
    },
  })

  // Calculate total remaining minutes in queue
  let remainingMinutesInQueue = pendingJobs.reduce((acc, job) => {
    if (job.status === 'PRINTING') {
      // For simplicity, we assume printing jobs still need their full estimated time
      // or we could try to be more precise if we had startTime.
      return acc + (job.estimatedTime || 0)
    }
    return acc + (job.estimatedTime || 0)
  }, 0)

  // 4. Calculate how many days the current queue + new work will take
  const totalMinutes = remainingMinutesInQueue + additionalMinutes

  const capacity = totalCapacityMinutesPerDay
  const daysRequired = totalMinutes / capacity

  // 5. Calculate suggested date: Today (UTC) + daysRequired + 1 day buffer
  const todayStart = getStartOfTodayUTC()

  // Suggested date = Today UTC + Ceil(daysRequired) + 1 (buffer)
  const suggestedDate = addDays(todayStart, Math.ceil(daysRequired) + 1)

  return suggestedDate
}

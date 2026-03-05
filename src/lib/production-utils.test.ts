import { calculateProjectLandedCost, getSoftExpenseAllocations } from './production-utils'

describe('production-utils', () => {
  it('uses container landed cost override when available', () => {
    const result = calculateProjectLandedCost(
      {
        assemblyTime: 60,
        parts: [
          {
            filamentWeight: 30,
            materialUsagePerUnit: 30,
            quantity: 2,
            printTime: 120,
            filamentColorId: 'color-1',
            spool: {
              capacity: 1000,
              landedCostTotal: 80,
              filament: {
                colorId: 'color-1',
              },
            },
          },
        ],
        hardware: [],
      },
      {
        costPerKwh: 0.1,
        laborCostPerHour: 10,
        filamentMultiplier: 1,
        printerLaborCostMultiplier: 1,
        hardwareMultiplier: 1,
      },
      300,
      { 'color-1': 0.02 },
      1
    )

    // 60g at 0.08/unit from container override
    expect(result.filamentCost).toBeCloseTo(4.8, 4)
  })

  it('returns soft expense allocation from cost breakdown', () => {
    const allocations = getSoftExpenseAllocations({
      filamentCost: 1,
      laborCost: 5,
      energyCost: 2,
      hardwareCost: 3,
      printerOperatingCost: 4,
      totalCost: 15,
    })

    expect(allocations).toEqual({
      labor: 5,
      energy: 2,
      printer: 4,
      total: 11,
    })
  })
})

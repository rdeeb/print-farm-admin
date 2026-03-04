import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CostBreakdown } from '@/model/project'
import type { ProjectFormData } from '../../hooks/useProjectDetail'

interface ProjectCostCardProps {
  cost: CostBreakdown
  currency: string
  isEditing: boolean
  projectForm: ProjectFormData
  projectSalesPrice: number | null
}

export function ProjectCostCard({
  cost,
  currency,
  isEditing,
  projectForm,
  projectSalesPrice,
}: ProjectCostCardProps) {
  const salesPrice =
    isEditing && projectForm.salesPrice !== ''
      ? parseFloat(projectForm.salesPrice)
      : projectSalesPrice

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
          Cost & Earnings (per unit)
        </CardTitle>
        <CardDescription>
          Landed cost breakdown and sales price for one complete unit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <p className="text-sm text-gray-500">Filament</p>
            <p className="text-lg font-semibold">{formatCurrency(cost.filamentCost, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Labor</p>
            <p className="text-lg font-semibold">{formatCurrency(cost.laborCost, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Energy</p>
            <p className="text-lg font-semibold">{formatCurrency(cost.energyCost, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Hardware</p>
            <p className="text-lg font-semibold">{formatCurrency(cost.hardwareCost, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Printer Operating</p>
            <p className="text-lg font-semibold">
              {formatCurrency(cost.printerOperatingCost, currency)}
            </p>
          </div>
          <div className="border-l-2 border-indigo-300 pl-4">
            <p className="text-sm text-indigo-600 font-medium">Total Cost</p>
            <p className="text-2xl font-bold text-indigo-700">
              {formatCurrency(cost.totalCost, currency)}
            </p>
          </div>
        </div>
        {salesPrice != null && salesPrice > 0 && (
          <div className="mt-4 pt-4 border-t border-indigo-200 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Sales Price</p>
              <p className="text-lg font-semibold">{formatCurrency(salesPrice, currency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Earnings</p>
              <p
                className={`text-lg font-semibold ${
                  salesPrice - cost.totalCost >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(salesPrice - cost.totalCost, currency)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

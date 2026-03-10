import { Card, CardContent } from '@/components/ui/card'

interface FilamentStatsCardsProps {
  filamentCount: number
  totalSpools: number
  totalRemainingWeight: number
  lowStockFilaments: number
}

export function FilamentStatsCards({
  filamentCount,
  totalSpools,
  totalRemainingWeight,
  lowStockFilaments,
}: FilamentStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <p className="text-2xl font-bold">{filamentCount}</p>
          <p className="text-sm text-gray-500">Material Types</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-2xl font-bold">{totalSpools}</p>
          <p className="text-sm text-gray-500">Total Spools</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-2xl font-bold">
            {(totalRemainingWeight / 1000).toFixed(1)}kg
          </p>
          <p className="text-sm text-gray-500">Total Remaining</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-2xl font-bold text-yellow-600">{lowStockFilaments}</p>
          <p className="text-sm text-gray-500">Low Stock</p>
        </CardContent>
      </Card>
    </div>
  )
}

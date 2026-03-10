'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartContainer } from './ChartContainer'
import type { TimeseriesDataPoint } from '@/types/analytics'

const DEFAULT_SKELETON_BARS = 6

// Pure function — hoisted outside the component; has no closure dependencies.
function formatGrams(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)} kg`
  return `${value} g`
}

interface FilamentUsageChartProps {
  data: TimeseriesDataPoint[]
  isLoading?: boolean
}

export function FilamentUsageChart({ data, isLoading = false }: FilamentUsageChartProps) {
  const isEmpty = !isLoading && data.length === 0
  const skeletonBars = data.length > 0 ? data.length : DEFAULT_SKELETON_BARS

  return (
    <ChartContainer
      height={300}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage="No filament usage data available for this period."
      skeletonBars={skeletonBars}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatGrams}
            width={60}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
            formatter={(value: ValueType | undefined) => [
              formatGrams(typeof value === 'number' ? value : 0),
              'Filament Used',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
          />
          <Bar
            dataKey="filamentUsedGrams"
            name="Filament Used"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

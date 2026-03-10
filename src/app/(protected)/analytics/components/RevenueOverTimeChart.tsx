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

// Pure function — hoisted outside the component so it is not recreated on
// every render. Accepts `currency` as an explicit parameter since it has no
// closure dependency on component state or props.
function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

interface RevenueOverTimeChartProps {
  data: TimeseriesDataPoint[]
  isLoading?: boolean
  currency?: string
}

export function RevenueOverTimeChart({
  data,
  isLoading = false,
  currency = 'USD',
}: RevenueOverTimeChartProps) {
  const isEmpty = !isLoading && data.length === 0
  const skeletonBars = data.length > 0 ? data.length : DEFAULT_SKELETON_BARS

  return (
    <ChartContainer
      height={300}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage="No revenue data available for this period."
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
            tickFormatter={(v: number) => formatCurrency(v, currency)}
            width={70}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
            formatter={(value: ValueType | undefined) => [
              formatCurrency(typeof value === 'number' ? value : 0, currency),
              'Revenue',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
          />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

'use client'

import {
  LineChart,
  Line,
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

interface OrdersOverTimeChartProps {
  data: TimeseriesDataPoint[]
  isLoading?: boolean
}

export function OrdersOverTimeChart({ data, isLoading = false }: OrdersOverTimeChartProps) {
  const isEmpty = !isLoading && data.length === 0
  const skeletonBars = data.length > 0 ? data.length : DEFAULT_SKELETON_BARS

  return (
    <ChartContainer
      height={300}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage="No order data available for this period."
      skeletonBars={skeletonBars}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
            formatter={(value: ValueType | undefined) => [
              typeof value === 'number' ? value : 0,
              'Orders',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="ordersCount"
            name="Orders"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ r: 4, fill: '#4f46e5' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

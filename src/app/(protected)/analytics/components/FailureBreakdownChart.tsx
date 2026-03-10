'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartContainer } from './ChartContainer'

const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
]

export interface FailureDataPoint {
  reason: string
  count: number
}

interface FailureBreakdownChartProps {
  data: FailureDataPoint[]
  isLoading?: boolean
}

function renderCustomizedLabel({ name, percent }: PieLabelRenderProps) {
  if ((percent ?? 0) < 0.05) return null
  return `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
}

export function FailureBreakdownChart({ data, isLoading = false }: FailureBreakdownChartProps) {
  const isEmpty = !isLoading && data.length === 0

  return (
    <ChartContainer
      height={300}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage="No failure data available. Great job keeping those prints successful!"
      skeletonBars={6}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="reason"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={renderCustomizedLabel}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
            formatter={(value: ValueType | undefined, name: NameType | undefined) => [
              typeof value === 'number' ? value : 0,
              name ?? '',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
            formatter={(value: string) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

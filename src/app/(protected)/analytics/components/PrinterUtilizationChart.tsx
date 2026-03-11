'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartContainer } from './ChartContainer'
import type { PrinterUtilizationData } from '@/types/printer-utilization'

interface PrinterUtilizationChartProps {
  data: PrinterUtilizationData[]
  isLoading?: boolean
}

function truncateName(name: string, maxLength = 20): string {
  if (name.length <= maxLength) return name
  return name.slice(0, maxLength - 1) + '…'
}

export function PrinterUtilizationChart({
  data,
  isLoading = false,
}: PrinterUtilizationChartProps) {
  const isEmpty = !isLoading && data.length === 0

  const chartData = data.map((d) => ({
    name: truncateName(d.printerName),
    totalHours: d.totalHours,
  }))

  // Estimate chart height: at least 200px, 48px per bar
  const chartHeight = Math.max(200, chartData.length * 48)

  return (
    <ChartContainer
      height={chartHeight}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage="No utilization data"
      skeletonBars={5}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value: number) => `${value.toFixed(1)}h`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
            formatter={(value: ValueType | undefined) => [
              `${typeof value === 'number' ? value.toFixed(1) : '0.0'} hrs`,
              'Total Hours',
            ]}
          />
          <Bar
            dataKey="totalHours"
            name="Total Hours"
            fill="#6366f1"
            radius={[0, 4, 4, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

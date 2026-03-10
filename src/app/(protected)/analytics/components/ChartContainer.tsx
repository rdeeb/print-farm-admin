'use client'

import * as React from 'react'
import { BarChart3 } from 'lucide-react'

export interface ChartContainerProps {
  /** Height of the chart area in pixels (default: 300) */
  height?: number
  /** Whether data is still loading */
  isLoading?: boolean
  /** Whether the dataset is empty */
  isEmpty?: boolean
  /** Message to show when data is empty */
  emptyMessage?: string
  /** Number of skeleton bars to render while loading (default: 6) */
  skeletonBars?: number
  children: React.ReactNode
}

/**
 * Shared wrapper for all analytics chart components.
 * Handles loading skeleton, empty state, and consistent sizing.
 */
export function ChartContainer({
  height = 300,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available for this period.',
  skeletonBars = 6,
  children,
}: ChartContainerProps) {
  if (isLoading) {
    return (
      <div
        className="w-full animate-pulse rounded-lg bg-gray-100"
        style={{ height }}
        role="status"
        aria-label="Loading chart"
      >
        <div className="flex h-full items-end gap-2 p-4">
          {Array.from({ length: skeletonBars }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded bg-gray-200"
              style={{ height: `${30 + ((i * 17) % 55)}%` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-lg bg-gray-50"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height }}>
      {children}
    </div>
  )
}

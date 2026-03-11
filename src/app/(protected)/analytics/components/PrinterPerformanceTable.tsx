'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { PrinterUtilizationData } from '@/types/printer-utilization'

type SortKey = keyof Pick<
  PrinterUtilizationData,
  'printerName' | 'totalJobs' | 'successRate' | 'totalHours' | 'avgJobMinutes'
>

type SortDirection = 'asc' | 'desc'

interface PrinterPerformanceTableProps {
  data: PrinterUtilizationData[]
}

const COLUMNS: { label: string; key: SortKey; align: 'left' | 'right' }[] = [
  { label: 'Printer Name', key: 'printerName', align: 'left' },
  { label: 'Total Jobs', key: 'totalJobs', align: 'right' },
  { label: 'Success Rate', key: 'successRate', align: 'right' },
  { label: 'Total Hours', key: 'totalHours', align: 'right' },
  { label: 'Avg Job Duration', key: 'avgJobMinutes', align: 'right' },
]

function SortIcon({
  columnKey,
  sortKey,
  sortDir,
}: {
  columnKey: SortKey
  sortKey: SortKey
  sortDir: SortDirection
}) {
  if (columnKey !== sortKey) {
    return <ChevronsUpDown className="h-3 w-3 text-gray-400" />
  }
  return sortDir === 'asc' ? (
    <ChevronUp className="h-3 w-3 text-gray-700" />
  ) : (
    <ChevronDown className="h-3 w-3 text-gray-700" />
  )
}

export function PrinterPerformanceTable({ data }: PrinterPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalHours')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    const aNum = (aVal as number) ?? 0
    const bNum = (bVal as number) ?? 0
    return sortDir === 'asc' ? aNum - bNum : bNum - aNum
  })

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 rounded-lg bg-gray-50 text-sm text-gray-500">
        No printer data available.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-medium text-gray-600 cursor-pointer select-none whitespace-nowrap ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
                onClick={() => handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.align === 'right' && (
                    <SortIcon columnKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                  )}
                  {col.label}
                  {col.align === 'left' && (
                    <SortIcon columnKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => {
            const isZero = row.totalJobs === 0
            return (
              <tr
                key={row.printerId}
                className={`border-b border-gray-100 last:border-0 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                } hover:bg-indigo-50/40 transition-colors`}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{row.printerName}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {isZero ? '—' : row.totalJobs}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {isZero ? '—' : `${(row.successRate * 100).toFixed(1)}%`}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {isZero ? '—' : `${row.totalHours.toFixed(1)} h`}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {isZero || row.avgJobMinutes === 0 ? '—' : `${row.avgJobMinutes} min`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

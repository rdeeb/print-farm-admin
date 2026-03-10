import { render, screen } from '@testing-library/react'
import { FilamentUsageChart } from './FilamentUsageChart'
import type { TimeseriesDataPoint } from '@/types/analytics'

// recharts uses ResizeObserver and SVG APIs not available in jsdom — stub them out
jest.mock('recharts', () => {
  const React = require('react')
  return {
    BarChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'bar-chart' }, children),
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  }
})

const SAMPLE_DATA: TimeseriesDataPoint[] = [
  { month: 'Jan 2025', monthKey: '2025-01', ordersCount: 5, revenue: 500, filamentUsedGrams: 1200 },
  { month: 'Feb 2025', monthKey: '2025-02', ordersCount: 3, revenue: 300, filamentUsedGrams: 800 },
  { month: 'Mar 2025', monthKey: '2025-03', ordersCount: 8, revenue: 900, filamentUsedGrams: 2500.5 },
]

describe('FilamentUsageChart', () => {
  it('renders without crashing given sample data', () => {
    const { container } = render(<FilamentUsageChart data={SAMPLE_DATA} />)
    expect(container).toBeTruthy()
  })

  it('renders a recharts BarChart when data is provided', () => {
    render(<FilamentUsageChart data={SAMPLE_DATA} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('shows the loading skeleton when isLoading is true', () => {
    render(<FilamentUsageChart data={[]} isLoading={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading chart')).toBeInTheDocument()
  })

  it('does not show chart when isLoading is true', () => {
    render(<FilamentUsageChart data={SAMPLE_DATA} isLoading={true} />)
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('shows empty state when data is empty array and not loading', () => {
    render(<FilamentUsageChart data={[]} isLoading={false} />)
    expect(screen.getByText('No filament usage data available for this period.')).toBeInTheDocument()
  })

  it('does not show empty state when data is present', () => {
    render(<FilamentUsageChart data={SAMPLE_DATA} isLoading={false} />)
    expect(screen.queryByText('No filament usage data available for this period.')).not.toBeInTheDocument()
  })

  it('defaults isLoading to false', () => {
    render(<FilamentUsageChart data={SAMPLE_DATA} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders without crashing with zero filament values', () => {
    const zeroData: TimeseriesDataPoint[] = [
      { month: 'Jan 2025', monthKey: '2025-01', ordersCount: 0, revenue: 0, filamentUsedGrams: 0 },
    ]
    render(<FilamentUsageChart data={zeroData} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders without crashing with large filament values (kg range)', () => {
    const largeData: TimeseriesDataPoint[] = [
      { month: 'Jan 2025', monthKey: '2025-01', ordersCount: 50, revenue: 5000, filamentUsedGrams: 12500 },
      { month: 'Feb 2025', monthKey: '2025-02', ordersCount: 40, revenue: 4000, filamentUsedGrams: 9800 },
    ]
    render(<FilamentUsageChart data={largeData} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders without crashing with a single data point', () => {
    const singlePoint: TimeseriesDataPoint[] = [
      { month: 'Jun 2025', monthKey: '2025-06', ordersCount: 2, revenue: 200, filamentUsedGrams: 450 },
    ]
    render(<FilamentUsageChart data={singlePoint} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })
})

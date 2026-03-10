import { render, screen } from '@testing-library/react'
import { OrdersOverTimeChart } from './OrdersOverTimeChart'
import type { TimeseriesDataPoint } from '@/types/analytics'

// recharts uses ResizeObserver and SVG APIs not available in jsdom — stub them out
jest.mock('recharts', () => {
  const React = require('react')
  return {
    LineChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'line-chart' }, children),
    Line: () => null,
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
  { month: 'Mar 2025', monthKey: '2025-03', ordersCount: 8, revenue: 900, filamentUsedGrams: 2000 },
]

describe('OrdersOverTimeChart', () => {
  it('renders without crashing given sample data', () => {
    const { container } = render(<OrdersOverTimeChart data={SAMPLE_DATA} />)
    expect(container).toBeTruthy()
  })

  it('renders a recharts LineChart when data is provided', () => {
    render(<OrdersOverTimeChart data={SAMPLE_DATA} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('shows the loading skeleton when isLoading is true', () => {
    render(<OrdersOverTimeChart data={[]} isLoading={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading chart')).toBeInTheDocument()
  })

  it('does not show chart when isLoading is true', () => {
    render(<OrdersOverTimeChart data={SAMPLE_DATA} isLoading={true} />)
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('shows empty state when data is empty array and not loading', () => {
    render(<OrdersOverTimeChart data={[]} isLoading={false} />)
    expect(screen.getByText('No order data available for this period.')).toBeInTheDocument()
  })

  it('does not show empty state when data is present', () => {
    render(<OrdersOverTimeChart data={SAMPLE_DATA} isLoading={false} />)
    expect(screen.queryByText('No order data available for this period.')).not.toBeInTheDocument()
  })

  it('defaults isLoading to false', () => {
    render(<OrdersOverTimeChart data={SAMPLE_DATA} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders without crashing with a single data point', () => {
    const singlePoint: TimeseriesDataPoint[] = [
      { month: 'Jan 2025', monthKey: '2025-01', ordersCount: 1, revenue: 100, filamentUsedGrams: 50 },
    ]
    const { container } = render(<OrdersOverTimeChart data={singlePoint} />)
    expect(container).toBeTruthy()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders without crashing with all-zero values', () => {
    const zeroData: TimeseriesDataPoint[] = [
      { month: 'Jan 2025', monthKey: '2025-01', ordersCount: 0, revenue: 0, filamentUsedGrams: 0 },
      { month: 'Feb 2025', monthKey: '2025-02', ordersCount: 0, revenue: 0, filamentUsedGrams: 0 },
    ]
    render(<OrdersOverTimeChart data={zeroData} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })
})

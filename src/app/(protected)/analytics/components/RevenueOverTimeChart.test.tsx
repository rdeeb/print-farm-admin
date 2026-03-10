import { render, screen } from '@testing-library/react'
import { RevenueOverTimeChart } from './RevenueOverTimeChart'
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
  { month: 'Jan 2025', monthKey: '2025-01', ordersCount: 5, revenue: 1500.0, filamentUsedGrams: 1200 },
  { month: 'Feb 2025', monthKey: '2025-02', ordersCount: 3, revenue: 800.5, filamentUsedGrams: 800 },
  { month: 'Mar 2025', monthKey: '2025-03', ordersCount: 8, revenue: 2200.75, filamentUsedGrams: 2000 },
]

describe('RevenueOverTimeChart', () => {
  it('renders without crashing given sample data', () => {
    const { container } = render(<RevenueOverTimeChart data={SAMPLE_DATA} />)
    expect(container).toBeTruthy()
  })

  it('renders a recharts BarChart when data is provided', () => {
    render(<RevenueOverTimeChart data={SAMPLE_DATA} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('shows the loading skeleton when isLoading is true', () => {
    render(<RevenueOverTimeChart data={[]} isLoading={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading chart')).toBeInTheDocument()
  })

  it('does not show chart when isLoading is true', () => {
    render(<RevenueOverTimeChart data={SAMPLE_DATA} isLoading={true} />)
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('shows empty state when data is empty array and not loading', () => {
    render(<RevenueOverTimeChart data={[]} isLoading={false} />)
    expect(screen.getByText('No revenue data available for this period.')).toBeInTheDocument()
  })

  it('does not show empty state when data is present', () => {
    render(<RevenueOverTimeChart data={SAMPLE_DATA} isLoading={false} />)
    expect(screen.queryByText('No revenue data available for this period.')).not.toBeInTheDocument()
  })

  it('defaults isLoading to false', () => {
    render(<RevenueOverTimeChart data={SAMPLE_DATA} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('accepts an optional currency prop without crashing', () => {
    const { container } = render(<RevenueOverTimeChart data={SAMPLE_DATA} currency="EUR" />)
    expect(container).toBeTruthy()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('defaults currency to USD when not provided', () => {
    // Component should render without error using the USD default
    const { container } = render(<RevenueOverTimeChart data={SAMPLE_DATA} />)
    expect(container).toBeTruthy()
  })

  it('renders without crashing with zero revenue values', () => {
    const zeroRevenue: TimeseriesDataPoint[] = [
      { month: 'Jan 2025', monthKey: '2025-01', ordersCount: 0, revenue: 0, filamentUsedGrams: 0 },
    ]
    render(<RevenueOverTimeChart data={zeroRevenue} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders without crashing with a single data point', () => {
    const singlePoint: TimeseriesDataPoint[] = [
      { month: 'Jun 2025', monthKey: '2025-06', ordersCount: 2, revenue: 750, filamentUsedGrams: 400 },
    ]
    render(<RevenueOverTimeChart data={singlePoint} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })
})

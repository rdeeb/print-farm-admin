import { render, screen } from '@testing-library/react'
import { ChartContainer } from './ChartContainer'

describe('ChartContainer', () => {
  describe('loading state', () => {
    it('renders a loading skeleton when isLoading is true', () => {
      render(
        <ChartContainer isLoading={true}>
          <div>chart content</div>
        </ChartContainer>
      )
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading chart')).toBeInTheDocument()
    })

    it('does not render children when isLoading is true', () => {
      render(
        <ChartContainer isLoading={true}>
          <div>chart content</div>
        </ChartContainer>
      )
      expect(screen.queryByText('chart content')).not.toBeInTheDocument()
    })

    it('renders the correct number of skeleton bars (default 6)', () => {
      const { container } = render(
        <ChartContainer isLoading={true}>
          <div>chart</div>
        </ChartContainer>
      )
      // The inner flex container holds one div per skeleton bar
      const skeletonWrapper = container.querySelector('.flex.h-full')
      expect(skeletonWrapper?.children).toHaveLength(6)
    })

    it('renders the specified number of skeleton bars via skeletonBars prop', () => {
      const { container } = render(
        <ChartContainer isLoading={true} skeletonBars={3}>
          <div>chart</div>
        </ChartContainer>
      )
      const skeletonWrapper = container.querySelector('.flex.h-full')
      expect(skeletonWrapper?.children).toHaveLength(3)
    })

    it('applies the height style to the skeleton container', () => {
      const { container } = render(
        <ChartContainer isLoading={true} height={400}>
          <div>chart</div>
        </ChartContainer>
      )
      const skeleton = container.firstElementChild as HTMLElement
      expect(skeleton.style.height).toBe('400px')
    })
  })

  describe('empty state', () => {
    it('renders the default empty message when isEmpty is true', () => {
      render(
        <ChartContainer isEmpty={true}>
          <div>chart content</div>
        </ChartContainer>
      )
      expect(screen.getByText('No data available for this period.')).toBeInTheDocument()
    })

    it('renders a custom empty message', () => {
      render(
        <ChartContainer isEmpty={true} emptyMessage="Nothing to show here.">
          <div>chart content</div>
        </ChartContainer>
      )
      expect(screen.getByText('Nothing to show here.')).toBeInTheDocument()
    })

    it('does not render children when isEmpty is true', () => {
      render(
        <ChartContainer isEmpty={true}>
          <div>chart content</div>
        </ChartContainer>
      )
      expect(screen.queryByText('chart content')).not.toBeInTheDocument()
    })

    it('applies the height style to the empty container', () => {
      const { container } = render(
        <ChartContainer isEmpty={true} height={250}>
          <div>chart</div>
        </ChartContainer>
      )
      const emptyContainer = container.firstElementChild as HTMLElement
      expect(emptyContainer.style.height).toBe('250px')
    })
  })

  describe('data present state', () => {
    it('renders children when neither isLoading nor isEmpty', () => {
      render(
        <ChartContainer>
          <div>chart content</div>
        </ChartContainer>
      )
      expect(screen.getByText('chart content')).toBeInTheDocument()
    })

    it('does not show the loading skeleton when data is present', () => {
      render(
        <ChartContainer>
          <div>chart content</div>
        </ChartContainer>
      )
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('does not show the empty state when data is present', () => {
      render(
        <ChartContainer>
          <div>chart content</div>
        </ChartContainer>
      )
      expect(screen.queryByText('No data available for this period.')).not.toBeInTheDocument()
    })

    it('wraps children in a div with the configured height', () => {
      const { container } = render(
        <ChartContainer height={350}>
          <div>chart</div>
        </ChartContainer>
      )
      const wrapper = container.firstElementChild as HTMLElement
      expect(wrapper.style.height).toBe('350px')
    })

    it('uses the default height of 300px when no height prop is provided', () => {
      const { container } = render(
        <ChartContainer>
          <div>chart</div>
        </ChartContainer>
      )
      const wrapper = container.firstElementChild as HTMLElement
      expect(wrapper.style.height).toBe('300px')
    })
  })

  describe('isLoading takes priority over isEmpty', () => {
    it('shows loading skeleton when both isLoading and isEmpty are true', () => {
      render(
        <ChartContainer isLoading={true} isEmpty={true}>
          <div>chart content</div>
        </ChartContainer>
      )
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.queryByText('No data available for this period.')).not.toBeInTheDocument()
    })
  })
})

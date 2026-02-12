import { render, screen } from '@testing-library/react'
import { Label } from './label'

describe('Label', () => {
  it('renders correctly with children', () => {
    render(<Label>Test Label</Label>)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<Label data-testid="label">Label</Label>)
    const label = screen.getByTestId('label')
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none')
  })

  it('applies custom className', () => {
    render(<Label className="custom-class" data-testid="label">Label</Label>)
    const label = screen.getByTestId('label')
    expect(label).toHaveClass('custom-class')
  })

  it('associates with input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Test Label</Label>
        <input id="test-input" />
      </>
    )
    const label = screen.getByText('Test Label')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Label ref={ref}>Label</Label>)
    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
  })

  it('passes through additional props', () => {
    render(<Label data-testid="test-label" aria-describedby="desc">Label</Label>)
    const label = screen.getByTestId('test-label')
    expect(label).toHaveAttribute('aria-describedby', 'desc')
  })

  it('renders as a label element', () => {
    render(<Label>Label Text</Label>)
    const label = screen.getByText('Label Text')
    expect(label.tagName).toBe('LABEL')
  })
})

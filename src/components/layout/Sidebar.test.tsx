import { render, screen } from '@testing-library/react'
import { Sidebar } from './Sidebar'

// Note: useSession and usePathname are mocked globally in jest.setup.js
// The mock provides an ADMIN user with name "Test User" and tenant "Test Tenant"
// pathname is mocked to return '/dashboard'

describe('Sidebar', () => {
  it('renders correctly', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('displays tenant name from session', () => {
    render(<Sidebar />)
    expect(screen.getByText('Test Tenant')).toBeInTheDocument()
  })

  it('displays user role from session', () => {
    render(<Sidebar />)
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('displays user name initial in avatar', () => {
    render(<Sidebar />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('displays user name', () => {
    render(<Sidebar />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('displays user email', () => {
    render(<Sidebar />)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders all navigation items for admin user', () => {
    render(<Sidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Print Queue')).toBeInTheDocument()
    expect(screen.getByText('Printers')).toBeInTheDocument()
    expect(screen.getByText('Materials')).toBeInTheDocument()
    expect(screen.getByText('Inventory')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('highlights active navigation item (Dashboard)', () => {
    // usePathname is mocked to return '/dashboard'
    render(<Sidebar />)

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('bg-gray-900')
  })

  it('does not highlight inactive navigation items', () => {
    render(<Sidebar />)

    const ordersLink = screen.getByText('Orders').closest('a')
    expect(ordersLink).not.toHaveClass('bg-gray-900')
    expect(ordersLink).toHaveClass('text-gray-300')
  })

  it('navigation links have correct hrefs', () => {
    render(<Sidebar />)

    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard')
    expect(screen.getByText('Orders').closest('a')).toHaveAttribute('href', '/orders')
    expect(screen.getByText('Projects').closest('a')).toHaveAttribute('href', '/projects')
    expect(screen.getByText('Print Queue').closest('a')).toHaveAttribute('href', '/queue')
    expect(screen.getByText('Printers').closest('a')).toHaveAttribute('href', '/printers')
    expect(screen.getByText('Materials').closest('a')).toHaveAttribute('href', '/filament')
    expect(screen.getByText('Inventory').closest('a')).toHaveAttribute('href', '/inventory')
    expect(screen.getByText('Analytics').closest('a')).toHaveAttribute('href', '/analytics')
    expect(screen.getByText('Calendar').closest('a')).toHaveAttribute('href', '/calendar')
    expect(screen.getByText('Users').closest('a')).toHaveAttribute('href', '/users')
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/settings')
  })

  it('renders navigation icons', () => {
    render(<Sidebar />)

    // Check that SVG icons are rendered for each nav item
    const navItems = screen.getAllByRole('link')
    navItems.forEach((link) => {
      const svg = link.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  it('renders user section at bottom', () => {
    render(<Sidebar />)

    // User section should have avatar, name, and email
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })
})

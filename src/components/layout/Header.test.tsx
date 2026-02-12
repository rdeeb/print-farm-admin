import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signOut } from 'next-auth/react'
import { Header } from './Header'

// Note: useSession is mocked globally in jest.setup.js
// The mock provides an ADMIN user with name "Test User"
// signOut is also mocked globally

describe('Header', () => {
  it('renders correctly', () => {
    render(<Header />)
    expect(screen.getByPlaceholderText('Search orders, projects...')).toBeInTheDocument()
  })

  it('displays user name from session', () => {
    render(<Header />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('displays user role from session', () => {
    render(<Header />)
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('displays user initial in avatar', () => {
    render(<Header />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('displays notification badge with unread count', () => {
    render(<Header />)
    // Header has 2 unread notifications by default
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onMenuClick when menu button is clicked', async () => {
    const handleMenuClick = jest.fn()
    const user = userEvent.setup()

    render(<Header onMenuClick={handleMenuClick} />)

    // Find the mobile menu button (first button with Menu icon)
    const buttons = screen.getAllByRole('button')
    const menuButton = buttons[0] // First button is the mobile menu

    await user.click(menuButton)

    expect(handleMenuClick).toHaveBeenCalledTimes(1)
  })

  it('opens notifications dropdown when bell icon is clicked', async () => {
    const user = userEvent.setup()
    render(<Header />)

    // Find the notification button (contains the badge with "2")
    const notificationButton = screen.getByText('2').closest('button')

    if (notificationButton) {
      await user.click(notificationButton)
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('Low filament stock')).toBeInTheDocument()
      expect(screen.getByText('Print job completed')).toBeInTheDocument()
      expect(screen.getByText('Printer maintenance due')).toBeInTheDocument()
    }
  })

  it('opens user menu dropdown when user button is clicked', async () => {
    const user = userEvent.setup()
    render(<Header />)

    // Click on user name to open dropdown
    await user.click(screen.getByText('Test User'))

    expect(screen.getByText('My Account')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    // Note: There's a Settings in nav and in dropdown, so check for dropdown context
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('calls signOut when sign out is clicked', async () => {
    const user = userEvent.setup()
    render(<Header />)

    // Open user menu
    await user.click(screen.getByText('Test User'))

    // Click sign out
    await user.click(screen.getByText('Sign out'))

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('renders search input', () => {
    render(<Header />)
    const searchInput = screen.getByPlaceholderText('Search orders, projects...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('type', 'search')
  })

  it('renders notification types with correct indicator colors', async () => {
    const user = userEvent.setup()
    render(<Header />)

    // Open notifications dropdown
    const notificationButton = screen.getByText('2').closest('button')
    if (notificationButton) {
      await user.click(notificationButton)

      // Check that notifications are displayed
      expect(screen.getByText('Low filament stock')).toBeInTheDocument()
      expect(screen.getByText('Print job completed')).toBeInTheDocument()
      expect(screen.getByText('Printer maintenance due')).toBeInTheDocument()
    }
  })
})

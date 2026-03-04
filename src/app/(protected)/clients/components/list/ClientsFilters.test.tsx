import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientsFilters } from './ClientsFilters'

describe('ClientsFilters', () => {
  it('renders search input with placeholder', () => {
    render(
      <ClientsFilters
        searchTerm=""
        onSearchChange={jest.fn()}
        filterSource=""
        onFilterSourceChange={jest.fn()}
      />
    )
    expect(
      screen.getByPlaceholderText('Search clients...')
    ).toBeInTheDocument()
  })

  it('calls onSearchChange when user types in search', async () => {
    const onSearchChange = jest.fn()
    const user = userEvent.setup()

    render(
      <ClientsFilters
        searchTerm=""
        onSearchChange={onSearchChange}
        filterSource=""
        onFilterSourceChange={jest.fn()}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search clients...')
    await user.type(searchInput, 'John')

    expect(onSearchChange).toHaveBeenCalled()
  })

  it('displays current search term', () => {
    render(
      <ClientsFilters
        searchTerm="existing"
        onSearchChange={jest.fn()}
        filterSource=""
        onFilterSourceChange={jest.fn()}
      />
    )
    expect(screen.getByDisplayValue('existing')).toBeInTheDocument()
  })

  it('renders source filter select', () => {
    render(
      <ClientsFilters
        searchTerm=""
        onSearchChange={jest.fn()}
        filterSource=""
        onFilterSourceChange={jest.fn()}
      />
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})

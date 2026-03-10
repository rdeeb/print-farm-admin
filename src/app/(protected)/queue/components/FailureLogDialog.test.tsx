/**
 * FailureLogDialog tests
 *
 * The Radix UI Select component does not work in jsdom (no pointer events,
 * no ResizeObserver), so we mock @/components/ui/select with a plain <select>
 * element that still calls the onValueChange prop. The Dialog and Textarea are
 * left un-mocked — they work fine in jsdom.
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FailureLogDialog } from './FailureLogDialog'

// ---------------------------------------------------------------------------
// Mock Radix-based Select with a native <select> so we can fire change events
// ---------------------------------------------------------------------------
jest.mock('@/components/ui/select', () => {
  const React = require('react')

  function Select({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (v: string) => void
    children: React.ReactNode
  }) {
    return (
      <select
        data-testid="mock-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="">Select a reason...</option>
        {children}
      </select>
    )
  }

  function SelectTrigger({ children }: { children?: React.ReactNode }) {
    return React.createElement(React.Fragment, null, children)
  }
  function SelectValue({ placeholder }: { placeholder?: string }) {
    return React.createElement('span', null, placeholder ?? '')
  }
  function SelectContent({ children }: { children?: React.ReactNode }) {
    return React.createElement(React.Fragment, null, children)
  }
  function SelectItem({
    value,
    children,
  }: {
    value: string
    children: React.ReactNode
  }) {
    return React.createElement('option', { value }, children)
  }

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EXPECTED_REASONS = [
  'Filament Jam',
  'Bed Adhesion',
  'Power Loss',
  'File Error',
  'Stringing',
  'Warping',
  'Operator Error',
  'Other',
]

function renderDialog(overrides: Partial<React.ComponentProps<typeof FailureLogDialog>> = {}) {
  const onOpenChange = jest.fn()
  const onSuccess = jest.fn()

  render(
    <FailureLogDialog
      open={true}
      onOpenChange={onOpenChange}
      jobId="job-1"
      onSuccess={onSuccess}
      {...overrides}
    />
  )

  return { onOpenChange, onSuccess }
}

// Mock global fetch
const mockFetch = jest.fn()
beforeAll(() => {
  global.fetch = mockFetch
})

beforeEach(() => {
  mockFetch.mockReset()
})

afterEach(() => {
  jest.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FailureLogDialog', () => {
  describe('rendering', () => {
    it('renders the dialog title', () => {
      renderDialog()
      expect(screen.getByText('Mark Job as Failed')).toBeInTheDocument()
    })

    it('renders all expected failure reason options', () => {
      renderDialog()

      for (const reason of EXPECTED_REASONS) {
        expect(screen.getByRole('option', { name: reason })).toBeInTheDocument()
      }
    })

    it('renders the failure reason select', () => {
      renderDialog()
      expect(screen.getByTestId('mock-select')).toBeInTheDocument()
    })

    it('renders the notes textarea', () => {
      renderDialog()
      expect(screen.getByPlaceholderText(/describe what went wrong/i)).toBeInTheDocument()
    })

    it('renders Cancel and Mark as Failed buttons', () => {
      renderDialog()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /mark as failed/i })).toBeInTheDocument()
    })
  })

  describe('submit button disabled state', () => {
    it('disables submit button when no reason is selected', () => {
      renderDialog()
      const submitBtn = screen.getByRole('button', { name: /mark as failed/i })
      expect(submitBtn).toBeDisabled()
    })

    it('enables submit button after a reason is selected', async () => {
      const user = userEvent.setup()
      renderDialog()

      const select = screen.getByTestId('mock-select')
      await user.selectOptions(select, 'Filament Jam')

      expect(screen.getByRole('button', { name: /mark as failed/i })).not.toBeDisabled()
    })
  })

  const okResponse = () => ({ ok: true, status: 200, json: async () => ({ success: true }) })
  const errResponse = (msg: string) => ({ ok: false, status: 400, json: async () => ({ error: msg }) })

  describe('form submission', () => {
    it('sends failureReason as a separate body field', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue(okResponse())
      renderDialog()

      const select = screen.getByTestId('mock-select')
      await user.selectOptions(select, 'Bed Adhesion')

      await user.click(screen.getByRole('button', { name: /mark as failed/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/queue/job-1',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('"failureReason":"Bed Adhesion"'),
          })
        )
      })
    })

    it('sends failureNotes as a separate body field when notes are entered', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue(okResponse())
      renderDialog()

      const select = screen.getByTestId('mock-select')
      await user.selectOptions(select, 'Warping')

      const textarea = screen.getByPlaceholderText(/describe what went wrong/i)
      await user.type(textarea, 'First layer lifted in the corner')

      await user.click(screen.getByRole('button', { name: /mark as failed/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/queue/job-1',
          expect.objectContaining({
            body: expect.stringContaining('"failureNotes":"First layer lifted in the corner"'),
          })
        )
      })
    })

    it('sends status: FAILED in the body', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue(okResponse())
      renderDialog()

      const select = screen.getByTestId('mock-select')
      await user.selectOptions(select, 'Other')

      await user.click(screen.getByRole('button', { name: /mark as failed/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/queue/job-1',
          expect.objectContaining({
            body: expect.stringContaining('"status":"FAILED"'),
          })
        )
      })
    })

    it('calls onSuccess after a successful submission', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue(okResponse())
      const { onSuccess } = renderDialog()

      const select = screen.getByTestId('mock-select')
      await user.selectOptions(select, 'Power Loss')

      await user.click(screen.getByRole('button', { name: /mark as failed/i }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1)
      })
    })

    it('shows an error message when the API returns a non-ok response', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue(
        errResponse('Only queued or printing jobs can be marked as failed')
      )
      renderDialog()

      const select = screen.getByTestId('mock-select')
      await user.selectOptions(select, 'Other')

      await user.click(screen.getByRole('button', { name: /mark as failed/i }))

      await waitFor(() => {
        expect(
          screen.getByText('Only queued or printing jobs can be marked as failed')
        ).toBeInTheDocument()
      })
    })

    it('omits failureNotes key when the notes textarea is left empty', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue(okResponse())
      renderDialog()

      const select = screen.getByTestId('mock-select')
      await user.selectOptions(select, 'File Error')

      // Notes textarea left empty
      await user.click(screen.getByRole('button', { name: /mark as failed/i }))

      await waitFor(() => {
        const call = mockFetch.mock.calls[0]
        const body = JSON.parse(call[1].body as string) as Record<string, unknown>
        // Whitespace-trimmed empty notes should be omitted
        expect(body).not.toHaveProperty('failureNotes')
      })
    })
  })

  describe('dialog close behaviour', () => {
    it('calls onOpenChange(false) when Cancel is clicked', async () => {
      const user = userEvent.setup()
      const { onOpenChange } = renderDialog()

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})

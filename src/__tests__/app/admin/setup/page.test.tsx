/**
 * Admin Setup Page Tests
 * Comprehensive tests for the setup wizard
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import AdminSetupPage from '@/app/admin/setup/page'
import { ToastProvider } from '@/components/Toast'
import '@testing-library/jest-dom'

// Mock the router
const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    query: {},
    pathname: '/admin/setup',
  }),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
)

describe('AdminSetupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()

    // Mock the setup status API call that happens on component mount
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isConfigured: false })
    })
  })

  it('should render the setup wizard', () => {
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )

    expect(screen.getByText('Portfolio Setup')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument()
  })

  it('should show step 1 (Personal Information) initially', () => {
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/professional title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()

    // Mock the setup status API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isConfigured: false })
    })

    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/professional title is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
  })

  it('should proceed to step 2 when step 1 is valid', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )

    // Fill in required fields
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/professional title/i), 'Developer')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Social Links')).toBeInTheDocument()
    })
  })

  it('should allow navigation back to previous step', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )
    
    // Go to step 2
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/professional title/i), 'Developer')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.click(screen.getByRole('button', { name: /next/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Social Links')).toBeInTheDocument()
    })
    
    // Go back to step 1
    const previousButton = screen.getByRole('button', { name: /previous/i })
    await user.click(previousButton)
    
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument()
    })
    
    // Verify data is preserved
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Developer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
  })

  it('should handle social links step', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )
    
    // Navigate to step 2
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/professional title/i), 'Developer')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.click(screen.getByRole('button', { name: /next/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Social Links')).toBeInTheDocument()
    })
    
    // Fill in social links (optional)
    const githubInput = screen.getByLabelText(/github/i)
    await user.type(githubInput, 'https://github.com/johndoe')
    
    const linkedinInput = screen.getByLabelText(/linkedin/i)
    await user.type(linkedinInput, 'https://linkedin.com/in/johndoe')
    
    // Proceed to next step
    await user.click(screen.getByRole('button', { name: /next/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Features')).toBeInTheDocument()
    })
  })

  it('should handle features configuration', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )
    
    // Navigate to step 3
    await navigateToStep(user, 3)
    
    await waitFor(() => {
      expect(screen.getByText('Features')).toBeInTheDocument()
    })
    
    // Toggle features
    const aiToggle = screen.getByLabelText(/ai content generation/i)
    await user.click(aiToggle)
    
    const analyticsToggle = screen.getByLabelText(/analytics/i)
    await user.click(analyticsToggle)
    
    const pwaToggle = screen.getByLabelText(/progressive web app/i)
    await user.click(pwaToggle)
    
    // Proceed to next step
    await user.click(screen.getByRole('button', { name: /next/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Theme')).toBeInTheDocument()
    })
  })

  it('should handle theme configuration', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )
    
    // Navigate to step 4
    await navigateToStep(user, 4)
    
    await waitFor(() => {
      expect(screen.getByText('Theme')).toBeInTheDocument()
    })
    
    // Select theme
    const themeSelect = screen.getByLabelText(/theme/i)
    await user.selectOptions(themeSelect, 'dark')
    
    // Select color mode
    const colorModeSelect = screen.getByLabelText(/color mode/i)
    await user.selectOptions(colorModeSelect, 'dark')
    
    // Proceed to final step
    await user.click(screen.getByRole('button', { name: /next/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
  })

  it('should complete setup successfully', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })
    
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )

    // Navigate to final step
    await navigateToStep(user, 5)
    
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
    
    // Complete setup
    const completeButton = screen.getByRole('button', { name: /complete setup/i })
    await user.click(completeButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('John Doe'),
      })
    })
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  it('should handle setup errors', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Setup failed' }),
    })
    
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )

    // Navigate to final step and complete
    await navigateToStep(user, 5)
    
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
    
    const completeButton = screen.getByRole('button', { name: /complete setup/i })
    await user.click(completeButton)
    
    await waitFor(() => {
      expect(screen.getByText(/setup failed/i)).toBeInTheDocument()
    })
  })

  it('should show progress indicator', () => {
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('aria-valuenow', '20') // Step 1 of 5
  })

  it('should update progress as user advances', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )
    
    // Navigate to step 2
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/professional title/i), 'Developer')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.click(screen.getByRole('button', { name: /next/i }))
    
    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '40') // Step 2 of 5
    })
  })

  it('should handle network errors during setup', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(
      <TestWrapper>
        <AdminSetupPage />
      </TestWrapper>
    )

    // Navigate to final step and complete
    await navigateToStep(user, 5)
    
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
    
    const completeButton = screen.getByRole('button', { name: /complete setup/i })
    await user.click(completeButton)
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  // Helper function to navigate to a specific step
  async function navigateToStep(user: any, targetStep: number) {
    // Step 1: Personal Information
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/professional title/i), 'Developer')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    
    if (targetStep > 1) {
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => screen.getByText('Social Links'))
    }
    
    if (targetStep > 2) {
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => screen.getByText('Features'))
    }
    
    if (targetStep > 3) {
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => screen.getByText('Theme & Design'))
    }
    
    if (targetStep > 4) {
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => screen.getByText('Complete'))
    }
  }
})

/**
 * API Keys Page Tests
 * Comprehensive tests for the API keys management page
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import APIKeysPage from '@/app/admin/settings/api-keys/page'

// Mock the useToast hook
const mockShowToast = jest.fn()
jest.mock('@/components/Toast', () => ({
  useToast: () => ({
    showToast: mockShowToast
  })
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('APIKeysPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-access-token')
    mockFetch.mockClear()
  })

  it('should render the API keys page', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: {
            apiKey: '',
            model: 'gpt-3.5-turbo',
            maxTokens: 500,
            temperature: 0.7,
            enabled: false
          },
          analytics: {
            googleAnalyticsId: '',
            enabled: false
          },
          email: {
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPassword: '',
            enabled: false
          }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('API Keys & Integrations')).toBeInTheDocument()
    })

    expect(screen.getByText('OpenAI Integration')).toBeInTheDocument()
    expect(screen.getByText('Google Analytics')).toBeInTheDocument()
    expect(screen.getByText('Email Configuration')).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<APIKeysPage />)

    expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should display not connected status for OpenAI', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', enabled: false },
          analytics: { enabled: false },
          email: { enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Not Connected')).toBeInTheDocument()
    })
  })

  it('should allow entering OpenAI API key', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', enabled: false },
          analytics: { enabled: false },
          email: { enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    })

    const apiKeyInput = screen.getByPlaceholderText('sk-...')
    await user.type(apiKeyInput, 'sk-test-api-key')

    expect(apiKeyInput).toHaveValue('sk-test-api-key')
  })

  it('should test OpenAI connection successfully', async () => {
    const user = userEvent.setup()
    
    // Mock initial load
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', enabled: false },
          analytics: { enabled: false },
          email: { enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    })

    // Enter API key
    const apiKeyInput = screen.getByPlaceholderText('sk-...')
    await user.type(apiKeyInput, 'sk-test-api-key')

    // Mock test connection response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'OpenAI connection successful',
        model: 'gpt-3.5-turbo'
      })
    })

    // Click test button
    const testButton = screen.getByTestId('test-openai-button')
    await user.click(testButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings/test-openai', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-access-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: 'sk-test-api-key',
          model: 'gpt-3.5-turbo'
        })
      })
    })

    expect(mockShowToast).toHaveBeenCalledWith('OpenAI connection successful! ✨', 'success')
  })

  it('should handle test connection failure', async () => {
    const user = userEvent.setup()
    
    // Mock initial load
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', enabled: false },
          analytics: { enabled: false },
          email: { enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    })

    // Enter invalid API key
    const apiKeyInput = screen.getByPlaceholderText('sk-...')
    await user.type(apiKeyInput, 'sk-invalid-key')

    // Mock test connection failure
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Invalid API key'
      })
    })

    // Click test button
    const testButton = screen.getByTestId('test-openai-button')
    await user.click(testButton)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('OpenAI connection failed. Please check your API key.', 'error')
    })
  })

  it('should save API key settings', async () => {
    const user = userEvent.setup()
    
    // Mock initial load
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', enabled: false },
          analytics: { enabled: false },
          email: { enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    })

    // Enter API key
    const apiKeyInput = screen.getByPlaceholderText('sk-...')
    await user.type(apiKeyInput, 'sk-test-api-key')

    // Mock save response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'API key settings saved successfully'
      })
    })

    // Click save button
    const saveButton = screen.getByTestId('save-settings-button')
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings/api-keys', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-access-token',
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('sk-test-api-key')
      })
    })

    expect(mockShowToast).toHaveBeenCalledWith('API key settings saved successfully!', 'success')
  })

  it('should toggle API key visibility', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: 'sk-••••••••••••••••••••••••••••••••••••••••••••••••••••', enabled: true },
          analytics: { enabled: false },
          email: { enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    })

    const apiKeyInput = screen.getByPlaceholderText('sk-...')
    const toggleButton = screen.getByText('👁️')

    // Initially should be password type (hidden)
    expect(apiKeyInput).toHaveAttribute('type', 'password')

    // Click to show
    await user.click(toggleButton)
    expect(apiKeyInput).toHaveAttribute('type', 'text')

    // Click to hide again
    await user.click(toggleButton)
    expect(apiKeyInput).toHaveAttribute('type', 'password')
  })

  it('should configure Google Analytics', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { enabled: false },
          analytics: { googleAnalyticsId: '', enabled: false },
          email: { enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('G-XXXXXXXXXX')).toBeInTheDocument()
    })

    // Enable analytics
    const analyticsToggle = screen.getByTestId('analytics-toggle')
    await user.click(analyticsToggle)

    // Enter Analytics ID
    const analyticsInput = screen.getByPlaceholderText('G-XXXXXXXXXX')
    await user.type(analyticsInput, 'G-TEST123456')

    expect(analyticsInput).toHaveValue('G-TEST123456')
  })

  it('should configure email settings', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { enabled: false },
          analytics: { enabled: false },
          email: {
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPassword: '',
            enabled: false
          }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByTestId('email-toggle')).toBeInTheDocument()
    })

    // Enable email
    const emailToggle = screen.getByTestId('email-toggle')
    await user.click(emailToggle)

    // Configure SMTP settings
    const hostInput = screen.getByDisplayValue('') // SMTP host input
    await user.type(hostInput, 'smtp.gmail.com')

    expect(hostInput).toHaveValue('smtp.gmail.com')
  })

  it('should show helpful information when no API key is configured', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', enabled: false },
          analytics: { enabled: false },
          email: { enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('🚀 Get Started with AI Features')).toBeInTheDocument()
    })

    expect(screen.getByText('Generate professional portfolio content automatically')).toBeInTheDocument()
    expect(screen.getByText('No API key?')).toBeInTheDocument()
  })

  it('should handle authentication errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: 'Authentication required'
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to load API key settings', 'error')
    })
  })

  it('should handle network errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to load API key settings', 'error')
    })
  })
})

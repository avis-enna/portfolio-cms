/**
 * API Keys Settings Tests
 * Test the API keys management functionality
 */

// Mock the useToast hook BEFORE imports
const mockShowToast = jest.fn()
jest.mock('@/components/Toast', () => {
  const React = require('react')
  return {
    useToast: () => ({
      showToast: mockShowToast
    }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children)
  }
})

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import APIKeysPage from '@/app/admin/settings/api-keys/page'
import { ToastProvider } from '@/components/Toast'

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

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
)

describe('API Keys Settings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-access-token')
  })

  it('renders the API keys page correctly', async () => {
    // Mock successful API response
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

    render(
      <TestWrapper>
        <APIKeysPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('api-keys-page')).toBeInTheDocument()
    })

    // Check if main sections are rendered
    expect(screen.getByText('API Keys & Integrations')).toBeInTheDocument()
    expect(screen.getByText('OpenAI Integration')).toBeInTheDocument()
    expect(screen.getByText('Google Analytics')).toBeInTheDocument()
    expect(screen.getByText('Email Configuration')).toBeInTheDocument()
  })

  it('shows not connected status when OpenAI is not configured', async () => {
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
          analytics: { googleAnalyticsId: '', enabled: false },
          email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Not Connected')).toBeInTheDocument()
    })
  })

  it('allows user to enter OpenAI API key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', model: 'gpt-3.5-turbo', maxTokens: 500, temperature: 0.7, enabled: false },
          analytics: { googleAnalyticsId: '', enabled: false },
          email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    })

    const apiKeyInput = screen.getByPlaceholderText('sk-...')
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test-api-key' } })

    expect(apiKeyInput).toHaveValue('sk-test-api-key')
  })

  it('tests OpenAI connection when test button is clicked', async () => {
    // Mock initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', model: 'gpt-3.5-turbo', maxTokens: 500, temperature: 0.7, enabled: false },
          analytics: { googleAnalyticsId: '', enabled: false },
          email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    })

    // Enter API key
    const apiKeyInput = screen.getByPlaceholderText('sk-...')
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test-api-key' } })

    // Mock test connection response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'OpenAI connection successful',
        model: 'gpt-3.5-turbo'
      })
    })

    // Click test button
    const testButton = screen.getByTestId('test-openai-button')
    fireEvent.click(testButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/test-openai', {
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

  it('handles test connection failure', async () => {
    // Mock initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', model: 'gpt-3.5-turbo', maxTokens: 500, temperature: 0.7, enabled: false },
          analytics: { googleAnalyticsId: '', enabled: false },
          email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    })

    // Enter API key
    const apiKeyInput = screen.getByPlaceholderText('sk-...')
    fireEvent.change(apiKeyInput, { target: { value: 'sk-invalid-key' } })

    // Mock test connection failure
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Invalid API key'
      })
    })

    // Click test button
    const testButton = screen.getByTestId('test-openai-button')
    fireEvent.click(testButton)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('OpenAI connection failed. Please check your API key.', 'error')
    })
  })

  it('saves API key settings', async () => {
    // Mock initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', model: 'gpt-3.5-turbo', maxTokens: 500, temperature: 0.7, enabled: false },
          analytics: { googleAnalyticsId: '', enabled: false },
          email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', enabled: false }
        }
      })
    })

    render(<APIKeysPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    })

    // Enter API key
    const apiKeyInput = screen.getByPlaceholderText('sk-...')
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test-api-key' } })

    // Mock save response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'API key settings saved successfully'
      })
    })

    // Click save button
    const saveButton = screen.getByTestId('save-settings-button')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/api-keys', {
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

  it('shows helpful information when no API key is configured', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: '', model: 'gpt-3.5-turbo', maxTokens: 500, temperature: 0.7, enabled: false },
          analytics: { googleAnalyticsId: '', enabled: false },
          email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', enabled: false }
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

  it('handles loading state correctly', () => {
    // Don't mock fetch to simulate loading state
    render(<APIKeysPage />)

    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('allows toggling API key visibility', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
          openai: { apiKey: 'sk-••••••••••••••••••••••••••••••••••••••••••••••••••••', model: 'gpt-3.5-turbo', maxTokens: 500, temperature: 0.7, enabled: true },
          analytics: { googleAnalyticsId: '', enabled: false },
          email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', enabled: false }
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
    fireEvent.click(toggleButton)
    expect(apiKeyInput).toHaveAttribute('type', 'text')

    // Click to hide again
    fireEvent.click(toggleButton)
    expect(apiKeyInput).toHaveAttribute('type', 'password')
  })
})

/**
 * LinkedIn Integration Tests
 * Tests LinkedIn OAuth, API client, and sharing functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LinkedInIntegration } from '@/components/LinkedInIntegration'
import { LinkedInShare } from '@/components/LinkedInShare'
import { LinkedInClient, createLinkedInClient } from '@/lib/linkedin/client'
import { 
  generateLinkedInAuthUrl, 
  validateLinkedInConfig,
  LinkedInAPIError,
  LinkedInAuthError 
} from '@/lib/linkedin/config'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/Toast'

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock environment variables
process.env.LINKEDIN_CLIENT_ID = 'test-client-id'
process.env.LINKEDIN_CLIENT_SECRET = 'test-client-secret'
process.env.LINKEDIN_REDIRECT_URI = 'http://localhost:3000/api/auth/linkedin/callback'

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </ThemeProvider>
)

describe('LinkedIn Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    if (fetch && typeof (fetch as any).mockClear === 'function') {
      ;(fetch as jest.Mock).mockClear()
    }
    mockLocalStorage.getItem.mockReturnValue('mock-access-token')
  })

  describe('LinkedIn Configuration', () => {
    test('validates LinkedIn configuration correctly', () => {
      expect(validateLinkedInConfig()).toBe(true)
    })

    test('generates correct LinkedIn auth URL', () => {
      const authUrl = generateLinkedInAuthUrl('test-state')
      
      expect(authUrl).toContain('https://www.linkedin.com/oauth/v2/authorization')
      expect(authUrl).toContain('client_id=test-client-id')
      expect(authUrl).toContain('state=test-state')
      expect(authUrl).toContain('scope=r_liteprofile%20r_emailaddress%20w_member_social')
    })

    test('handles missing configuration gracefully', () => {
      const originalClientId = process.env.LINKEDIN_CLIENT_ID
      delete process.env.LINKEDIN_CLIENT_ID
      
      expect(validateLinkedInConfig()).toBe(false)
      
      process.env.LINKEDIN_CLIENT_ID = originalClientId
    })
  })

  describe('LinkedIn API Client', () => {
    test('creates LinkedIn client correctly', () => {
      const client = createLinkedInClient('test-token', Date.now() + 3600000)
      expect(client).toBeInstanceOf(LinkedInClient)
      expect(client.isTokenValid()).toBe(true)
    })

    test('handles token exchange successfully', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'r_liteprofile r_emailaddress w_member_social'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse
      })

      const client = createLinkedInClient()
      const tokens = await client.exchangeCodeForToken('test-code', 'test-state')

      expect(tokens.accessToken).toBe('test-access-token')
      expect(tokens.expiresIn).toBe(3600)
      expect(tokens.tokenType).toBe('Bearer')
      expect(tokens.scope).toBe('r_liteprofile r_emailaddress w_member_social')
    })

    test('handles token exchange errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Authorization code is invalid'
        })
      })

      const client = createLinkedInClient()
      
      await expect(client.exchangeCodeForToken('invalid-code'))
        .rejects.toThrow(LinkedInAuthError)
    })

    test('gets user profile successfully', async () => {
      const mockProfile = {
        id: 'test-user-id',
        firstName: {
          localized: { 'en_US': 'John' },
          preferredLocale: { country: 'US', language: 'en' }
        },
        lastName: {
          localized: { 'en_US': 'Doe' },
          preferredLocale: { country: 'US', language: 'en' }
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile
      })

      const client = createLinkedInClient('test-token', Date.now() + 3600000)
      const profile = await client.getProfile()

      expect(profile.id).toBe('test-user-id')
      expect(profile.firstName).toEqual(mockProfile.firstName)
      expect(profile.lastName).toEqual(mockProfile.lastName)
    })

    test('shares content successfully', async () => {
      const mockProfile = {
        id: 'test-user-id',
        firstName: { localized: { 'en_US': 'John' } },
        lastName: { localized: { 'en_US': 'Doe' } }
      }

      const mockShareResponse = {
        id: 'test-share-id',
        activity: 'urn:li:activity:123456789',
        created: { time: Date.now() },
        lastModified: { time: Date.now() }
      }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfile
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockShareResponse
        })

      const client = createLinkedInClient('test-token', Date.now() + 3600000)
      const shareResult = await client.shareContent({
        text: 'Test share content',
        url: 'https://example.com',
        title: 'Test Title',
        description: 'Test Description'
      })

      expect(shareResult.id).toBe('test-share-id')
      expect(shareResult.activity).toBe('urn:li:activity:123456789')
    })

    test('validates share content correctly', async () => {
      const client = createLinkedInClient('test-token', Date.now() + 3600000)

      // Test empty text
      await expect(client.shareContent({ text: '' }))
        .rejects.toThrow(LinkedInAPIError)

      // Test text too long
      const longText = 'a'.repeat(3001)
      await expect(client.shareContent({ text: longText }))
        .rejects.toThrow(LinkedInAPIError)

      // Test invalid URL
      await expect(client.shareContent({ 
        text: 'Test', 
        url: 'invalid-url' 
      })).rejects.toThrow(LinkedInAPIError)
    })

    test('handles expired tokens', () => {
      const client = createLinkedInClient('test-token', Date.now() - 1000)
      expect(client.isTokenValid()).toBe(false)

      expect(() => client.getProfile())
        .rejects.toThrow(LinkedInAPIError)
    })
  })

  describe('LinkedIn Integration Component', () => {
    test('renders LinkedIn integration component', () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            isConnected: false,
            profile: null
          }
        })
      })

      render(
        <TestWrapper>
          <LinkedInIntegration />
        </TestWrapper>
      )

      expect(screen.getByTestId('linkedin-integration')).toBeInTheDocument()
      expect(screen.getByText('LinkedIn Integration')).toBeInTheDocument()
      expect(screen.getByText('Not Connected')).toBeInTheDocument()
    })

    test('shows connected state correctly', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            isConnected: true,
            profile: {
              name: 'John Doe',
              email: 'john@example.com'
            },
            connectedAt: '2023-01-01T00:00:00Z'
          }
        })
      })

      render(
        <TestWrapper>
          <LinkedInIntegration />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
      })
    })

    test('handles connection process', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { isConnected: false, profile: null }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              authUrl: 'https://linkedin.com/oauth/authorize?...',
              state: 'test-state'
            }
          })
        })

      // Mock window.location.href
      delete (window as any).location
      window.location = { href: '' } as any

      render(
        <TestWrapper>
          <LinkedInIntegration />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('connect-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('connect-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/linkedin', expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        }))
      })
    })

    test('handles disconnection process', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              isConnected: true,
              profile: { name: 'John Doe' }
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'LinkedIn account disconnected successfully'
          })
        })

      render(
        <TestWrapper>
          <LinkedInIntegration />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('disconnect-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('disconnect-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/linkedin', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'disconnect' })
        }))
      })
    })

    test('tests connection successfully', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              isConnected: true,
              profile: { name: 'John Doe' }
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true
          })
        })

      render(
        <TestWrapper>
          <LinkedInIntegration />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('test-connection-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('test-connection-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/linkedin/callback', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'validate' })
        }))
      })
    })
  })

  describe('LinkedIn Share Component', () => {
    test('renders LinkedIn share component', () => {
      render(
        <TestWrapper>
          <LinkedInShare type="portfolio" />
        </TestWrapper>
      )

      expect(screen.getByTestId('linkedin-quick-share')).toBeInTheDocument()
      expect(screen.getByTestId('linkedin-custom-share')).toBeInTheDocument()
      expect(screen.getByText('Share to LinkedIn')).toBeInTheDocument()
    })

    test('handles quick share', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            shareId: 'test-share-id',
            shareUrl: 'https://linkedin.com/feed/update/test',
            message: 'Content shared to LinkedIn successfully!'
          }
        })
      })

      render(
        <TestWrapper>
          <LinkedInShare type="portfolio" />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('linkedin-quick-share'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/linkedin/share', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('portfolio')
        }))
      })
    })

    test('opens custom share modal', () => {
      render(
        <TestWrapper>
          <LinkedInShare type="project" content={{ title: 'Test Project', description: 'Test Description' }} />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('linkedin-custom-share'))

      expect(screen.getByTestId('linkedin-share-modal')).toBeInTheDocument()
      expect(screen.getByTestId('share-message-input')).toBeInTheDocument()
      expect(screen.getByTestId('share-visibility-select')).toBeInTheDocument()
    })

    test('handles custom share with modal', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { shareId: 'test-share-id' }
        })
      })

      render(
        <TestWrapper>
          <LinkedInShare type="custom" content={{ text: 'Custom message' }} />
        </TestWrapper>
      )

      // Open modal
      fireEvent.click(screen.getByTestId('linkedin-custom-share'))

      // Enter custom message
      const messageInput = screen.getByTestId('share-message-input')
      fireEvent.change(messageInput, { target: { value: 'My custom LinkedIn post' } })

      // Change visibility
      const visibilitySelect = screen.getByTestId('share-visibility-select')
      fireEvent.change(visibilitySelect, { target: { value: 'CONNECTIONS' } })

      // Share
      fireEvent.click(screen.getByTestId('confirm-share'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/linkedin/share', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('My custom LinkedIn post')
        }))
      })
    })

    test('validates message before sharing', () => {
      render(
        <TestWrapper>
          <LinkedInShare type="custom" />
        </TestWrapper>
      )

      // Open modal
      fireEvent.click(screen.getByTestId('linkedin-custom-share'))

      // Try to share without message
      fireEvent.click(screen.getByTestId('confirm-share'))

      // Should not make API call
      expect(fetch).not.toHaveBeenCalled()
    })

    test('handles share errors gracefully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'LinkedIn token has expired',
          code: 'auth_failed'
        })
      })

      const onShareError = jest.fn()

      render(
        <TestWrapper>
          <LinkedInShare type="portfolio" onShareError={onShareError} />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('linkedin-quick-share'))

      await waitFor(() => {
        expect(onShareError).toHaveBeenCalledWith('LinkedIn token has expired')
      })
    })

    test('calls success callback on successful share', async () => {
      const shareData = {
        shareId: 'test-share-id',
        shareUrl: 'https://linkedin.com/feed/update/test'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: shareData
        })
      })

      const onShareSuccess = jest.fn()

      render(
        <TestWrapper>
          <LinkedInShare type="portfolio" onShareSuccess={onShareSuccess} />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('linkedin-quick-share'))

      await waitFor(() => {
        expect(onShareSuccess).toHaveBeenCalledWith(shareData)
      })
    })

    test('closes modal on cancel', () => {
      render(
        <TestWrapper>
          <LinkedInShare type="portfolio" />
        </TestWrapper>
      )

      // Open modal
      fireEvent.click(screen.getByTestId('linkedin-custom-share'))
      expect(screen.getByTestId('linkedin-share-modal')).toBeInTheDocument()

      // Close modal
      fireEvent.click(screen.getByTestId('cancel-share'))
      expect(screen.queryByTestId('linkedin-share-modal')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(
        <TestWrapper>
          <LinkedInIntegration />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Not Connected')).toBeInTheDocument()
      })
    })

    test('handles API errors with proper error messages', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Unauthorized'
        })
      })

      render(
        <TestWrapper>
          <LinkedInShare type="portfolio" />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('linkedin-quick-share'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })
    })
  })
})

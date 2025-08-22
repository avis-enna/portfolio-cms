/**
 * Frontend-Backend Integration Tests
 * Tests the integration between new frontend components and existing backend APIs
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ContactSection } from '@/components/ContactSection'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/Toast'

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

// Test wrapper with all providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </ThemeProvider>
)

describe('Frontend-Backend Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    if (fetch && typeof (fetch as any).mockClear === 'function') {
      ;(fetch as jest.Mock).mockClear()
    }
  })

  describe('Contact Form API Integration', () => {
    const mockContactInfo = {
      email: 'test@example.com',
      phone: '+1234567890',
      location: 'Test City, TC'
    }

    test('successfully submits contact form to API', async () => {
      // Mock successful API response
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Thank you for your message! I\'ll get back to you soon.',
          data: {
            submissionId: 'test-submission-id',
            submittedAt: new Date().toISOString()
          }
        })
      })

      render(
        <TestWrapper>
          <ContactSection contactInfo={mockContactInfo} />
        </TestWrapper>
      )

      // Fill out the form
      fireEvent.change(screen.getByTestId('contact-name'), {
        target: { value: 'John Doe' }
      })
      fireEvent.change(screen.getByTestId('contact-email-input'), {
        target: { value: 'john@example.com' }
      })
      fireEvent.change(screen.getByTestId('contact-subject'), {
        target: { value: 'Test Subject' }
      })
      fireEvent.change(screen.getByTestId('contact-message'), {
        target: { value: 'This is a test message with more than 10 characters' }
      })

      // Submit the form
      fireEvent.click(screen.getByTestId('contact-submit'))

      // Wait for API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            subject: 'Test Subject',
            message: 'This is a test message with more than 10 characters'
          })
        })
      })

      // Verify form is reset after successful submission
      await waitFor(() => {
        expect(screen.getByTestId('contact-name')).toHaveValue('')
        expect(screen.getByTestId('contact-email-input')).toHaveValue('')
        expect(screen.getByTestId('contact-subject')).toHaveValue('')
        expect(screen.getByTestId('contact-message')).toHaveValue('')
      })
    })

    test('handles API error responses gracefully', async () => {
      // Mock API error response
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: 30
        })
      })

      render(
        <TestWrapper>
          <ContactSection contactInfo={mockContactInfo} />
        </TestWrapper>
      )

      // Fill out and submit form
      fireEvent.change(screen.getByTestId('contact-name'), {
        target: { value: 'John Doe' }
      })
      fireEvent.change(screen.getByTestId('contact-email-input'), {
        target: { value: 'john@example.com' }
      })
      fireEvent.change(screen.getByTestId('contact-subject'), {
        target: { value: 'Test Subject' }
      })
      fireEvent.change(screen.getByTestId('contact-message'), {
        target: { value: 'This is a test message' }
      })

      fireEvent.click(screen.getByTestId('contact-submit'))

      // Wait for API call and error handling
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })

      // Form should not be reset on error
      expect(screen.getByTestId('contact-name')).toHaveValue('John Doe')
    })

    test('handles network errors gracefully', async () => {
      // Mock network error
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(
        <TestWrapper>
          <ContactSection contactInfo={mockContactInfo} />
        </TestWrapper>
      )

      // Fill out and submit form
      fireEvent.change(screen.getByTestId('contact-name'), {
        target: { value: 'John Doe' }
      })
      fireEvent.change(screen.getByTestId('contact-email-input'), {
        target: { value: 'john@example.com' }
      })
      fireEvent.change(screen.getByTestId('contact-subject'), {
        target: { value: 'Test Subject' }
      })
      fireEvent.change(screen.getByTestId('contact-message'), {
        target: { value: 'This is a test message' }
      })

      fireEvent.click(screen.getByTestId('contact-submit'))

      // Wait for error handling
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })

      // Form should not be reset on network error
      expect(screen.getByTestId('contact-name')).toHaveValue('John Doe')
    })

    test('validates form before making API call', async () => {
      render(
        <TestWrapper>
          <ContactSection contactInfo={mockContactInfo} />
        </TestWrapper>
      )

      // Submit empty form
      fireEvent.click(screen.getByTestId('contact-submit'))

      // Should show validation errors without making API call
      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toBeInTheDocument()
        expect(screen.getByTestId('email-error')).toBeInTheDocument()
        expect(screen.getByTestId('subject-error')).toBeInTheDocument()
        expect(screen.getByTestId('message-error')).toBeInTheDocument()
      })

      // API should not be called
      expect(fetch).not.toHaveBeenCalled()
    })

    test('shows loading state during API call', async () => {
      // Mock delayed API response
      ;(fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, message: 'Success' })
          }), 100)
        )
      )

      render(
        <TestWrapper>
          <ContactSection contactInfo={mockContactInfo} />
        </TestWrapper>
      )

      // Fill out form
      fireEvent.change(screen.getByTestId('contact-name'), {
        target: { value: 'John Doe' }
      })
      fireEvent.change(screen.getByTestId('contact-email-input'), {
        target: { value: 'john@example.com' }
      })
      fireEvent.change(screen.getByTestId('contact-subject'), {
        target: { value: 'Test Subject' }
      })
      fireEvent.change(screen.getByTestId('contact-message'), {
        target: { value: 'This is a test message' }
      })

      // Submit form
      fireEvent.click(screen.getByTestId('contact-submit'))

      // Should show loading state
      expect(screen.getByText('Sending...')).toBeInTheDocument()
      expect(screen.getByTestId('contact-submit')).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Send Message')).toBeInTheDocument()
      }, { timeout: 200 })
    })
  })

  describe('Theme System Integration', () => {
    test('theme persists across page reloads', () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      })

      // Mock initial theme
      mockLocalStorage.getItem.mockReturnValue('dark')

      render(
        <TestWrapper>
          <div>Test content</div>
        </TestWrapper>
      )

      // Should load saved theme
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme')
    })

    test('system theme detection works correctly', () => {
      // Mock matchMedia
      const mockMatchMedia = jest.fn()
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })
      Object.defineProperty(window, 'matchMedia', {
        value: mockMatchMedia
      })

      render(
        <TestWrapper>
          <div>Test content</div>
        </TestWrapper>
      )

      // Should check system preference
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })
  })

  describe('Navigation Integration', () => {
    test('navigation shows/hides items based on portfolio data', () => {
      const mockPortfolioData = {
        personalInfo: { name: 'Test User' },
        summary: 'Test summary',
        technicalSkills: [{ name: 'React' }],
        experience: [{ company: 'Test Corp', position: 'Developer' }],
        projects: [{ title: 'Test Project' }],
        education: [{ degree: 'Test Degree' }],
        certifications: [{ name: 'Test Cert' }],
        socialLinks: {},
        seoMetadata: { title: 'Test', description: 'Test', keywords: [] }
      }

      const { Navigation } = require('@/components/Navigation')

      render(
        <TestWrapper>
          <Navigation portfolioData={mockPortfolioData} />
        </TestWrapper>
      )

      // Should show navigation items for available data
      expect(screen.getByTestId('nav-about')).toBeInTheDocument()
      expect(screen.getByTestId('nav-experience')).toBeInTheDocument()
      expect(screen.getByTestId('nav-projects')).toBeInTheDocument()
      expect(screen.getByTestId('nav-education')).toBeInTheDocument()
    })

    test('navigation hides items when no data available', () => {
      const mockPortfolioData = {
        personalInfo: { name: 'Test User' },
        technicalSkills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        socialLinks: {},
        seoMetadata: { title: 'Test', description: 'Test', keywords: [] }
      }

      const { Navigation } = require('@/components/Navigation')

      render(
        <TestWrapper>
          <Navigation portfolioData={mockPortfolioData} />
        </TestWrapper>
      )

      // Should not show navigation items for unavailable data
      expect(screen.queryByTestId('nav-experience')).not.toBeInTheDocument()
      expect(screen.queryByTestId('nav-projects')).not.toBeInTheDocument()
      expect(screen.queryByTestId('nav-education')).not.toBeInTheDocument()
    })
  })

  describe('Portfolio Data Integration', () => {
    test('components handle missing portfolio data gracefully', () => {
      const { AboutSection } = require('@/components/PortfolioSections')

      render(
        <TestWrapper>
          <AboutSection />
        </TestWrapper>
      )

      // Should not render when no data provided
      expect(screen.queryByTestId('about-section')).not.toBeInTheDocument()
    })

    test('components render correctly with complete portfolio data', () => {
      const mockData = {
        summary: 'Test summary',
        technicalSkills: [{ name: 'React', level: 90 }],
        softSkills: [{ name: 'Leadership' }]
      }

      const { AboutSection } = require('@/components/PortfolioSections')

      render(
        <TestWrapper>
          <AboutSection {...mockData} />
        </TestWrapper>
      )

      // Should render with provided data
      expect(screen.getByTestId('about-section')).toBeInTheDocument()
      expect(screen.getByText('Test summary')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('Leadership')).toBeInTheDocument()
    })
  })
})

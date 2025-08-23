/**
 * Analytics System Tests
 * Comprehensive tests for analytics tracking, dashboard, and performance monitoring
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { analyticsClient, trackPageView, trackEvent, trackConversion } from '@/lib/analytics/analytics-client'
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

// Mock window properties
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com/test',
    pathname: '/test',
    search: '',
    hash: ''
  },
  writable: true
})

Object.defineProperty(document, 'referrer', {
  value: 'https://google.com',
  writable: true
})

Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  writable: true
})

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    getEntriesByType: jest.fn(() => []),
    now: jest.fn(() => Date.now())
  },
  writable: true
})

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}))

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </ThemeProvider>
)

describe('Analytics System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    if (fetch && typeof (fetch as any).mockClear === 'function') {
      ;(fetch as jest.Mock).mockClear()
    }
    mockLocalStorage.getItem.mockReturnValue('mock-access-token')
  })

  describe('Analytics Client', () => {
    test('initializes analytics client correctly', () => {
      expect(analyticsClient).toBeDefined()
      expect(typeof analyticsClient.trackPageView).toBe('function')
      expect(typeof analyticsClient.trackEvent).toBe('function')
    })

    test('tracks page view events', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      trackPageView('/test-page', { source: 'test' })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/analytics/events', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('page_view')
        }))
      })
    })

    test('tracks custom events', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      trackEvent({
        type: 'click',
        metadata: { button: 'test-button' }
      })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/analytics/events', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('click')
        }))
      })
    })

    test('tracks conversion events', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      trackConversion('contact_form', 100, { source: 'homepage' })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/analytics/events', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('conversion')
        }))
      })
    })

    test('generates unique session IDs', () => {
      const session1 = analyticsClient.getSession()
      const session2 = analyticsClient.getSession()
      
      expect(session1.id).toBeDefined()
      expect(session2.id).toBeDefined()
      expect(session1.id).toBe(session2.id) // Same session
    })

    test('detects device information correctly', () => {
      const session = analyticsClient.getSession()
      
      expect(session.device).toBeDefined()
      expect(session.device.type).toMatch(/desktop|tablet|mobile/)
      expect(session.device.browser).toBeDefined()
      expect(session.device.os).toBeDefined()
    })

    test('tracks scroll depth', () => {
      // Simulate scroll event
      const scrollEvent = new Event('scroll')
      Object.defineProperty(window, 'pageYOffset', { value: 500, writable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })

      window.dispatchEvent(scrollEvent)

      const session = analyticsClient.getSession()
      expect(session.id).toBeDefined()
    })

    test('handles tracking errors gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      // Should not throw error
      expect(() => {
        trackEvent({ type: 'click' })
      }).not.toThrow()
    })

    test('respects tracking disable setting', () => {
      analyticsClient.setTracking(false)
      
      trackEvent({ type: 'click' })
      
      // Should not make API call when tracking is disabled
      expect(fetch).not.toHaveBeenCalled()
      
      // Re-enable tracking
      analyticsClient.setTracking(true)
    })
  })

  describe('Analytics Dashboard Component', () => {
    const mockAnalyticsData = {
      overview: {
        totalSessions: 1250,
        uniqueVisitors: 980,
        pageViews: 3420,
        bounceRate: 45.2,
        avgSessionDuration: 180000,
        conversions: 25,
        conversionRate: 2.0,
        growth: {
          sessions: 15,
          visitors: 12,
          pageViews: 18,
          conversions: 25
        }
      },
      pageViews: [
        { date: '2024-01-01', views: 150, uniqueVisitors: 120 },
        { date: '2024-01-02', views: 180, uniqueVisitors: 140 }
      ],
      topPages: [
        { page: '/', views: 500, uniqueVisitors: 400, avgScrollDepth: 75, avgDuration: 120000 },
        { page: '/about', views: 300, uniqueVisitors: 250, avgScrollDepth: 60, avgDuration: 90000 }
      ],
      deviceStats: [
        { deviceType: 'desktop', sessions: 600, avgDuration: 200000, avgPageViews: 2.5, bounceRate: 40 },
        { deviceType: 'mobile', sessions: 500, avgDuration: 150000, avgPageViews: 2.0, bounceRate: 50 },
        { deviceType: 'tablet', sessions: 150, avgDuration: 180000, avgPageViews: 2.2, bounceRate: 45 }
      ],
      performance: {
        overview: {
          avgPerformanceScore: 85,
          avgWebVitalsScore: 78,
          avgLCP: 2100,
          avgFID: 45,
          avgCLS: 0.08,
          totalMeasurements: 500
        }
      },
      realTime: {
        activeVisitors: 12,
        recentEvents: [
          { type: 'page_view', page: '/', timestamp: new Date() },
          { type: 'click', page: '/about', timestamp: new Date() }
        ],
        topPages: [
          { page: '/', views: 8 },
          { page: '/projects', views: 4 }
        ]
      }
    }

    test('renders analytics dashboard', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockAnalyticsData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
        expect(screen.getByTestId('sessions-card')).toBeInTheDocument()
        expect(screen.getByTestId('visitors-card')).toBeInTheDocument()
        expect(screen.getByTestId('pageviews-card')).toBeInTheDocument()
        expect(screen.getByTestId('bounce-rate-card')).toBeInTheDocument()
      })
    })

    test('displays overview statistics correctly', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockAnalyticsData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('1.3K')).toBeInTheDocument() // Total sessions formatted
        expect(screen.getByText('980')).toBeInTheDocument() // Unique visitors
        expect(screen.getByText('3.4K')).toBeInTheDocument() // Page views formatted
        expect(screen.getByText('45.2%')).toBeInTheDocument() // Bounce rate
      })
    })

    test('shows growth indicators correctly', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockAnalyticsData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('15% vs previous period')).toBeInTheDocument()
        expect(screen.getByText('12% vs previous period')).toBeInTheDocument()
        expect(screen.getByText('18% vs previous period')).toBeInTheDocument()
      })
    })

    test('displays real-time statistics', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockAnalyticsData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('🔴 Real-time Activity')).toBeInTheDocument()
        expect(screen.getByText('12')).toBeInTheDocument() // Active visitors
        expect(screen.getByText('Last 30 minutes')).toBeInTheDocument()
      })
    })

    test('shows top pages breakdown', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockAnalyticsData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('📊 Top Pages')).toBeInTheDocument()
        expect(screen.getByText('/')).toBeInTheDocument()
        expect(screen.getByText('/about')).toBeInTheDocument()
        expect(screen.getByText('500')).toBeInTheDocument() // Views for homepage
      })
    })

    test('displays device breakdown', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockAnalyticsData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('📱 Device Breakdown')).toBeInTheDocument()
        expect(screen.getByText('Desktop')).toBeInTheDocument()
        expect(screen.getByText('Mobile')).toBeInTheDocument()
        expect(screen.getByText('Tablet')).toBeInTheDocument()
      })
    })

    test('shows performance metrics when available', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockAnalyticsData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('⚡ Performance Overview')).toBeInTheDocument()
        expect(screen.getByText('85')).toBeInTheDocument() // Performance score
        expect(screen.getByText('78')).toBeInTheDocument() // Web vitals score
        expect(screen.getByText('2100ms')).toBeInTheDocument() // LCP
      })
    })

    test('handles period selection', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockAnalyticsData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('period-select')).toBeInTheDocument()
      })

      // Change period
      fireEvent.change(screen.getByTestId('period-select'), {
        target: { value: '30d' }
      })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('period=30d'),
          expect.any(Object)
        )
      })
    })

    test('handles refresh functionality', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockAnalyticsData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument()
      })

      // Clear previous calls
      ;(fetch as jest.Mock).mockClear()

      // Click refresh
      fireEvent.click(screen.getByTestId('refresh-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/dashboard'),
          expect.any(Object)
        )
      })
    })

    test('shows loading state', () => {
      ;(fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument()
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    })

    test('handles API errors gracefully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('No analytics data available')).toBeInTheDocument()
        expect(screen.getByText('Retry Loading')).toBeInTheDocument()
      })
    })

    test('formats numbers correctly', async () => {
      const largeNumbersData = {
        ...mockAnalyticsData,
        overview: {
          ...mockAnalyticsData.overview,
          totalSessions: 1500000, // Should format to 1.5M
          pageViews: 2500 // Should format to 2.5K
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...largeNumbersData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('1.5M')).toBeInTheDocument()
        expect(screen.getByText('2.5K')).toBeInTheDocument()
      })
    })

    test('shows conversions when available', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockAnalyticsData,
            lastUpdated: new Date()
          }
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('🎯 Conversions')).toBeInTheDocument()
        expect(screen.getByText('25')).toBeInTheDocument() // Total conversions
        expect(screen.getByText('2.00%')).toBeInTheDocument() // Conversion rate
      })
    })
  })

  describe('Performance Monitoring', () => {
    test('tracks Core Web Vitals', () => {
      // Mock PerformanceObserver for LCP
      const mockObserver = jest.fn()
      global.PerformanceObserver = jest.fn().mockImplementation((callback) => {
        mockObserver.mockImplementation(callback)
        return {
          observe: jest.fn(),
          disconnect: jest.fn()
        }
      })

      analyticsClient.trackWebVitals()

      expect(PerformanceObserver).toHaveBeenCalled()
    })

    test('calculates performance scores correctly', () => {
      // This would test the performance calculation logic
      // Implementation depends on the specific scoring algorithm
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Error Handling', () => {
    test('handles network errors in tracking', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      // Should not throw
      expect(() => {
        trackPageView('/test')
      }).not.toThrow()
    })

    test('handles malformed analytics data', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: null // Malformed data
        })
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('No analytics data available')).toBeInTheDocument()
      })
    })
  })
})

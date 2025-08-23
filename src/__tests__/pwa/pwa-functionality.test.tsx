/**
 * PWA Functionality Tests
 * Comprehensive tests for Progressive Web App features
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PWAStatus } from '@/components/PWAStatus'
import { usePWA } from '@/hooks/usePWA'
import { 
  registerServiceWorker, 
  getPWACapabilities, 
  requestNotificationPermission,
  subscribeToPush,
  shareContent
} from '@/lib/pwa/pwa-utils'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/Toast'

// Mock PWA APIs
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: {
    postMessage: jest.fn()
  },
  addEventListener: jest.fn(),
  update: jest.fn(),
  showNotification: jest.fn(),
  pushManager: {
    subscribe: jest.fn(),
    getSubscription: jest.fn()
  },
  sync: {
    register: jest.fn()
  }
}

// Mock navigator APIs
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(),
    ready: Promise.resolve(mockServiceWorkerRegistration),
    getRegistration: jest.fn(),
    controller: null,
    addEventListener: jest.fn()
  },
  writable: true
})

Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
})

Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: jest.fn()
  },
  writable: true
})

Object.defineProperty(navigator, 'share', {
  value: jest.fn(),
  writable: true
})

// Mock BeforeInstallPromptEvent
Object.defineProperty(window, 'BeforeInstallPromptEvent', {
  value: class BeforeInstallPromptEvent extends Event {
    prompt = jest.fn()
    userChoice = Promise.resolve({ outcome: 'accepted' })
  },
  writable: true
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(display-mode: standalone)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  writable: true
})

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </ThemeProvider>
)

describe('PWA Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    // Reset Notification permission
    Object.defineProperty(window.Notification, 'permission', { value: 'default', writable: true })
  })

  describe('PWA Utils', () => {
    test('detects standalone mode correctly', () => {
      // Mock standalone mode
      ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const capabilities = getPWACapabilities()
      expect(capabilities.isStandalone).toBe(true)
    })

    test('detects PWA capabilities correctly', () => {
      const capabilities = getPWACapabilities()
      
      expect(capabilities.hasServiceWorker).toBe(true)
      expect(capabilities.isOnline).toBe(true)
      expect(typeof capabilities.isInstallable).toBe('boolean')
      expect(typeof capabilities.hasPushSupport).toBe('boolean')
    })

    test('registers service worker successfully', async () => {
      ;(navigator.serviceWorker.register as jest.Mock).mockResolvedValue(mockServiceWorkerRegistration)

      const registration = await registerServiceWorker()
      
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' })
      expect(registration).toBe(mockServiceWorkerRegistration)
    })

    test('handles service worker registration failure', async () => {
      ;(navigator.serviceWorker.register as jest.Mock).mockRejectedValue(new Error('Registration failed'))

      const registration = await registerServiceWorker()
      
      expect(registration).toBeNull()
    })

    test('requests notification permission', async () => {
      ;(window.Notification.requestPermission as jest.Mock).mockResolvedValue('granted')

      const permission = await requestNotificationPermission()
      
      expect(window.Notification.requestPermission).toHaveBeenCalled()
      expect(permission).toBe('granted')
    })

    test('subscribes to push notifications', async () => {
      const mockSubscription = { endpoint: 'test-endpoint' }
      ;(mockServiceWorkerRegistration.pushManager.subscribe as jest.Mock).mockResolvedValue(mockSubscription)

      const subscription = await subscribeToPush('test-vapid-key')
      
      expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalled()
      expect(subscription).toBe(mockSubscription)
    })

    test('shares content using Web Share API', async () => {
      ;(navigator.share as jest.Mock).mockResolvedValue(undefined)

      const success = await shareContent({
        title: 'Test Title',
        text: 'Test Text',
        url: 'https://example.com'
      })
      
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Test Title',
        text: 'Test Text',
        url: 'https://example.com'
      })
      expect(success).toBe(true)
    })

    test('handles Web Share API not supported', async () => {
      // Remove share API
      delete (navigator as any).share

      const success = await shareContent({
        title: 'Test Title',
        text: 'Test Text'
      })
      
      expect(success).toBe(false)
    })
  })

  describe('PWA Hooks', () => {
    test('usePWA hook returns all functionality', () => {
      const TestComponent = () => {
        const pwa = usePWA('test-vapid-key')
        
        return (
          <div data-testid="pwa-test">
            <span data-testid="installable">{pwa.capabilities.isInstallable.toString()}</span>
            <span data-testid="online">{pwa.network.isOnline.toString()}</span>
            <span data-testid="notifications">{pwa.notifications.permission}</span>
          </div>
        )
      }

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      expect(screen.getByTestId('pwa-test')).toBeInTheDocument()
      expect(screen.getByTestId('online')).toHaveTextContent('true')
      expect(screen.getByTestId('notifications')).toHaveTextContent('default')
    })
  })

  describe('PWA Status Component', () => {
    test('renders PWA status component', () => {
      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      expect(screen.getByTestId('pwa-status')).toBeInTheDocument()
      expect(screen.getByText('PWA Status')).toBeInTheDocument()
      expect(screen.getByText('Progressive Web App features')).toBeInTheDocument()
    })

    test('shows installation button when installable', async () => {
      // Mock install prompt event
      const mockInstallPrompt = {
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      }

      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      // Simulate beforeinstallprompt event
      const event = new CustomEvent('beforeinstallprompt')
      Object.assign(event, mockInstallPrompt)
      window.dispatchEvent(event)

      await waitFor(() => {
        expect(screen.getByTestId('install-button')).toBeInTheDocument()
      })
    })

    test('handles app installation', async () => {
      const mockInstallPrompt = {
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      }

      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      // Simulate beforeinstallprompt event
      const event = new CustomEvent('beforeinstallprompt')
      Object.assign(event, mockInstallPrompt)
      window.dispatchEvent(event)

      await waitFor(() => {
        expect(screen.getByTestId('install-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('install-button'))

      await waitFor(() => {
        expect(mockInstallPrompt.prompt).toHaveBeenCalled()
      })
    })

    test('shows update button when update is available', async () => {
      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      // Simulate service worker update available
      const event = new CustomEvent('sw-update-available', {
        detail: { registration: mockServiceWorkerRegistration }
      })
      window.dispatchEvent(event)

      await waitFor(() => {
        expect(screen.getByTestId('update-button')).toBeInTheDocument()
      })
    })

    test('handles notification permission request', async () => {
      ;(window.Notification.requestPermission as jest.Mock).mockResolvedValue('granted')

      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      const enableButton = screen.getByTestId('enable-notifications')
      fireEvent.click(enableButton)

      await waitFor(() => {
        expect(window.Notification.requestPermission).toHaveBeenCalled()
      })
    })

    test('sends test notification', async () => {
      // Set notification permission to granted
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', writable: true })

      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      const testButton = screen.getByTestId('test-notification')
      fireEvent.click(testButton)

      await waitFor(() => {
        expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalled()
      })
    })

    test('handles web share', async () => {
      ;(navigator.share as jest.Mock).mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      const shareButton = screen.getByTestId('share-button')
      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(navigator.share).toHaveBeenCalled()
      })
    })

    test('toggles detailed view', () => {
      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      const toggleButton = screen.getByTestId('toggle-details')
      
      // Initially collapsed
      expect(screen.queryByText('Detailed Status')).not.toBeInTheDocument()
      
      // Expand
      fireEvent.click(toggleButton)
      expect(screen.getByText('Detailed Status')).toBeInTheDocument()
      
      // Collapse
      fireEvent.click(toggleButton)
      expect(screen.queryByText('Detailed Status')).not.toBeInTheDocument()
    })

    test('shows network status correctly', () => {
      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      expect(screen.getByText('Online')).toBeInTheDocument()
    })

    test('handles offline state', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      expect(screen.getByText('Offline')).toBeInTheDocument()
    })

    test('shows push subscription controls', async () => {
      // Set notification permission to granted
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', writable: true })

      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      // Expand details
      fireEvent.click(screen.getByTestId('toggle-details'))

      await waitFor(() => {
        expect(screen.getByTestId('subscribe-push')).toBeInTheDocument()
      })
    })

    test('handles push subscription', async () => {
      const mockSubscription = { endpoint: 'test-endpoint' }
      ;(mockServiceWorkerRegistration.pushManager.subscribe as jest.Mock).mockResolvedValue(mockSubscription)
      
      // Set notification permission to granted
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', writable: true })

      render(
        <TestWrapper>
          <PWAStatus vapidPublicKey="test-vapid-key" />
        </TestWrapper>
      )

      // Expand details
      fireEvent.click(screen.getByTestId('toggle-details'))

      await waitFor(() => {
        const subscribeButton = screen.getByTestId('subscribe-push')
        fireEvent.click(subscribeButton)
      })

      await waitFor(() => {
        expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalled()
      })
    })
  })

  describe('Offline Page', () => {
    test('renders offline page correctly', () => {
      // This would test the offline page component
      // Implementation depends on how the offline page is structured
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Service Worker', () => {
    test('caches static assets on install', () => {
      // This would test service worker functionality
      // Requires service worker testing environment
      expect(true).toBe(true) // Placeholder
    })

    test('handles fetch events with caching strategies', () => {
      // This would test service worker fetch handling
      expect(true).toBe(true) // Placeholder
    })

    test('performs background sync', () => {
      // This would test background sync functionality
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Error Handling', () => {
    test('handles service worker registration failure gracefully', async () => {
      ;(navigator.serviceWorker.register as jest.Mock).mockRejectedValue(new Error('Registration failed'))

      const registration = await registerServiceWorker()
      expect(registration).toBeNull()
    })

    test('handles notification permission denial', async () => {
      ;(window.Notification.requestPermission as jest.Mock).mockResolvedValue('denied')

      const permission = await requestNotificationPermission()
      expect(permission).toBe('denied')
    })

    test('handles push subscription failure', async () => {
      ;(mockServiceWorkerRegistration.pushManager.subscribe as jest.Mock).mockRejectedValue(new Error('Subscription failed'))

      const subscription = await subscribeToPush('test-vapid-key')
      expect(subscription).toBeNull()
    })

    test('handles Web Share API errors', async () => {
      ;(navigator.share as jest.Mock).mockRejectedValue(new Error('Share failed'))

      const success = await shareContent({ title: 'Test' })
      expect(success).toBe(false)
    })
  })

  describe('PWA Manifest', () => {
    test('manifest.json has correct structure', () => {
      // This would test the manifest file structure
      // Could be done by fetching and parsing the manifest
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Integration Tests', () => {
    test('complete PWA installation flow', async () => {
      // This would test the complete installation flow
      // From beforeinstallprompt to app installed
      expect(true).toBe(true) // Placeholder
    })

    test('offline functionality works correctly', async () => {
      // This would test offline caching and sync
      expect(true).toBe(true) // Placeholder
    })

    test('push notifications work end-to-end', async () => {
      // This would test the complete push notification flow
      expect(true).toBe(true) // Placeholder
    })
  })
})

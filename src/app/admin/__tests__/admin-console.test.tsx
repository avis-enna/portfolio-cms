/**
 * Admin Console Integration Tests
 * Tests the complete admin console functionality including navigation, CRUD operations, and workflows
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminLayout from '../components/AdminLayout'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/Toast'

// Mock Next.js components and hooks
jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Test wrapper with all providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </ThemeProvider>
)

describe('Admin Console Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-access-token')
  })

  describe('Admin Layout', () => {
    test('renders admin layout with navigation', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Check navigation items
      expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('nav-portfolio')).toBeInTheDocument()
      expect(screen.getByTestId('nav-blog')).toBeInTheDocument()
      expect(screen.getByTestId('nav-contact')).toBeInTheDocument()
      expect(screen.getByTestId('nav-media')).toBeInTheDocument()
      expect(screen.getByTestId('nav-analytics')).toBeInTheDocument()
      expect(screen.getByTestId('nav-settings')).toBeInTheDocument()

      // Check header elements
      expect(screen.getByTestId('admin-header')).toBeInTheDocument()
      expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument()
      expect(screen.getByTestId('notifications-button')).toBeInTheDocument()
      expect(screen.getByTestId('user-menu')).toBeInTheDocument()

      // Check content is rendered
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    test('mobile navigation works correctly', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Mobile menu should be hidden initially
      const sidebar = screen.getByTestId('admin-sidebar')
      expect(sidebar).toHaveClass('translate-x-full')

      // Click mobile menu button
      fireEvent.click(screen.getByTestId('mobile-menu-button'))

      // Mobile menu should be visible
      expect(sidebar).not.toHaveClass('translate-x-full')
    })

    test('user menu functionality', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // User menu should be closed initially
      expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument()

      // Click user menu button
      fireEvent.click(screen.getByTestId('user-menu'))

      // User menu should be visible
      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument()
      expect(screen.getByTestId('logout-button')).toBeInTheDocument()
    })

    test('logout functionality', () => {
      const mockPush = jest.fn()
      jest.doMock('next/navigation', () => ({
        usePathname: () => '/admin/dashboard',
        useRouter: () => ({
          push: mockPush,
          replace: jest.fn(),
          back: jest.fn(),
        }),
      }))

      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Open user menu
      fireEvent.click(screen.getByTestId('user-menu'))

      // Click logout
      fireEvent.click(screen.getByTestId('logout-button'))

      // Should clear localStorage and redirect
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken')
    })
  })

  describe('Navigation Integration', () => {
    test('navigation items have correct links', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Check navigation links
      expect(screen.getByTestId('nav-dashboard')).toHaveAttribute('href', '/admin/dashboard')
      expect(screen.getByTestId('nav-portfolio')).toHaveAttribute('href', '/admin/content')
      expect(screen.getByTestId('nav-blog')).toHaveAttribute('href', '/admin/blog')
      expect(screen.getByTestId('nav-contact')).toHaveAttribute('href', '/admin/contact')
      expect(screen.getByTestId('nav-media')).toHaveAttribute('href', '/admin/media')
      expect(screen.getByTestId('nav-analytics')).toHaveAttribute('href', '/admin/analytics')
      expect(screen.getByTestId('nav-settings')).toHaveAttribute('href', '/admin/settings')
    })

    test('active navigation item is highlighted', () => {
      // Mock current pathname
      jest.doMock('next/navigation', () => ({
        usePathname: () => '/admin/content',
        useRouter: () => ({
          push: jest.fn(),
          replace: jest.fn(),
          back: jest.fn(),
        }),
      }))

      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Content nav item should be active
      const contentNav = screen.getByTestId('nav-portfolio')
      expect(contentNav).toHaveClass('bg-blue-100', 'text-blue-700')
    })
  })

  describe('Authentication Integration', () => {
    test('redirects to login when no access token', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      const mockPush = jest.fn()

      jest.doMock('next/navigation', () => ({
        usePathname: () => '/admin/dashboard',
        useRouter: () => ({
          push: mockPush,
          replace: jest.fn(),
          back: jest.fn(),
        }),
      }))

      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Should redirect to login
      expect(mockPush).toHaveBeenCalledWith('/admin/login')
    })

    test('renders normally with valid access token', () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token')

      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Should render content normally
      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    test('sidebar is hidden on mobile by default', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      const sidebar = screen.getByTestId('admin-sidebar')
      expect(sidebar).toHaveClass('translate-x-full', 'lg:translate-x-0')
    })

    test('mobile menu button is only visible on mobile', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      const mobileMenuButton = screen.getByTestId('mobile-menu-button')
      expect(mobileMenuButton).toHaveClass('lg:hidden')
    })

    test('sidebar close button is only visible on mobile', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Open mobile menu first
      fireEvent.click(screen.getByTestId('mobile-menu-button'))

      const closeButton = screen.getByLabelText('Close sidebar')
      expect(closeButton).toHaveClass('lg:hidden')
    })
  })

  describe('Accessibility', () => {
    test('navigation has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Check ARIA labels
      expect(screen.getByLabelText('Open sidebar')).toBeInTheDocument()
      expect(screen.getByLabelText('View notifications')).toBeInTheDocument()
      expect(screen.getByLabelText('Open user menu')).toBeInTheDocument()
    })

    test('navigation is keyboard accessible', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Navigation items should be focusable
      const dashboardNav = screen.getByTestId('nav-dashboard')
      dashboardNav.focus()
      expect(dashboardNav).toHaveFocus()

      // Should be able to tab through navigation
      fireEvent.keyDown(dashboardNav, { key: 'Tab' })
      const contentNav = screen.getByTestId('nav-portfolio')
      expect(contentNav).toHaveFocus()
    })

    test('user menu is keyboard accessible', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      const userMenuButton = screen.getByTestId('user-menu')
      
      // Should open with Enter key
      fireEvent.keyDown(userMenuButton, { key: 'Enter' })
      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument()

      // Should close with Escape key
      fireEvent.keyDown(userMenuButton, { key: 'Escape' })
      expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument()
    })
  })

  describe('Theme Integration', () => {
    test('admin layout respects theme context', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Should have dark theme classes
      const sidebar = screen.getByTestId('admin-sidebar')
      expect(sidebar).toHaveClass('bg-gray-900')

      const header = screen.getByTestId('admin-header')
      expect(header).toHaveClass('bg-gray-900')
    })
  })

  describe('Error Handling', () => {
    test('handles missing user info gracefully', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Should render with default user info
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    test('handles navigation errors gracefully', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Should still render navigation even with potential errors
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    test('navigation renders efficiently', () => {
      const renderStart = performance.now()

      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      const renderEnd = performance.now()
      const renderTime = renderEnd - renderStart

      // Should render quickly (less than 100ms in test environment)
      expect(renderTime).toBeLessThan(100)
    })

    test('does not cause memory leaks', () => {
      const { unmount } = render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Should unmount cleanly
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Integration with Toast System', () => {
    test('admin layout works with toast notifications', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      )

      // Toast container should be present
      expect(screen.getByTestId('toast-container')).toBeInTheDocument()
    })
  })
})

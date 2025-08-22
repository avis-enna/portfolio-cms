import { test, expect } from '@playwright/test'
import { loginViaUI, clearAuthTokens, makeAuthenticatedRequest } from '../utils/auth-helpers'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await clearAuthTokens(page)
    
    // Login before each test
    await loginViaUI(page)
  })

  test.describe('Dashboard Layout', () => {
    test('should display admin dashboard correctly', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      // Check main layout elements
      await expect(page.locator('[data-testid="admin-header"]')).toBeVisible()
      await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible()
      await expect(page.locator('[data-testid="admin-main-content"]')).toBeVisible()
      
      // Check header elements
      await expect(page.locator('[data-testid="site-logo"]')).toBeVisible()
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      await expect(page.locator('[data-testid="notifications-button"]')).toBeVisible()
      
      // Check sidebar navigation
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-content"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-blog"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-contact"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible()
    })

    test('should show dashboard statistics', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      // Check statistics cards
      await expect(page.locator('[data-testid="stats-total-posts"]')).toBeVisible()
      await expect(page.locator('[data-testid="stats-total-views"]')).toBeVisible()
      await expect(page.locator('[data-testid="stats-total-contacts"]')).toBeVisible()
      await expect(page.locator('[data-testid="stats-last-updated"]')).toBeVisible()
      
      // Check that statistics have values
      const totalPosts = await page.locator('[data-testid="stats-total-posts"] .stat-value').textContent()
      const totalViews = await page.locator('[data-testid="stats-total-views"] .stat-value').textContent()
      const totalContacts = await page.locator('[data-testid="stats-total-contacts"] .stat-value').textContent()
      
      expect(totalPosts).toMatch(/^\d+$/)
      expect(totalViews).toMatch(/^\d+$/)
      expect(totalContacts).toMatch(/^\d+$/)
    })

    test('should display recent activity', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      // Check recent activity section
      await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible()
      await expect(page.locator('[data-testid="recent-activity-title"]')).toContainText('Recent Activity')
      
      // Should have activity items or empty state
      const activityItems = page.locator('[data-testid="activity-item"]')
      const emptyState = page.locator('[data-testid="no-activity"]')
      
      const hasItems = await activityItems.count() > 0
      const hasEmptyState = await emptyState.isVisible()
      
      expect(hasItems || hasEmptyState).toBe(true)
    })

    test('should display quick actions', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      // Check quick actions section
      await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible()
      await expect(page.locator('[data-testid="quick-actions-title"]')).toContainText('Quick Actions')
      
      // Check action buttons
      await expect(page.locator('[data-testid="action-new-post"]')).toBeVisible()
      await expect(page.locator('[data-testid="action-edit-content"]')).toBeVisible()
      await expect(page.locator('[data-testid="action-view-contacts"]')).toBeVisible()
      await expect(page.locator('[data-testid="action-site-settings"]')).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should navigate to content management', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      await page.click('[data-testid="nav-content"]')
      await page.waitForURL('/admin/content')
      
      await expect(page.locator('[data-testid="content-management"]')).toBeVisible()
      await expect(page.locator('h1')).toContainText('Portfolio Content')
    })

    test('should navigate to blog management', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      await page.click('[data-testid="nav-blog"]')
      await page.waitForURL('/admin/blog')
      
      await expect(page.locator('[data-testid="blog-management"]')).toBeVisible()
      await expect(page.locator('h1')).toContainText('Blog Posts')
    })

    test('should navigate to contact management', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      await page.click('[data-testid="nav-contact"]')
      await page.waitForURL('/admin/contact')
      
      await expect(page.locator('[data-testid="contact-management"]')).toBeVisible()
      await expect(page.locator('h1')).toContainText('Contact Submissions')
    })

    test('should navigate via quick actions', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      // Test new post action
      await page.click('[data-testid="action-new-post"]')
      await page.waitForURL('/admin/blog/new')
      await expect(page.locator('[data-testid="blog-editor"]')).toBeVisible()
      
      // Go back to dashboard
      await page.goto('/admin/dashboard')
      
      // Test edit content action
      await page.click('[data-testid="action-edit-content"]')
      await page.waitForURL('/admin/content')
      await expect(page.locator('[data-testid="content-management"]')).toBeVisible()
    })
  })

  test.describe('User Menu', () => {
    test('should display user information', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      await page.click('[data-testid="user-menu"]')
      
      // Check user menu items
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible()
      await expect(page.locator('[data-testid="user-settings"]')).toBeVisible()
      await expect(page.locator('[data-testid="logout-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="logout-all-button"]')).toBeVisible()
      
      // Check user info display
      await expect(page.locator('[data-testid="user-name"]')).toContainText('admin')
      await expect(page.locator('[data-testid="user-email"]')).toContainText('admin@test.com')
    })

    test('should navigate to user settings', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="user-settings"]')
      
      await page.waitForURL('/admin/settings/profile')
      await expect(page.locator('[data-testid="profile-settings"]')).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/admin/dashboard')
      
      // On mobile, sidebar should be collapsed
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      
      // Sidebar should be hidden initially
      const sidebar = page.locator('[data-testid="admin-sidebar"]')
      await expect(sidebar).toHaveClass(/collapsed|hidden/)
      
      // Click mobile menu to open sidebar
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(sidebar).toBeVisible()
      
      // Navigation should still work
      await page.click('[data-testid="nav-content"]')
      await page.waitForURL('/admin/content')
    })

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/admin/dashboard')
      
      // Should show full layout
      await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible()
      await expect(page.locator('[data-testid="admin-main-content"]')).toBeVisible()
      
      // Statistics should be responsive
      const statsContainer = page.locator('[data-testid="dashboard-stats"]')
      await expect(statsContainer).toBeVisible()
    })
  })

  test.describe('Real-time Updates', () => {
    test('should update statistics in real-time', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      // Get initial contact count
      const initialContacts = await page.locator('[data-testid="stats-total-contacts"] .stat-value').textContent()
      
      // Submit a new contact via API
      await makeAuthenticatedRequest(page, 'POST', '/api/admin/contact', {
        data: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message from e2e test'
        }
      })
      
      // Wait for statistics to update
      await page.waitForFunction(
        (initial) => {
          const current = document.querySelector('[data-testid="stats-total-contacts"] .stat-value')?.textContent
          return current && parseInt(current) > parseInt(initial)
        },
        initialContacts,
        { timeout: 10000 }
      )
      
      // Verify the count increased
      const updatedContacts = await page.locator('[data-testid="stats-total-contacts"] .stat-value').textContent()
      expect(parseInt(updatedContacts!)).toBeGreaterThan(parseInt(initialContacts!))
    })

    test('should show notifications for new activities', async ({ page }) => {
      await page.goto('/admin/dashboard')
      
      // Create a new blog post via API
      await makeAuthenticatedRequest(page, 'POST', '/api/admin/blog', {
        data: {
          title: 'Test Post from E2E',
          content: 'This is a test post created during e2e testing',
          status: 'published'
        }
      })
      
      // Should show notification
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible()
      await expect(page.locator('[data-testid="notification-toast"]')).toContainText('New blog post created')
      
      // Recent activity should update
      await expect(page.locator('[data-testid="activity-item"]').first()).toContainText('Test Post from E2E')
    })
  })

  test.describe('Performance', () => {
    test('should load dashboard quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/admin/dashboard')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
      
      // All critical elements should be visible
      await expect(page.locator('[data-testid="admin-header"]')).toBeVisible()
      await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible()
      await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible()
    })

    test('should handle concurrent users', async ({ page, context }) => {
      // Simulate multiple admin users
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage()
      ])
      
      // Login all users concurrently
      await Promise.all(pages.map(p => loginViaUI(p)))
      
      // Navigate to dashboard concurrently
      await Promise.all(pages.map(p => p.goto('/admin/dashboard')))
      
      // All should load successfully
      await Promise.all(pages.map(p => 
        expect(p.locator('[data-testid="admin-header"]')).toBeVisible()
      ))
      
      // Clean up
      await Promise.all(pages.map(p => p.close()))
    })
  })
})

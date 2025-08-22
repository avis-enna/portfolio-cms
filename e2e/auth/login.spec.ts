import { test, expect } from '@playwright/test'
import { 
  loginViaAPI, 
  loginViaUI, 
  logoutViaUI, 
  clearAuthTokens,
  isAuthenticated,
  waitForAuthState
} from '../utils/auth-helpers'

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await clearAuthTokens(page)
  })

  test.describe('API Login', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      const tokens = await loginViaAPI(page, {
        username: 'admin',
        password: 'testpassword123'
      })

      expect(tokens.accessToken).toBeTruthy()
      expect(tokens.refreshToken).toBeTruthy()
      expect(typeof tokens.accessToken).toBe('string')
      expect(typeof tokens.refreshToken).toBe('string')
    })

    test('should reject invalid credentials', async ({ page }) => {
      const response = await page.request.post('/api/auth/login', {
        data: {
          username: 'admin',
          password: 'wrongpassword'
        },
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status()).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid credentials')
    })

    test('should reject missing username', async ({ page }) => {
      const response = await page.request.post('/api/auth/login', {
        data: {
          password: 'testpassword123'
        },
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Username and password are required')
    })

    test('should reject missing password', async ({ page }) => {
      const response = await page.request.post('/api/auth/login', {
        data: {
          username: 'admin'
        },
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Username and password are required')
    })

    test('should reject invalid content type', async ({ page }) => {
      const response = await page.request.post('/api/auth/login', {
        data: 'username=admin&password=testpassword123',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Content-Type must be application/json')
    })

    test('should reject malformed JSON', async ({ page }) => {
      const response = await page.request.post('/api/auth/login', {
        data: '{"username": "admin", "password":}',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid JSON in request body')
    })
  })

  test.describe('UI Login', () => {
    test('should login successfully via UI', async ({ page }) => {
      await page.goto('/admin/login')
      
      // Verify login form is visible
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
      await expect(page.locator('[data-testid="username-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible()

      // Fill and submit form
      await page.fill('[data-testid="username-input"]', 'admin')
      await page.fill('[data-testid="password-input"]', 'testpassword123')
      await page.click('[data-testid="login-button"]')

      // Wait for redirect to admin dashboard
      await page.waitForURL('/admin/dashboard')
      
      // Verify successful login
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      await expect(page.locator('[data-testid="admin-header"]')).toBeVisible()
      
      // Verify tokens are stored
      const authenticated = await isAuthenticated(page)
      expect(authenticated).toBe(true)
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/admin/login')
      
      // Fill form with invalid credentials
      await page.fill('[data-testid="username-input"]', 'admin')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      await page.click('[data-testid="login-button"]')

      // Should stay on login page
      await expect(page).toHaveURL('/admin/login')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
      
      // Should not be authenticated
      const authenticated = await isAuthenticated(page)
      expect(authenticated).toBe(false)
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/admin/login')
      
      // Try to submit without filling fields
      await page.click('[data-testid="login-button"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="username-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
      
      // Should stay on login page
      await expect(page).toHaveURL('/admin/login')
    })

    test('should handle loading state', async ({ page }) => {
      await page.goto('/admin/login')
      
      // Fill form
      await page.fill('[data-testid="username-input"]', 'admin')
      await page.fill('[data-testid="password-input"]', 'testpassword123')
      
      // Click login and immediately check loading state
      await page.click('[data-testid="login-button"]')
      
      // Should show loading state
      await expect(page.locator('[data-testid="login-button"]')).toBeDisabled()
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    })

    test('should redirect authenticated users away from login page', async ({ page }) => {
      // First login
      await loginViaUI(page)
      
      // Try to access login page again
      await page.goto('/admin/login')
      
      // Should redirect to dashboard
      await page.waitForURL('/admin/dashboard')
      await expect(page.locator('[data-testid="admin-header"]')).toBeVisible()
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Login
      await loginViaUI(page)
      
      // Reload page
      await page.reload()
      
      // Should still be authenticated
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      const authenticated = await isAuthenticated(page)
      expect(authenticated).toBe(true)
    })

    test('should logout successfully', async ({ page }) => {
      // Login first
      await loginViaUI(page)
      
      // Logout
      await logoutViaUI(page)
      
      // Should be redirected to login page
      await expect(page).toHaveURL('/admin/login')
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
      
      // Should not be authenticated
      const authenticated = await isAuthenticated(page)
      expect(authenticated).toBe(false)
    })

    test('should handle logout from all sessions', async ({ page, context }) => {
      // Login in first tab
      await loginViaUI(page)
      
      // Open second tab and login
      const page2 = await context.newPage()
      await loginViaUI(page2)
      
      // Logout from all sessions in first tab
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="logout-all-button"]')
      
      // Both tabs should be logged out
      await page.waitForURL('/admin/login')
      await page2.goto('/admin/dashboard')
      await page2.waitForURL('/admin/login')
      
      await page2.close()
    })
  })
})

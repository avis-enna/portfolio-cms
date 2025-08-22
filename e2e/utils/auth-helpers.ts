import { Page, expect } from '@playwright/test'

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/**
 * Login via API and return tokens
 */
export async function loginViaAPI(
  page: Page,
  credentials: LoginCredentials = {
    username: 'admin',
    password: 'testpassword123'
  }
): Promise<AuthTokens> {
  const response = await page.request.post('/api/auth/login', {
    data: credentials,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data.success).toBe(true)
  expect(data.accessToken).toBeDefined()
  expect(data.refreshToken).toBeDefined()

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  }
}

/**
 * Login via UI form
 */
export async function loginViaUI(
  page: Page,
  credentials: LoginCredentials = {
    username: 'admin',
    password: 'testpassword123'
  }
): Promise<void> {
  await page.goto('/admin/login')
  
  // Fill login form
  await page.fill('[data-testid="username-input"]', credentials.username)
  await page.fill('[data-testid="password-input"]', credentials.password)
  
  // Submit form
  await page.click('[data-testid="login-button"]')
  
  // Wait for successful login (redirect to admin dashboard)
  await page.waitForURL('/admin/dashboard')
  
  // Verify we're logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
}

/**
 * Logout via UI
 */
export async function logoutViaUI(page: Page): Promise<void> {
  // Click user menu
  await page.click('[data-testid="user-menu"]')
  
  // Click logout button
  await page.click('[data-testid="logout-button"]')
  
  // Wait for redirect to login page
  await page.waitForURL('/admin/login')
  
  // Verify we're logged out
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
}

/**
 * Logout via API
 */
export async function logoutViaAPI(
  page: Page,
  refreshToken: string
): Promise<void> {
  const response = await page.request.post('/api/auth/logout', {
    data: { refreshToken },
    headers: {
      'Content-Type': 'application/json',
    },
  })

  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data.success).toBe(true)
}

/**
 * Refresh access token via API
 */
export async function refreshTokenViaAPI(
  page: Page,
  refreshToken: string
): Promise<AuthTokens> {
  const response = await page.request.post('/api/auth/refresh', {
    data: { refreshToken },
    headers: {
      'Content-Type': 'application/json',
    },
  })

  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data.success).toBe(true)
  expect(data.accessToken).toBeDefined()
  expect(data.refreshToken).toBeDefined()

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  }
}

/**
 * Set authentication tokens in browser storage
 */
export async function setAuthTokens(
  page: Page,
  tokens: AuthTokens
): Promise<void> {
  await page.addInitScript((tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
  }, tokens)
}

/**
 * Clear authentication tokens from browser storage
 */
export async function clearAuthTokens(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  })
}

/**
 * Get authentication tokens from browser storage
 */
export async function getAuthTokens(page: Page): Promise<AuthTokens | null> {
  const tokens = await page.evaluate(() => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!accessToken || !refreshToken) {
      return null
    }
    
    return { accessToken, refreshToken }
  })
  
  return tokens
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const tokens = await getAuthTokens(page)
  return tokens !== null
}

/**
 * Make authenticated API request
 */
export async function makeAuthenticatedRequest(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  options: {
    data?: any
    headers?: Record<string, string>
  } = {}
): Promise<any> {
  const tokens = await getAuthTokens(page)
  if (!tokens) {
    throw new Error('No authentication tokens found')
  }

  const headers = {
    'Authorization': `Bearer ${tokens.accessToken}`,
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await page.request.fetch(url, {
    method,
    data: options.data,
    headers,
  })

  if (!response.ok()) {
    throw new Error(`Request failed: ${response.status()} ${response.statusText()}`)
  }

  return response.json()
}

/**
 * Wait for authentication state
 */
export async function waitForAuthState(
  page: Page,
  authenticated: boolean,
  timeout: number = 5000
): Promise<void> {
  await page.waitForFunction(
    (expectedAuth) => {
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const isAuth = !!(accessToken && refreshToken)
      return isAuth === expectedAuth
    },
    authenticated,
    { timeout }
  )
}

/**
 * Comprehensive Test Configuration
 * Central configuration for all testing frameworks
 */

export interface TestConfig {
  // Environment settings
  environment: 'development' | 'test' | 'staging' | 'production'
  baseUrl: string
  apiBaseUrl: string
  
  // Database settings
  database: {
    uri: string
    name: string
    cleanupAfterTests: boolean
  }
  
  // Authentication
  auth: {
    adminEmail: string
    adminPassword: string
    testUserEmail: string
    testUserPassword: string
    jwtSecret: string
  }
  
  // Browser settings
  browsers: {
    headless: boolean
    slowMo: number
    timeout: number
    viewport: {
      width: number
      height: number
    }
  }
  
  // Test data
  testData: {
    useRealData: boolean
    seedDatabase: boolean
    cleanupAfterEach: boolean
  }
  
  // Performance thresholds
  performance: {
    pageLoadTime: number
    apiResponseTime: number
    largestContentfulPaint: number
    firstInputDelay: number
    cumulativeLayoutShift: number
  }
  
  // Accessibility settings
  accessibility: {
    wcagLevel: 'A' | 'AA' | 'AAA'
    includeWarnings: boolean
    disableColorContrast: boolean
  }
  
  // Visual regression
  visualRegression: {
    threshold: number
    updateSnapshots: boolean
    failureThreshold: number
  }
  
  // API testing
  api: {
    timeout: number
    retries: number
    rateLimit: {
      enabled: boolean
      maxRequests: number
      windowMs: number
    }
  }
  
  // Mobile testing
  mobile: {
    devices: string[]
    orientations: ('portrait' | 'landscape')[]
  }
  
  // Reporting
  reporting: {
    outputDir: string
    formats: ('html' | 'json' | 'junit' | 'allure')[]
    includeScreenshots: boolean
    includeVideos: boolean
    includeTraces: boolean
  }
}

// Default configuration
const defaultConfig: TestConfig = {
  environment: (process.env.NODE_ENV as any) || 'test',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  
  database: {
    uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/portfolio-cms-test',
    name: 'portfolio-cms-test',
    cleanupAfterTests: true
  },
  
  auth: {
    adminEmail: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
    adminPassword: process.env.TEST_ADMIN_PASSWORD || 'testpassword123',
    testUserEmail: process.env.TEST_USER_EMAIL || 'user@test.com',
    testUserPassword: process.env.TEST_USER_PASSWORD || 'userpassword123',
    jwtSecret: process.env.TEST_JWT_SECRET || 'test-jwt-secret'
  },
  
  browsers: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO || '0'),
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
    viewport: {
      width: parseInt(process.env.VIEWPORT_WIDTH || '1920'),
      height: parseInt(process.env.VIEWPORT_HEIGHT || '1080')
    }
  },
  
  testData: {
    useRealData: process.env.USE_REAL_DATA === 'true',
    seedDatabase: process.env.SEED_DATABASE !== 'false',
    cleanupAfterEach: process.env.CLEANUP_AFTER_EACH !== 'false'
  },
  
  performance: {
    pageLoadTime: 5000, // 5 seconds
    apiResponseTime: 2000, // 2 seconds
    largestContentfulPaint: 2500, // 2.5 seconds
    firstInputDelay: 100, // 100ms
    cumulativeLayoutShift: 0.1 // 0.1
  },
  
  accessibility: {
    wcagLevel: 'AA',
    includeWarnings: true,
    disableColorContrast: false
  },
  
  visualRegression: {
    threshold: 0.2,
    updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
    failureThreshold: 0.3
  },
  
  api: {
    timeout: 10000,
    retries: 2,
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    }
  },
  
  mobile: {
    devices: ['iPhone 12', 'Pixel 5', 'iPad Pro'],
    orientations: ['portrait', 'landscape']
  },
  
  reporting: {
    outputDir: 'test-results',
    formats: ['html', 'json', 'junit'],
    includeScreenshots: true,
    includeVideos: true,
    includeTraces: true
  }
}

// Environment-specific overrides
const environmentConfigs: Partial<Record<TestConfig['environment'], Partial<TestConfig>>> = {
  development: {
    browsers: {
      ...defaultConfig.browsers,
      headless: false,
      slowMo: 100
    },
    testData: {
      ...defaultConfig.testData,
      cleanupAfterEach: false
    }
  },
  
  test: {
    // Use defaults
  },
  
  staging: {
    baseUrl: process.env.STAGING_URL || 'https://staging.portfolio-cms.com',
    apiBaseUrl: process.env.STAGING_API_URL || 'https://staging.portfolio-cms.com/api',
    database: {
      ...defaultConfig.database,
      uri: process.env.STAGING_MONGODB_URI || defaultConfig.database.uri
    },
    testData: {
      ...defaultConfig.testData,
      useRealData: true,
      cleanupAfterEach: false
    }
  },
  
  production: {
    baseUrl: process.env.PRODUCTION_URL || 'https://portfolio-cms.com',
    apiBaseUrl: process.env.PRODUCTION_API_URL || 'https://portfolio-cms.com/api',
    testData: {
      ...defaultConfig.testData,
      useRealData: true,
      seedDatabase: false,
      cleanupAfterEach: false
    },
    performance: {
      ...defaultConfig.performance,
      pageLoadTime: 3000, // Stricter for production
      apiResponseTime: 1000,
      largestContentfulPaint: 2000
    }
  }
}

// Merge configuration based on environment
function createConfig(): TestConfig {
  const environment = defaultConfig.environment
  const envConfig = environmentConfigs[environment] || {}
  
  return {
    ...defaultConfig,
    ...envConfig,
    // Deep merge nested objects
    database: { ...defaultConfig.database, ...envConfig.database },
    auth: { ...defaultConfig.auth, ...envConfig.auth },
    browsers: { ...defaultConfig.browsers, ...envConfig.browsers },
    testData: { ...defaultConfig.testData, ...envConfig.testData },
    performance: { ...defaultConfig.performance, ...envConfig.performance },
    accessibility: { ...defaultConfig.accessibility, ...envConfig.accessibility },
    visualRegression: { ...defaultConfig.visualRegression, ...envConfig.visualRegression },
    api: { ...defaultConfig.api, ...envConfig.api },
    mobile: { ...defaultConfig.mobile, ...envConfig.mobile },
    reporting: { ...defaultConfig.reporting, ...envConfig.reporting }
  }
}

export const testConfig = createConfig()

// Test environment validation
export function validateTestEnvironment(): void {
  const requiredEnvVars = [
    'NODE_ENV',
    'BASE_URL'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`)
    console.warn('Using default values. Set these variables for better test configuration.')
  }
  
  // Validate URLs
  try {
    new URL(testConfig.baseUrl)
    new URL(testConfig.apiBaseUrl)
  } catch (error) {
    throw new Error(`Invalid URL configuration: ${error}`)
  }
  
  // Validate performance thresholds
  if (testConfig.performance.pageLoadTime < 1000) {
    console.warn('Page load time threshold is very low (<1s). Consider increasing for realistic testing.')
  }
  
  console.log(`Test configuration loaded for environment: ${testConfig.environment}`)
  console.log(`Base URL: ${testConfig.baseUrl}`)
  console.log(`Headless mode: ${testConfig.browsers.headless}`)
}

// Helper functions for test configuration
export const testHelpers = {
  /**
   * Get browser configuration for Playwright
   */
  getPlaywrightConfig() {
    return {
      baseURL: testConfig.baseUrl,
      timeout: testConfig.browsers.timeout,
      headless: testConfig.browsers.headless,
      viewport: testConfig.browsers.viewport,
      slowMo: testConfig.browsers.slowMo
    }
  },
  
  /**
   * Get Selenium configuration
   */
  getSeleniumConfig() {
    return {
      baseUrl: testConfig.baseUrl,
      timeout: testConfig.browsers.timeout,
      headless: testConfig.browsers.headless,
      viewport: testConfig.browsers.viewport
    }
  },
  
  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return testConfig.database
  },
  
  /**
   * Get authentication configuration
   */
  getAuthConfig() {
    return testConfig.auth
  },
  
  /**
   * Check if running in CI environment
   */
  isCI(): boolean {
    return !!(process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL)
  },
  
  /**
   * Get test data configuration
   */
  getTestDataConfig() {
    return testConfig.testData
  },
  
  /**
   * Get performance thresholds
   */
  getPerformanceThresholds() {
    return testConfig.performance
  },
  
  /**
   * Get accessibility configuration
   */
  getAccessibilityConfig() {
    return testConfig.accessibility
  }
}

// Export for use in test files
export default testConfig

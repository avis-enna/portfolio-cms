import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')

  // Set up environment variables for testing
  process.env.NODE_ENV = 'test'
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio-cms-test'
  process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-tests'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-e2e-tests'
  process.env.ADMIN_USERNAME = 'admin'
  process.env.ADMIN_EMAIL = 'admin@test.com'
  process.env.ADMIN_PASSWORD = 'testpassword123'

  // Launch browser for authentication setup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Wait for the dev server to be ready
    console.log('⏳ Waiting for dev server...')
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3000')
    await page.waitForLoadState('networkidle')
    console.log('✅ Dev server is ready')

    // Set up test data if needed
    console.log('📝 Setting up test data...')
    
    // You can add database seeding here if needed
    // await seedTestDatabase()
    
    console.log('✅ Test data setup complete')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }

  console.log('✅ Global setup complete')
}

export default globalSetup

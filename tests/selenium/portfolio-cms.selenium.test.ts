/**
 * Selenium WebDriver Tests for Portfolio CMS
 * Cross-browser compatibility and comprehensive UI testing
 */

import { Builder, WebDriver, By, until, Key, Actions } from 'selenium-webdriver'
import { Options as ChromeOptions } from 'selenium-webdriver/chrome'
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox'
import { Options as EdgeOptions } from 'selenium-webdriver/edge'

// Test configuration
interface TestConfig {
  baseUrl: string
  timeout: number
  browsers: string[]
  headless: boolean
}

const config: TestConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  browsers: ['chrome', 'firefox', 'edge'],
  headless: process.env.HEADLESS !== 'false'
}

// Test data
const testData = {
  admin: {
    email: 'admin@test.com',
    password: 'testpassword123'
  },
  portfolio: {
    name: 'John Selenium Tester',
    title: 'Selenium Test Engineer',
    email: 'john@selenium.test',
    tagline: 'Testing with Selenium WebDriver',
    bio: 'Experienced test engineer specializing in automated testing with Selenium WebDriver.'
  },
  openai: {
    validKey: 'sk-test-valid-key-123',
    invalidKey: 'invalid-key-123'
  }
}

describe('Portfolio CMS - Selenium WebDriver Tests', () => {
  let driver: WebDriver
  let actions: Actions

  // Test each browser
  config.browsers.forEach(browserName => {
    describe(`${browserName.toUpperCase()} Browser Tests`, () => {
      beforeAll(async () => {
        driver = await createWebDriver(browserName)
        actions = new Actions(driver)
        await driver.manage().setTimeouts({ implicit: config.timeout })
      })

      afterAll(async () => {
        if (driver) {
          await driver.quit()
        }
      })

      beforeEach(async () => {
        // Clear cookies and local storage
        await driver.manage().deleteAllCookies()
        await driver.executeScript('localStorage.clear(); sessionStorage.clear();')
      })

      describe('Setup Wizard Flow', () => {
        test('should complete full setup wizard', async () => {
          // Navigate to homepage (should redirect to setup)
          await driver.get(config.baseUrl)
          
          // Wait for setup wizard to load
          await driver.wait(until.elementLocated(By.css('h1')), config.timeout)
          const title = await driver.findElement(By.css('h1')).getText()
          expect(title).toContain('Portfolio Setup')

          // Step 1: Personal Information
          await fillPersonalInformation()
          await clickNext()

          // Step 2: Social Links (optional, skip)
          await clickNext()

          // Step 3: Features
          await configureFeatures()
          await clickNext()

          // Step 4: Theme
          await configureTheme()
          await clickNext()

          // Step 5: Complete
          await completeSetup()

          // Verify redirect to admin dashboard
          await driver.wait(until.urlContains('/admin'), config.timeout)
          const currentUrl = await driver.getCurrentUrl()
          expect(currentUrl).toContain('/admin')
        })

        test('should validate required fields', async () => {
          await driver.get(`${config.baseUrl}/admin/setup`)
          
          // Try to proceed without filling required fields
          const nextButton = await driver.findElement(By.css('button:contains("Next")'))
          await nextButton.click()

          // Check for validation errors
          const errors = await driver.findElements(By.css('.error-message, .validation-error'))
          expect(errors.length).toBeGreaterThan(0)

          // Verify next button is disabled
          const isDisabled = await nextButton.getAttribute('disabled')
          expect(isDisabled).toBeTruthy()
        })

        test('should preserve data when navigating between steps', async () => {
          await driver.get(`${config.baseUrl}/admin/setup`)
          
          // Fill personal information
          await fillPersonalInformation()
          await clickNext()
          
          // Go back to previous step
          await driver.findElement(By.css('button:contains("Previous")')).click()
          
          // Verify data is preserved
          const nameValue = await driver.findElement(By.name('name')).getAttribute('value')
          expect(nameValue).toBe(testData.portfolio.name)
        })
      })

      describe('Admin Authentication', () => {
        test('should redirect unauthenticated users to login', async () => {
          await driver.get(`${config.baseUrl}/admin`)
          
          await driver.wait(until.urlContains('/login'), config.timeout)
          const currentUrl = await driver.getCurrentUrl()
          expect(currentUrl).toContain('/login')
        })

        test('should login with valid credentials', async () => {
          await driver.get(`${config.baseUrl}/admin/login`)
          
          // Fill login form
          await driver.findElement(By.name('email')).sendKeys(testData.admin.email)
          await driver.findElement(By.name('password')).sendKeys(testData.admin.password)
          await driver.findElement(By.css('button[type="submit"]')).click()
          
          // Wait for redirect to admin dashboard
          await driver.wait(until.urlContains('/admin'), config.timeout)
          
          // Verify dashboard elements
          const dashboardTitle = await driver.findElement(By.css('h1')).getText()
          expect(dashboardTitle).toContain('Dashboard')
        })

        test('should show error for invalid credentials', async () => {
          await driver.get(`${config.baseUrl}/admin/login`)
          
          await driver.findElement(By.name('email')).sendKeys('invalid@email.com')
          await driver.findElement(By.name('password')).sendKeys('wrongpassword')
          await driver.findElement(By.css('button[type="submit"]')).click()
          
          // Check for error message
          const errorMessage = await driver.wait(
            until.elementLocated(By.css('.error-message, .alert-error')),
            config.timeout
          )
          const errorText = await errorMessage.getText()
          expect(errorText).toContain('Invalid credentials')
        })
      })

      describe('API Keys Management', () => {
        beforeEach(async () => {
          await loginAsAdmin()
        })

        test('should navigate to API keys page', async () => {
          await driver.get(`${config.baseUrl}/admin/settings/api-keys`)
          
          await driver.wait(until.elementLocated(By.css('h1')), config.timeout)
          const title = await driver.findElement(By.css('h1')).getText()
          expect(title).toContain('API Keys')
        })

        test('should configure OpenAI API key', async () => {
          await driver.get(`${config.baseUrl}/admin/settings/api-keys`)
          
          // Enter API key
          const apiKeyInput = await driver.findElement(By.css('input[placeholder="sk-..."]'))
          await apiKeyInput.clear()
          await apiKeyInput.sendKeys(testData.openai.validKey)
          
          // Test connection
          const testButton = await driver.findElement(By.css('[data-testid="test-openai-button"]'))
          await testButton.click()
          
          // Wait for test result
          await driver.wait(until.elementLocated(By.css('.success-message, .error-message')), config.timeout)
          
          // Save settings
          const saveButton = await driver.findElement(By.css('[data-testid="save-settings-button"]'))
          await saveButton.click()
          
          // Verify success message
          const successMessage = await driver.wait(
            until.elementLocated(By.css('.success-message')),
            config.timeout
          )
          const messageText = await successMessage.getText()
          expect(messageText).toContain('saved successfully')
        })

        test('should handle invalid API key', async () => {
          await driver.get(`${config.baseUrl}/admin/settings/api-keys`)
          
          // Enter invalid API key
          const apiKeyInput = await driver.findElement(By.css('input[placeholder="sk-..."]'))
          await apiKeyInput.clear()
          await apiKeyInput.sendKeys(testData.openai.invalidKey)
          
          // Test connection
          const testButton = await driver.findElement(By.css('[data-testid="test-openai-button"]'))
          await testButton.click()
          
          // Wait for error message
          const errorMessage = await driver.wait(
            until.elementLocated(By.css('.error-message')),
            config.timeout
          )
          const errorText = await errorMessage.getText()
          expect(errorText).toContain('connection failed')
        })

        test('should toggle API key visibility', async () => {
          await driver.get(`${config.baseUrl}/admin/settings/api-keys`)
          
          const apiKeyInput = await driver.findElement(By.css('input[placeholder="sk-..."]'))
          await apiKeyInput.sendKeys(testData.openai.validKey)
          
          // Check initial type is password
          let inputType = await apiKeyInput.getAttribute('type')
          expect(inputType).toBe('password')
          
          // Click toggle button
          const toggleButton = await driver.findElement(By.css('[data-testid="openai-key-toggle"]'))
          await toggleButton.click()
          
          // Check type changed to text
          inputType = await apiKeyInput.getAttribute('type')
          expect(inputType).toBe('text')
        })
      })

      describe('Responsive Design', () => {
        test('should adapt to mobile viewport', async () => {
          // Set mobile viewport
          await driver.manage().window().setRect({ width: 375, height: 667 })
          
          await loginAsAdmin()
          await driver.get(`${config.baseUrl}/admin`)
          
          // Check for mobile navigation
          const hamburgerMenu = await driver.findElement(By.css('[data-testid="hamburger-menu"]'))
          expect(await hamburgerMenu.isDisplayed()).toBe(true)
          
          // Check that full navigation is hidden
          const fullNav = await driver.findElements(By.css('[data-testid="full-navigation"]'))
          if (fullNav.length > 0) {
            expect(await fullNav[0].isDisplayed()).toBe(false)
          }
        })

        test('should adapt to tablet viewport', async () => {
          // Set tablet viewport
          await driver.manage().window().setRect({ width: 768, height: 1024 })
          
          await loginAsAdmin()
          await driver.get(`${config.baseUrl}/admin`)
          
          // Verify layout adapts to tablet size
          const container = await driver.findElement(By.css('.container, .main-content'))
          const width = await container.getSize()
          expect(width.width).toBeLessThanOrEqual(768)
        })

        test('should show full navigation on desktop', async () => {
          // Set desktop viewport
          await driver.manage().window().setRect({ width: 1920, height: 1080 })
          
          await loginAsAdmin()
          await driver.get(`${config.baseUrl}/admin`)
          
          // Check for full navigation
          const fullNav = await driver.findElement(By.css('[data-testid="full-navigation"]'))
          expect(await fullNav.isDisplayed()).toBe(true)
          
          // Check that hamburger menu is hidden
          const hamburgerMenus = await driver.findElements(By.css('[data-testid="hamburger-menu"]'))
          if (hamburgerMenus.length > 0) {
            expect(await hamburgerMenus[0].isDisplayed()).toBe(false)
          }
        })
      })

      describe('Accessibility', () => {
        test('should have proper heading hierarchy', async () => {
          await driver.get(config.baseUrl)
          
          const h1Elements = await driver.findElements(By.css('h1'))
          expect(h1Elements.length).toBe(1)
          
          const headings = await driver.findElements(By.css('h1, h2, h3, h4, h5, h6'))
          expect(headings.length).toBeGreaterThan(0)
        })

        test('should have alt text for images', async () => {
          await driver.get(config.baseUrl)
          
          const images = await driver.findElements(By.css('img'))
          for (const img of images) {
            const alt = await img.getAttribute('alt')
            expect(alt).toBeTruthy()
          }
        })

        test('should have labels for form inputs', async () => {
          await driver.get(`${config.baseUrl}/admin/setup`)
          
          const inputs = await driver.findElements(By.css('input, textarea, select'))
          for (const input of inputs) {
            const id = await input.getAttribute('id')
            const name = await input.getAttribute('name')
            
            if (id) {
              const label = await driver.findElements(By.css(`label[for="${id}"]`))
              expect(label.length).toBeGreaterThan(0)
            } else if (name) {
              // Check for aria-label or placeholder
              const ariaLabel = await input.getAttribute('aria-label')
              const placeholder = await input.getAttribute('placeholder')
              expect(ariaLabel || placeholder).toBeTruthy()
            }
          }
        })

        test('should be keyboard navigable', async () => {
          await driver.get(`${config.baseUrl}/admin/setup`)
          
          // Tab through form elements
          const body = await driver.findElement(By.css('body'))
          await body.sendKeys(Key.TAB)
          
          const activeElement = await driver.switchTo().activeElement()
          const tagName = await activeElement.getTagName()
          expect(['input', 'button', 'select', 'textarea', 'a']).toContain(tagName.toLowerCase())
        })
      })

      describe('Performance', () => {
        test('should load pages within acceptable time', async () => {
          const startTime = Date.now()
          await driver.get(config.baseUrl)
          
          // Wait for page to be fully loaded
          await driver.wait(until.elementLocated(By.css('body')), config.timeout)
          
          const loadTime = Date.now() - startTime
          expect(loadTime).toBeLessThan(5000) // 5 seconds max
        })

        test('should have no JavaScript errors', async () => {
          await driver.get(config.baseUrl)
          
          // Get browser logs
          const logs = await driver.manage().logs().get('browser')
          const errors = logs.filter(log => log.level.name === 'SEVERE')
          
          expect(errors.length).toBe(0)
        })
      })

      // Helper functions
      async function createWebDriver(browserName: string): Promise<WebDriver> {
        let options: any
        
        switch (browserName) {
          case 'chrome':
            options = new ChromeOptions()
            if (config.headless) {
              options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage')
            }
            return new Builder().forBrowser('chrome').setChromeOptions(options).build()
            
          case 'firefox':
            options = new FirefoxOptions()
            if (config.headless) {
              options.addArguments('--headless')
            }
            return new Builder().forBrowser('firefox').setFirefoxOptions(options).build()
            
          case 'edge':
            options = new EdgeOptions()
            if (config.headless) {
              options.addArguments('--headless')
            }
            return new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(options).build()
            
          default:
            throw new Error(`Unsupported browser: ${browserName}`)
        }
      }

      async function fillPersonalInformation() {
        await driver.findElement(By.name('name')).sendKeys(testData.portfolio.name)
        await driver.findElement(By.name('title')).sendKeys(testData.portfolio.title)
        await driver.findElement(By.name('email')).sendKeys(testData.portfolio.email)
        await driver.findElement(By.name('tagline')).sendKeys(testData.portfolio.tagline)
        await driver.findElement(By.name('bio')).sendKeys(testData.portfolio.bio)
      }

      async function configureFeatures() {
        // Enable AI features
        const aiToggle = await driver.findElement(By.css('[data-feature="ai"] input[type="checkbox"]'))
        if (!await aiToggle.isSelected()) {
          await aiToggle.click()
        }
        
        // Enable analytics
        const analyticsToggle = await driver.findElement(By.css('[data-feature="analytics"] input[type="checkbox"]'))
        if (!await analyticsToggle.isSelected()) {
          await analyticsToggle.click()
        }
      }

      async function configureTheme() {
        // Select theme
        const themeSelect = await driver.findElement(By.name('theme'))
        await themeSelect.sendKeys('default')
        
        // Set primary color
        const colorInput = await driver.findElement(By.name('primaryColor'))
        await colorInput.clear()
        await colorInput.sendKeys('#2563eb')
      }

      async function completeSetup() {
        const completeButton = await driver.findElement(By.css('button:contains("Complete Setup")'))
        await completeButton.click()
        
        // Wait for completion
        await driver.wait(until.elementLocated(By.css('.success-message, [data-testid="success-message"]')), config.timeout)
      }

      async function clickNext() {
        const nextButton = await driver.findElement(By.css('button:contains("Next")'))
        await nextButton.click()
        await driver.sleep(500) // Wait for step transition
      }

      async function loginAsAdmin() {
        await driver.get(`${config.baseUrl}/admin/login`)
        await driver.findElement(By.name('email')).sendKeys(testData.admin.email)
        await driver.findElement(By.name('password')).sendKeys(testData.admin.password)
        await driver.findElement(By.css('button[type="submit"]')).click()
        await driver.wait(until.urlContains('/admin'), config.timeout)
      }
    })
  })
})

/**
 * Cucumber Step Definitions for Admin Setup and Configuration
 * Comprehensive test steps for Portfolio CMS features
 */

import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { Page, Browser, BrowserContext } from 'playwright'
import { TestWorld } from '../support/world'

// Page Object Models
import { SetupWizardPage } from '../pages/setup-wizard.page'
import { AdminDashboardPage } from '../pages/admin-dashboard.page'
import { APIKeysPage } from '../pages/api-keys.page'
import { LoginPage } from '../pages/login.page'
import { PortfolioHomePage } from '../pages/portfolio-home.page'

// Test utilities
import { DatabaseHelper } from '../support/database-helper'
import { AuthHelper } from '../support/auth-helper'
import { TestDataFactory } from '../support/test-data-factory'

// Global test context
let page: Page
let context: BrowserContext
let browser: Browser
let world: TestWorld

// Page objects
let setupWizardPage: SetupWizardPage
let adminDashboardPage: AdminDashboardPage
let apiKeysPage: APIKeysPage
let loginPage: LoginPage
let portfolioHomePage: PortfolioHomePage

// Test helpers
let dbHelper: DatabaseHelper
let authHelper: AuthHelper
let testDataFactory: TestDataFactory

Before(async function() {
  // Initialize test world
  world = new TestWorld()
  
  // Initialize browser and page
  browser = await world.getBrowser()
  context = await browser.newContext()
  page = await context.newPage()
  
  // Initialize page objects
  setupWizardPage = new SetupWizardPage(page)
  adminDashboardPage = new AdminDashboardPage(page)
  apiKeysPage = new APIKeysPage(page)
  loginPage = new LoginPage(page)
  portfolioHomePage = new PortfolioHomePage(page)
  
  // Initialize helpers
  dbHelper = new DatabaseHelper()
  authHelper = new AuthHelper(page)
  testDataFactory = new TestDataFactory()
  
  // Set up test environment
  await dbHelper.connect()
})

After(async function() {
  // Cleanup
  await dbHelper.cleanup()
  await dbHelper.disconnect()
  await context.close()
  await browser.close()
})

// Background steps
Given('I have a fresh Portfolio CMS installation', async function() {
  await dbHelper.resetDatabase()
  await page.goto('/')
})

Given('the database is clean', async function() {
  await dbHelper.clearAllCollections()
})

Given('no configuration exists', async function() {
  await dbHelper.removeConfiguration()
})

// Setup wizard steps
Given('I navigate to the portfolio homepage', async function() {
  await portfolioHomePage.navigate()
})

When('I am redirected to the setup wizard', async function() {
  await expect(page).toHaveURL(/\/admin\/setup/)
  await setupWizardPage.waitForLoad()
})

When('I complete the personal information step with:', async function(dataTable) {
  const data = dataTable.rowsHash()
  await setupWizardPage.fillPersonalInformation({
    name: data.name,
    title: data.title,
    tagline: data.tagline,
    email: data.email,
    location: data.location,
    bio: data.bio
  })
})

When('I complete the social links step with:', async function(dataTable) {
  const socialLinks = {}
  for (const row of dataTable.hashes()) {
    socialLinks[row.platform] = row.url
  }
  await setupWizardPage.fillSocialLinks(socialLinks)
})

When('I configure features:', async function(dataTable) {
  const features = {}
  for (const row of dataTable.hashes()) {
    features[row.feature] = row.enabled === 'true'
  }
  await setupWizardPage.configureFeatures(features)
})

When('I select theme configuration:', async function(dataTable) {
  const themeConfig = dataTable.rowsHash()
  await setupWizardPage.configureTheme(themeConfig)
})

When('I complete the setup wizard', async function() {
  await setupWizardPage.completeSetup()
})

Then('I should see a success message', async function() {
  await expect(setupWizardPage.successMessage).toBeVisible()
})

Then('I should be redirected to the admin dashboard', async function() {
  await expect(page).toHaveURL(/\/admin/)
  await adminDashboardPage.waitForLoad()
})

Then('the portfolio should be marked as configured', async function() {
  const isConfigured = await dbHelper.isPortfolioConfigured()
  expect(isConfigured).toBe(true)
})

// Validation steps
Given('I navigate to the setup wizard', async function() {
  await setupWizardPage.navigate()
})

When('I try to proceed without entering required information', async function() {
  await setupWizardPage.clickNext()
})

Then('I should see validation errors for:', async function(dataTable) {
  for (const row of dataTable.hashes()) {
    await expect(setupWizardPage.getValidationError(row.field)).toContainText(row.error)
  }
})

Then('the next button should be disabled', async function() {
  await expect(setupWizardPage.nextButton).toBeDisabled()
})

When('I enter valid information', async function() {
  const validData = testDataFactory.createValidPersonalInfo()
  await setupWizardPage.fillPersonalInformation(validData)
})

Then('the validation errors should disappear', async function() {
  await expect(setupWizardPage.validationErrors).toHaveCount(0)
})

Then('the next button should be enabled', async function() {
  await expect(setupWizardPage.nextButton).toBeEnabled()
})

// Navigation steps
Given('I am on the setup wizard', async function() {
  await setupWizardPage.navigate()
})

When('I complete the first step', async function() {
  const validData = testDataFactory.createValidPersonalInfo()
  await setupWizardPage.fillPersonalInformation(validData)
})

When('I click next', async function() {
  await setupWizardPage.clickNext()
})

Then('I should be on step {int}', async function(stepNumber: number) {
  await expect(setupWizardPage.getCurrentStep()).toBe(stepNumber)
})

When('I click previous', async function() {
  await setupWizardPage.clickPrevious()
})

Then('my entered data should be preserved', async function() {
  const preservedData = await setupWizardPage.getPersonalInformationData()
  expect(preservedData.name).toBeTruthy()
  expect(preservedData.email).toBeTruthy()
})

// Authentication steps
Given('the portfolio is configured', async function() {
  await dbHelper.createConfiguredPortfolio()
})

When('I navigate to {string} without authentication', async function(url: string) {
  await page.goto(url)
})

Then('I should be redirected to the login page', async function() {
  await expect(page).toHaveURL(/\/admin\/login/)
})

When('I login with valid credentials', async function() {
  const credentials = testDataFactory.createAdminCredentials()
  await authHelper.login(credentials.email, credentials.password)
})

Then('I should access the admin dashboard', async function() {
  await expect(page).toHaveURL(/\/admin/)
  await adminDashboardPage.waitForLoad()
})

Then('I should see all navigation items:', async function(dataTable) {
  for (const row of dataTable.hashes()) {
    await expect(adminDashboardPage.getNavigationItem(row.item)).toBeVisible()
  }
})

// Dashboard steps
Given('I am logged into the admin dashboard', async function() {
  await authHelper.loginAsAdmin()
  await adminDashboardPage.navigate()
})

Then('I should see dashboard statistics:', async function(dataTable) {
  for (const row of dataTable.hashes()) {
    const metric = await adminDashboardPage.getMetric(row.metric)
    expect(typeof metric).toBe(row.type)
  }
})

Then('I should see recent activity feed', async function() {
  await expect(adminDashboardPage.activityFeed).toBeVisible()
})

Then('I should see quick action buttons', async function() {
  await expect(adminDashboardPage.quickActions).toBeVisible()
})

Then('all dashboard widgets should load without errors', async function() {
  const errors = await page.locator('.error, .error-message').count()
  expect(errors).toBe(0)
})

// Responsive design steps
When('I resize the browser to mobile size', async function() {
  await page.setViewportSize({ width: 375, height: 667 })
})

Then('the navigation should collapse to a hamburger menu', async function() {
  await expect(adminDashboardPage.hamburgerMenu).toBeVisible()
  await expect(adminDashboardPage.fullNavigation).toBeHidden()
})

Then('all dashboard content should be mobile-friendly', async function() {
  const mobileElements = await page.locator('[data-mobile-friendly]').count()
  expect(mobileElements).toBeGreaterThan(0)
})

When('I resize to tablet size', async function() {
  await page.setViewportSize({ width: 768, height: 1024 })
})

Then('the layout should adapt appropriately', async function() {
  // Check that layout adapts to tablet size
  const tabletLayout = await page.locator('[data-tablet-layout]').isVisible()
  expect(tabletLayout).toBe(true)
})

When('I resize to desktop size', async function() {
  await page.setViewportSize({ width: 1920, height: 1080 })
})

Then('the full navigation should be visible', async function() {
  await expect(adminDashboardPage.fullNavigation).toBeVisible()
  await expect(adminDashboardPage.hamburgerMenu).toBeHidden()
})

// API Keys steps
When('I navigate to {string}', async function(path: string) {
  if (path === 'Settings > API Keys') {
    await adminDashboardPage.navigateToAPIKeys()
  } else {
    await page.goto(path)
  }
})

Then('I should see the API keys configuration page', async function() {
  await expect(page).toHaveURL(/\/admin\/settings\/api-keys/)
  await apiKeysPage.waitForLoad()
})

Then('I should see OpenAI integration section with {string} status', async function(status: string) {
  await expect(apiKeysPage.openAIStatus).toContainText(status)
})

When('I enter a valid OpenAI API key {string}', async function(apiKey: string) {
  await apiKeysPage.enterOpenAIKey(apiKey)
})

When('I click {string}', async function(buttonText: string) {
  if (buttonText === 'Test Connection') {
    await apiKeysPage.testConnection()
  } else if (buttonText === 'Generate Content') {
    await page.click('button:has-text("Generate Content")')
  } else {
    await page.click(`button:has-text("${buttonText}")`)
  }
})

Then('I should see a loading indicator', async function() {
  await expect(page.locator('.loading, .spinner, [data-loading]')).toBeVisible()
})

Then('I should see {string} message', async function(message: string) {
  await expect(page.locator(`text=${message}`)).toBeVisible()
})

Then('the status should change to {string}', async function(status: string) {
  await expect(apiKeysPage.openAIStatus).toContainText(status)
})

When('I save the settings', async function() {
  await apiKeysPage.saveSettings()
})

// API key validation steps
Given('I am on the API keys configuration page', async function() {
  await apiKeysPage.navigate()
})

When('I enter an invalid OpenAI API key {string}', async function(invalidKey: string) {
  await apiKeysPage.enterOpenAIKey(invalidKey)
})

Then('I should see {string} error', async function(errorMessage: string) {
  await expect(page.locator(`text=${errorMessage}`)).toBeVisible()
})

Then('the status should remain {string}', async function(status: string) {
  await expect(apiKeysPage.openAIStatus).toContainText(status)
})

When('I leave the API key field empty', async function() {
  await apiKeysPage.clearOpenAIKey()
})

// AI content generation steps
Given('I have configured a valid OpenAI API key', async function() {
  await dbHelper.setValidOpenAIKey()
})

Given('I am on the content management page', async function() {
  await page.goto('/admin/content')
})

When('I click on {string} for portfolio summary', async function(buttonText: string) {
  await page.click(`[data-content-type="portfolio_summary"] button:has-text("${buttonText}")`)
})

Then('I should see the AI content generator modal', async function() {
  await expect(page.locator('[data-testid="ai-generator-modal"]')).toBeVisible()
})

When('I select tone {string} and length {string}', async function(tone: string, length: string) {
  await page.selectOption('[data-testid="tone-select"]', tone)
  await page.selectOption('[data-testid="length-select"]', length)
})

Then('I should see generated content variations', async function() {
  await expect(page.locator('[data-testid="content-variations"]')).toBeVisible()
})

When('I select a variation and click {string}', async function(buttonText: string) {
  await page.click('[data-testid="content-variation"]:first-child')
  await page.click(`button:has-text("${buttonText}")`)
})

Then('the content should be inserted into the form', async function() {
  const content = await page.inputValue('[data-testid="content-input"]')
  expect(content.length).toBeGreaterThan(0)
})

Then('the modal should close', async function() {
  await expect(page.locator('[data-testid="ai-generator-modal"]')).toBeHidden()
})

// No API key scenarios
Given('I have not configured an OpenAI API key', async function() {
  await dbHelper.removeOpenAIKey()
})

When('I see the AI content generator section', async function() {
  await expect(page.locator('[data-testid="ai-content-generator"]')).toBeVisible()
})

Then('I should see a helpful message about configuring OpenAI', async function() {
  await expect(page.locator('text=OpenAI is not configured')).toBeVisible()
})

Then('I should see a {string} button', async function(buttonText: string) {
  await expect(page.locator(`button:has-text("${buttonText}")`)).toBeVisible()
})

When('I click the configure button', async function() {
  await page.click('button:has-text("Configure OpenAI API Key")')
})

Then('I should be taken to the API keys settings page', async function() {
  await expect(page).toHaveURL(/\/admin\/settings\/api-keys/)
})

/**
 * API Keys Page Object Model
 * Encapsulates all interactions with the API keys settings page
 */

import { Page, Locator, expect } from '@playwright/test'

export class APIKeysPage {
  readonly page: Page
  
  // Page elements
  readonly pageTitle: Locator
  readonly pageDescription: Locator
  
  // OpenAI Section
  readonly openAISection: Locator
  readonly openAIStatus: Locator
  readonly openAIKeyInput: Locator
  readonly openAIKeyToggle: Locator
  readonly openAIModelSelect: Locator
  readonly openAIMaxTokensInput: Locator
  readonly openAITemperatureInput: Locator
  readonly testConnectionButton: Locator
  readonly openAIInfoPanel: Locator
  
  // Google Analytics Section
  readonly analyticsSection: Locator
  readonly analyticsToggle: Locator
  readonly analyticsIdInput: Locator
  
  // Email Configuration Section
  readonly emailSection: Locator
  readonly emailToggle: Locator
  readonly smtpHostInput: Locator
  readonly smtpPortInput: Locator
  readonly smtpUserInput: Locator
  readonly smtpPasswordInput: Locator
  
  // Actions
  readonly saveButton: Locator
  readonly resetButton: Locator
  
  // Status and feedback
  readonly loadingIndicator: Locator
  readonly successMessage: Locator
  readonly errorMessage: Locator
  readonly connectionStatus: Locator

  constructor(page: Page) {
    this.page = page
    
    // Page elements
    this.pageTitle = page.locator('h1:has-text("API Keys & Integrations")')
    this.pageDescription = page.locator('text=Manage your API keys and external service integrations')
    
    // OpenAI Section
    this.openAISection = page.locator('[data-section="openai"]')
    this.openAIStatus = page.locator('[data-testid="openai-status"]')
    this.openAIKeyInput = page.locator('input[placeholder="sk-..."]')
    this.openAIKeyToggle = page.locator('[data-testid="openai-key-toggle"]')
    this.openAIModelSelect = page.locator('select[name="openai-model"]')
    this.openAIMaxTokensInput = page.locator('input[name="openai-max-tokens"]')
    this.openAITemperatureInput = page.locator('input[name="openai-temperature"]')
    this.testConnectionButton = page.locator('[data-testid="test-openai-button"]')
    this.openAIInfoPanel = page.locator('[data-testid="openai-info-panel"]')
    
    // Google Analytics Section
    this.analyticsSection = page.locator('[data-section="analytics"]')
    this.analyticsToggle = page.locator('[data-testid="analytics-toggle"]')
    this.analyticsIdInput = page.locator('input[placeholder="G-XXXXXXXXXX"]')
    
    // Email Configuration Section
    this.emailSection = page.locator('[data-section="email"]')
    this.emailToggle = page.locator('[data-testid="email-toggle"]')
    this.smtpHostInput = page.locator('input[name="smtp-host"]')
    this.smtpPortInput = page.locator('input[name="smtp-port"]')
    this.smtpUserInput = page.locator('input[name="smtp-user"]')
    this.smtpPasswordInput = page.locator('input[name="smtp-password"]')
    
    // Actions
    this.saveButton = page.locator('[data-testid="save-settings-button"]')
    this.resetButton = page.locator('button:has-text("Reset")')
    
    // Status and feedback
    this.loadingIndicator = page.locator('.loading, .spinner, [data-loading="true"]')
    this.successMessage = page.locator('.success-message, [data-testid="success-message"]')
    this.errorMessage = page.locator('.error-message, [data-testid="error-message"]')
    this.connectionStatus = page.locator('[data-testid="connection-status"]')
  }

  async navigate() {
    await this.page.goto('/admin/settings/api-keys')
  }

  async waitForLoad() {
    await expect(this.pageTitle).toBeVisible()
    await expect(this.openAISection).toBeVisible()
  }

  async enterOpenAIKey(apiKey: string) {
    await this.openAIKeyInput.fill(apiKey)
  }

  async clearOpenAIKey() {
    await this.openAIKeyInput.clear()
  }

  async toggleOpenAIKeyVisibility() {
    await this.openAIKeyToggle.click()
  }

  async selectOpenAIModel(model: string) {
    await this.openAIModelSelect.selectOption(model)
  }

  async setMaxTokens(tokens: number) {
    await this.openAIMaxTokensInput.fill(tokens.toString())
  }

  async setTemperature(temperature: number) {
    await this.openAITemperatureInput.fill(temperature.toString())
  }

  async testConnection() {
    await this.testConnectionButton.click()
  }

  async waitForConnectionTest() {
    // Wait for loading to appear and disappear
    await expect(this.loadingIndicator).toBeVisible()
    await expect(this.loadingIndicator).toBeHidden({ timeout: 30000 })
  }

  async getConnectionStatus(): Promise<string> {
    return await this.openAIStatus.textContent() || ''
  }

  async isOpenAIConnected(): Promise<boolean> {
    const status = await this.getConnectionStatus()
    return status.includes('Connected')
  }

  async enableAnalytics() {
    const isEnabled = await this.analyticsToggle.isChecked()
    if (!isEnabled) {
      await this.analyticsToggle.click()
    }
  }

  async disableAnalytics() {
    const isEnabled = await this.analyticsToggle.isChecked()
    if (isEnabled) {
      await this.analyticsToggle.click()
    }
  }

  async setAnalyticsId(analyticsId: string) {
    await this.analyticsIdInput.fill(analyticsId)
  }

  async enableEmail() {
    const isEnabled = await this.emailToggle.isChecked()
    if (!isEnabled) {
      await this.emailToggle.click()
    }
  }

  async disableEmail() {
    const isEnabled = await this.emailToggle.isChecked()
    if (isEnabled) {
      await this.emailToggle.click()
    }
  }

  async configureEmail(config: {
    host: string
    port: number
    user: string
    password: string
  }) {
    await this.enableEmail()
    await this.smtpHostInput.fill(config.host)
    await this.smtpPortInput.fill(config.port.toString())
    await this.smtpUserInput.fill(config.user)
    await this.smtpPasswordInput.fill(config.password)
  }

  async saveSettings() {
    await this.saveButton.click()
  }

  async waitForSave() {
    // Wait for save operation to complete
    await expect(this.loadingIndicator).toBeVisible()
    await expect(this.loadingIndicator).toBeHidden({ timeout: 10000 })
  }

  async getSuccessMessage(): Promise<string> {
    await expect(this.successMessage).toBeVisible()
    return await this.successMessage.textContent() || ''
  }

  async getErrorMessage(): Promise<string> {
    await expect(this.errorMessage).toBeVisible()
    return await this.errorMessage.textContent() || ''
  }

  async hasValidationErrors(): Promise<boolean> {
    const errors = await this.page.locator('.validation-error, .error').count()
    return errors > 0
  }

  async getValidationErrors(): Promise<string[]> {
    const errorElements = await this.page.locator('.validation-error, .error').all()
    const errors = []
    for (const element of errorElements) {
      const text = await element.textContent()
      if (text) errors.push(text)
    }
    return errors
  }

  async resetToDefaults() {
    await this.resetButton.click()
    // Confirm reset if there's a confirmation dialog
    const confirmButton = this.page.locator('button:has-text("Confirm")')
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }
  }

  async isOpenAIInfoPanelVisible(): Promise<boolean> {
    return await this.openAIInfoPanel.isVisible()
  }

  async getOpenAIInfoPanelText(): Promise<string> {
    return await this.openAIInfoPanel.textContent() || ''
  }

  async clickOpenAIPlatformLink() {
    const link = this.page.locator('a[href*="platform.openai.com"]')
    await link.click()
  }

  async getOpenAIKeyValue(): Promise<string> {
    return await this.openAIKeyInput.inputValue()
  }

  async isOpenAIKeyMasked(): Promise<boolean> {
    const value = await this.getOpenAIKeyValue()
    return value.includes('•')
  }

  async getSelectedModel(): Promise<string> {
    return await this.openAIModelSelect.inputValue()
  }

  async getMaxTokens(): Promise<number> {
    const value = await this.openAIMaxTokensInput.inputValue()
    return parseInt(value) || 0
  }

  async getTemperature(): Promise<number> {
    const value = await this.openAITemperatureInput.inputValue()
    return parseFloat(value) || 0
  }

  async validateOpenAIConfiguration(): Promise<{
    hasApiKey: boolean
    hasValidModel: boolean
    hasValidTokens: boolean
    hasValidTemperature: boolean
  }> {
    const apiKey = await this.getOpenAIKeyValue()
    const model = await this.getSelectedModel()
    const tokens = await this.getMaxTokens()
    const temperature = await this.getTemperature()

    return {
      hasApiKey: apiKey.length > 0 && !apiKey.includes('•'),
      hasValidModel: model.length > 0,
      hasValidTokens: tokens >= 100 && tokens <= 2000,
      hasValidTemperature: temperature >= 0 && temperature <= 1
    }
  }

  async fillCompleteOpenAIConfiguration(config: {
    apiKey: string
    model?: string
    maxTokens?: number
    temperature?: number
  }) {
    await this.enterOpenAIKey(config.apiKey)
    
    if (config.model) {
      await this.selectOpenAIModel(config.model)
    }
    
    if (config.maxTokens) {
      await this.setMaxTokens(config.maxTokens)
    }
    
    if (config.temperature !== undefined) {
      await this.setTemperature(config.temperature)
    }
  }

  async testAndSaveOpenAIConfiguration(config: {
    apiKey: string
    model?: string
    maxTokens?: number
    temperature?: number
  }) {
    await this.fillCompleteOpenAIConfiguration(config)
    await this.testConnection()
    await this.waitForConnectionTest()
    
    const isConnected = await this.isOpenAIConnected()
    if (isConnected) {
      await this.saveSettings()
      await this.waitForSave()
    }
    
    return isConnected
  }
}

/**
 * Setup Wizard Page Object Model
 * Encapsulates all interactions with the setup wizard
 */

import { Page, Locator, expect } from '@playwright/test'

export class SetupWizardPage {
  readonly page: Page
  
  // Navigation elements
  readonly nextButton: Locator
  readonly previousButton: Locator
  readonly stepIndicator: Locator
  readonly progressBar: Locator
  
  // Personal Information Step
  readonly nameInput: Locator
  readonly titleInput: Locator
  readonly taglineInput: Locator
  readonly emailInput: Locator
  readonly phoneInput: Locator
  readonly locationInput: Locator
  readonly bioTextarea: Locator
  
  // Social Links Step
  readonly githubInput: Locator
  readonly linkedinInput: Locator
  readonly twitterInput: Locator
  readonly instagramInput: Locator
  readonly youtubeInput: Locator
  readonly dribbbleInput: Locator
  readonly behanceInput: Locator
  readonly mediumInput: Locator
  
  // Features Step
  readonly aiFeatureToggle: Locator
  readonly analyticsFeatureToggle: Locator
  readonly pwaFeatureToggle: Locator
  readonly blogFeatureToggle: Locator
  readonly contactFeatureToggle: Locator
  
  // Theme Step
  readonly themeSelect: Locator
  readonly primaryColorInput: Locator
  readonly colorModeSelect: Locator
  readonly colorPicker: Locator
  
  // Complete Step
  readonly completeButton: Locator
  readonly successMessage: Locator
  readonly reviewSection: Locator
  
  // Validation
  readonly validationErrors: Locator
  
  constructor(page: Page) {
    this.page = page
    
    // Navigation
    this.nextButton = page.locator('button:has-text("Next")')
    this.previousButton = page.locator('button:has-text("Previous")')
    this.stepIndicator = page.locator('[data-testid="step-indicator"]')
    this.progressBar = page.locator('[data-testid="progress-bar"]')
    
    // Personal Information
    this.nameInput = page.locator('input[name="name"]')
    this.titleInput = page.locator('input[name="title"]')
    this.taglineInput = page.locator('input[name="tagline"]')
    this.emailInput = page.locator('input[name="email"]')
    this.phoneInput = page.locator('input[name="phone"]')
    this.locationInput = page.locator('input[name="location"]')
    this.bioTextarea = page.locator('textarea[name="bio"]')
    
    // Social Links
    this.githubInput = page.locator('input[name="github"]')
    this.linkedinInput = page.locator('input[name="linkedin"]')
    this.twitterInput = page.locator('input[name="twitter"]')
    this.instagramInput = page.locator('input[name="instagram"]')
    this.youtubeInput = page.locator('input[name="youtube"]')
    this.dribbbleInput = page.locator('input[name="dribbble"]')
    this.behanceInput = page.locator('input[name="behance"]')
    this.mediumInput = page.locator('input[name="medium"]')
    
    // Features
    this.aiFeatureToggle = page.locator('[data-feature="ai"] input[type="checkbox"]')
    this.analyticsFeatureToggle = page.locator('[data-feature="analytics"] input[type="checkbox"]')
    this.pwaFeatureToggle = page.locator('[data-feature="pwa"] input[type="checkbox"]')
    this.blogFeatureToggle = page.locator('[data-feature="blog"] input[type="checkbox"]')
    this.contactFeatureToggle = page.locator('[data-feature="contact"] input[type="checkbox"]')
    
    // Theme
    this.themeSelect = page.locator('select[name="theme"]')
    this.primaryColorInput = page.locator('input[name="primaryColor"]')
    this.colorModeSelect = page.locator('select[name="colorMode"]')
    this.colorPicker = page.locator('input[type="color"]')
    
    // Complete
    this.completeButton = page.locator('button:has-text("Complete Setup")')
    this.successMessage = page.locator('[data-testid="success-message"]')
    this.reviewSection = page.locator('[data-testid="review-section"]')
    
    // Validation
    this.validationErrors = page.locator('.error-message, .validation-error')
  }

  async navigate() {
    await this.page.goto('/admin/setup')
  }

  async waitForLoad() {
    await expect(this.stepIndicator).toBeVisible()
    await expect(this.page.locator('h1:has-text("Portfolio Setup")')).toBeVisible()
  }

  async fillPersonalInformation(data: {
    name: string
    title: string
    tagline?: string
    email: string
    phone?: string
    location?: string
    bio?: string
  }) {
    await this.nameInput.fill(data.name)
    await this.titleInput.fill(data.title)
    
    if (data.tagline) {
      await this.taglineInput.fill(data.tagline)
    }
    
    await this.emailInput.fill(data.email)
    
    if (data.phone) {
      await this.phoneInput.fill(data.phone)
    }
    
    if (data.location) {
      await this.locationInput.fill(data.location)
    }
    
    if (data.bio) {
      await this.bioTextarea.fill(data.bio)
    }
  }

  async fillSocialLinks(socialLinks: Record<string, string>) {
    const socialInputs = {
      github: this.githubInput,
      linkedin: this.linkedinInput,
      twitter: this.twitterInput,
      instagram: this.instagramInput,
      youtube: this.youtubeInput,
      dribbble: this.dribbbleInput,
      behance: this.behanceInput,
      medium: this.mediumInput
    }

    for (const [platform, url] of Object.entries(socialLinks)) {
      const input = socialInputs[platform]
      if (input) {
        await input.fill(url)
      }
    }
  }

  async configureFeatures(features: Record<string, boolean>) {
    const featureToggles = {
      ai: this.aiFeatureToggle,
      analytics: this.analyticsFeatureToggle,
      pwa: this.pwaFeatureToggle,
      blog: this.blogFeatureToggle,
      contact: this.contactFeatureToggle
    }

    for (const [feature, enabled] of Object.entries(features)) {
      const toggle = featureToggles[feature]
      if (toggle) {
        const isChecked = await toggle.isChecked()
        if (isChecked !== enabled) {
          await toggle.click()
        }
      }
    }
  }

  async configureTheme(themeConfig: {
    theme?: string
    primaryColor?: string
    mode?: string
  }) {
    if (themeConfig.theme) {
      await this.themeSelect.selectOption(themeConfig.theme)
    }

    if (themeConfig.primaryColor) {
      await this.primaryColorInput.fill(themeConfig.primaryColor)
    }

    if (themeConfig.mode) {
      await this.colorModeSelect.selectOption(themeConfig.mode)
    }
  }

  async clickNext() {
    await this.nextButton.click()
    // Wait for step transition
    await this.page.waitForTimeout(500)
  }

  async clickPrevious() {
    await this.previousButton.click()
    // Wait for step transition
    await this.page.waitForTimeout(500)
  }

  async completeSetup() {
    await this.completeButton.click()
    // Wait for completion
    await this.page.waitForTimeout(1000)
  }

  async getCurrentStep(): Promise<number> {
    const stepText = await this.stepIndicator.textContent()
    const match = stepText?.match(/Step (\d+)/)
    return match ? parseInt(match[1]) : 1
  }

  async getPersonalInformationData() {
    return {
      name: await this.nameInput.inputValue(),
      title: await this.titleInput.inputValue(),
      tagline: await this.taglineInput.inputValue(),
      email: await this.emailInput.inputValue(),
      phone: await this.phoneInput.inputValue(),
      location: await this.locationInput.inputValue(),
      bio: await this.bioTextarea.inputValue()
    }
  }

  getValidationError(field: string): Locator {
    return this.page.locator(`[data-field="${field}"] .error-message, [name="${field}"] + .error-message`)
  }

  async waitForValidation() {
    // Wait for validation to complete
    await this.page.waitForTimeout(300)
  }

  async isStepValid(): Promise<boolean> {
    const errorCount = await this.validationErrors.count()
    return errorCount === 0
  }

  async getStepProgress(): Promise<number> {
    const progressText = await this.progressBar.getAttribute('aria-valuenow')
    return progressText ? parseInt(progressText) : 0
  }

  async skipOptionalSteps() {
    // Skip social links if on that step
    const currentStep = await this.getCurrentStep()
    if (currentStep === 2) {
      await this.clickNext()
    }
  }

  async goToStep(stepNumber: number) {
    const currentStep = await this.getCurrentStep()
    
    if (stepNumber > currentStep) {
      // Go forward
      for (let i = currentStep; i < stepNumber; i++) {
        await this.clickNext()
      }
    } else if (stepNumber < currentStep) {
      // Go backward
      for (let i = currentStep; i > stepNumber; i--) {
        await this.clickPrevious()
      }
    }
  }

  async validateRequiredFields() {
    // Check if required fields are filled
    const name = await this.nameInput.inputValue()
    const title = await this.titleInput.inputValue()
    const email = await this.emailInput.inputValue()

    return {
      name: name.length > 0,
      title: title.length > 0,
      email: email.length > 0 && email.includes('@')
    }
  }

  async getReviewData() {
    return {
      personal: await this.getPersonalInformationData(),
      features: await this.getSelectedFeatures(),
      theme: await this.getThemeConfiguration()
    }
  }

  async getSelectedFeatures() {
    return {
      ai: await this.aiFeatureToggle.isChecked(),
      analytics: await this.analyticsFeatureToggle.isChecked(),
      pwa: await this.pwaFeatureToggle.isChecked(),
      blog: await this.blogFeatureToggle.isChecked(),
      contact: await this.contactFeatureToggle.isChecked()
    }
  }

  async getThemeConfiguration() {
    return {
      theme: await this.themeSelect.inputValue(),
      primaryColor: await this.primaryColorInput.inputValue(),
      mode: await this.colorModeSelect.inputValue()
    }
  }
}

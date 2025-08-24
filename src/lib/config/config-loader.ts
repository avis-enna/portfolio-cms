/**
 * Configuration Loader
 * Loads and manages portfolio configuration from JSON files
 * Integrates with admin dashboard for easy editing
 */

import fs from 'fs'
import path from 'path'

export interface PersonalConfig {
  name: string
  title: string
  tagline: string
  bio: string
  location: string
  timezone: string
  languages: string[]
  email: string
  phone?: string
  website?: string
  avatar: string
  resume?: string
}

export interface SocialConfig {
  github?: string
  linkedin?: string
  twitter?: string
  instagram?: string
  youtube?: string
  dribbble?: string
  behance?: string
  medium?: string
  dev?: string
  stackoverflow?: string
  codepen?: string
  discord?: string
}

export interface ExperienceItem {
  id: string
  company: string
  position: string
  location: string
  type: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  achievements: string[]
  technologies: string[]
}

export interface ProjectItem {
  id: string
  title: string
  slug: string
  shortDescription: string
  longDescription: string
  category: string
  type: string
  status: string
  featured: boolean
  startDate: string
  endDate?: string
  duration: string
  teamSize: number
  role: string
  client?: string
  budget?: string
  technologies: string[]
  features: string[]
  challenges: string[]
  solutions: string[]
  results: string[]
  images: string[]
  videos?: string[]
  links: {
    live?: string
    github?: string
    case_study?: string
    ios?: string
    android?: string
    api?: string
    docs?: string
  }
  tags: string[]
  metrics?: Record<string, string>
}

export interface PortfolioConfig {
  personal: PersonalConfig
  social: SocialConfig
  about: {
    shortDescription: string
    longDescription: string
    interests: string[]
    values: string[]
    funFacts: string[]
  }
  experience: ExperienceItem[]
  education: any[]
  certifications: any[]
  awards: any[]
  testimonials: any[]
  contact: {
    availability: string
    preferredContact: string
    responseTime: string
    timezone?: string
    workingHours?: string
    calendlyUrl?: string
    meetingTypes?: string[]
  }
  seo: {
    title: string
    description: string
    keywords: string[]
    ogImage?: string
    twitterCard?: string
    canonicalUrl?: string
  }
}

export interface ProjectsConfig {
  featured: ProjectItem[]
  other: ProjectItem[]
  categories: string[]
  technologies: string[]
}

export interface SetupConfig {
  setup: {
    isConfigured: boolean
    version: string
    setupDate?: string
    lastModified?: string
    configuredBy?: string
  }
  deployment: {
    platform: string
    domain?: string
    customDomain?: string
    environment: string
    deploymentUrl?: string
  }
  features: {
    ai: {
      enabled: boolean
      provider: string
      model: string
      maxTokens: number
      temperature: number
    }
    analytics: {
      enabled: boolean
      provider: string
      trackingId?: string
      enableRealTime: boolean
      enablePerformance: boolean
    }
    pwa: {
      enabled: boolean
      enableOffline: boolean
      enableNotifications: boolean
      enableInstallPrompt: boolean
    }
    blog: {
      enabled: boolean
      enableComments: boolean
      enableSearch: boolean
      postsPerPage: number
    }
    contact: {
      enabled: boolean
      enableForm: boolean
      enableCalendly: boolean
      enableChat: boolean
    }
    social: {
      enableSharing: boolean
      enableLinkedInIntegration: boolean
      enableTwitterIntegration: boolean
    }
  }
  theme: {
    name: string
    mode: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
    fontFamily: string
    borderRadius: string
    animations: boolean
  }
  layout: {
    header: {
      style: string
      showLogo: boolean
      showNavigation: boolean
      sticky: boolean
    }
    hero: {
      style: string
      showAvatar: boolean
      showSocial: boolean
      showCTA: boolean
    }
    sections: Record<string, { enabled: boolean; order: number }>
    footer: {
      showSocial: boolean
      showCopyright: boolean
      showBackToTop: boolean
    }
  }
  seo: {
    enableSitemap: boolean
    enableRobots: boolean
    enableStructuredData: boolean
    enableOpenGraph: boolean
    enableTwitterCards: boolean
  }
  performance: {
    enableImageOptimization: boolean
    enableLazyLoading: boolean
    enableCompression: boolean
    enableCaching: boolean
  }
  security: {
    enableCSP: boolean
    enableCORS: boolean
    enableRateLimit: boolean
    enableInputValidation: boolean
  }
}

class ConfigLoader {
  private configPath: string
  private portfolioConfig: PortfolioConfig | null = null
  private projectsConfig: ProjectsConfig | null = null
  private setupConfig: SetupConfig | null = null

  constructor() {
    this.configPath = path.join(process.cwd(), 'config')
  }

  /**
   * Load portfolio configuration
   */
  getPortfolioConfig(): PortfolioConfig {
    if (!this.portfolioConfig) {
      this.portfolioConfig = this.loadConfig<PortfolioConfig>('portfolio.json')
    }
    return this.portfolioConfig
  }

  /**
   * Load projects configuration
   */
  getProjectsConfig(): ProjectsConfig {
    if (!this.projectsConfig) {
      this.projectsConfig = this.loadConfig<ProjectsConfig>('projects.json')
    }
    return this.projectsConfig
  }

  /**
   * Load setup configuration
   */
  getSetupConfig(): SetupConfig {
    if (!this.setupConfig) {
      this.setupConfig = this.loadConfig<SetupConfig>('setup.json')
    }
    return this.setupConfig
  }

  /**
   * Save portfolio configuration
   */
  savePortfolioConfig(config: PortfolioConfig): void {
    this.saveConfig('portfolio.json', config)
    this.portfolioConfig = config
  }

  /**
   * Save projects configuration
   */
  saveProjectsConfig(config: ProjectsConfig): void {
    this.saveConfig('projects.json', config)
    this.projectsConfig = config
  }

  /**
   * Save setup configuration
   */
  saveSetupConfig(config: SetupConfig): void {
    this.saveConfig('setup.json', config)
    this.setupConfig = config
  }

  /**
   * Check if portfolio is configured
   */
  isConfigured(): boolean {
    try {
      const setup = this.getSetupConfig()
      return setup.setup.isConfigured
    } catch {
      return false
    }
  }

  /**
   * Get all featured projects
   */
  getFeaturedProjects(): ProjectItem[] {
    const projects = this.getProjectsConfig()
    return projects.featured
  }

  /**
   * Get all projects
   */
  getAllProjects(): ProjectItem[] {
    const projects = this.getProjectsConfig()
    return [...projects.featured, ...projects.other]
  }

  /**
   * Get project by slug
   */
  getProjectBySlug(slug: string): ProjectItem | null {
    const allProjects = this.getAllProjects()
    return allProjects.find(project => project.slug === slug) || null
  }

  /**
   * Get enabled features
   */
  getEnabledFeatures(): Record<string, boolean> {
    const setup = this.getSetupConfig()
    const features: Record<string, boolean> = {}
    
    Object.entries(setup.features).forEach(([key, config]) => {
      features[key] = config.enabled
    })
    
    return features
  }

  /**
   * Get theme configuration
   */
  getThemeConfig() {
    const setup = this.getSetupConfig()
    return setup.theme
  }

  /**
   * Get layout configuration
   */
  getLayoutConfig() {
    const setup = this.getSetupConfig()
    return setup.layout
  }

  /**
   * Update personal information
   */
  updatePersonalInfo(personalInfo: Partial<PersonalConfig>): void {
    const config = this.getPortfolioConfig()
    config.personal = { ...config.personal, ...personalInfo }
    this.savePortfolioConfig(config)
  }

  /**
   * Update social links
   */
  updateSocialLinks(socialLinks: Partial<SocialConfig>): void {
    const config = this.getPortfolioConfig()
    config.social = { ...config.social, ...socialLinks }
    this.savePortfolioConfig(config)
  }

  /**
   * Add or update experience
   */
  updateExperience(experience: ExperienceItem[]): void {
    const config = this.getPortfolioConfig()
    config.experience = experience
    this.savePortfolioConfig(config)
  }

  /**
   * Add or update project
   */
  updateProject(project: ProjectItem): void {
    const config = this.getProjectsConfig()
    
    if (project.featured) {
      const index = config.featured.findIndex(p => p.id === project.id)
      if (index >= 0) {
        config.featured[index] = project
      } else {
        config.featured.push(project)
      }
    } else {
      const index = config.other.findIndex(p => p.id === project.id)
      if (index >= 0) {
        config.other[index] = project
      } else {
        config.other.push(project)
      }
    }
    
    this.saveProjectsConfig(config)
  }

  /**
   * Delete project
   */
  deleteProject(projectId: string): void {
    const config = this.getProjectsConfig()
    
    config.featured = config.featured.filter(p => p.id !== projectId)
    config.other = config.other.filter(p => p.id !== projectId)
    
    this.saveProjectsConfig(config)
  }

  /**
   * Update theme
   */
  updateTheme(theme: Partial<SetupConfig['theme']>): void {
    const config = this.getSetupConfig()
    config.theme = { ...config.theme, ...theme }
    config.setup.lastModified = new Date().toISOString()
    this.saveSetupConfig(config)
  }

  /**
   * Update features
   */
  updateFeatures(features: Partial<SetupConfig['features']>): void {
    const config = this.getSetupConfig()
    config.features = { ...config.features, ...features }
    config.setup.lastModified = new Date().toISOString()
    this.saveSetupConfig(config)
  }

  /**
   * Get blog configuration
   */
  getBlogConfig(): any {
    try {
      return this.loadConfig('blog.json')
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new Error('Blog configuration not found')
      }
      throw new Error('Failed to load blog configuration')
    }
  }

  /**
   * Save blog configuration
   */
  saveBlogConfig(config: any): void {
    this.saveConfig('blog.json', config)
  }

  /**
   * Generic config loader
   */
  private loadConfig<T>(filename: string): T {
    const filePath = path.join(this.configPath, filename)
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found: ${filename}`)
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(content) as T
    } catch (error) {
      throw new Error(`Failed to parse configuration file: ${filename}`)
    }
  }

  /**
   * Generic config saver
   */
  private saveConfig<T>(filename: string, config: T): void {
    const filePath = path.join(this.configPath, filename)
    
    try {
      // Ensure config directory exists
      if (!fs.existsSync(this.configPath)) {
        fs.mkdirSync(this.configPath, { recursive: true })
      }
      
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
    } catch (error) {
      throw new Error(`Failed to save configuration file: ${filename}`)
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    // This would reset all configs to default values
    // Implementation depends on default config structure
  }

  /**
   * Export configuration for backup
   */
  exportConfig(): { portfolio: PortfolioConfig; projects: ProjectsConfig; setup: SetupConfig } {
    return {
      portfolio: this.getPortfolioConfig(),
      projects: this.getProjectsConfig(),
      setup: this.getSetupConfig()
    }
  }

  /**
   * Import configuration from backup
   */
  importConfig(backup: { portfolio: PortfolioConfig; projects: ProjectsConfig; setup: SetupConfig }): void {
    this.savePortfolioConfig(backup.portfolio)
    this.saveProjectsConfig(backup.projects)
    this.saveSetupConfig(backup.setup)
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader()

// Export utility functions
export const getPortfolioConfig = () => configLoader.getPortfolioConfig()
export const getProjectsConfig = () => configLoader.getProjectsConfig()
export const getSetupConfig = () => configLoader.getSetupConfig()
export const isConfigured = () => configLoader.isConfigured()
export const getFeaturedProjects = () => configLoader.getFeaturedProjects()
export const getAllProjects = () => configLoader.getAllProjects()
export const getProjectBySlug = (slug: string) => configLoader.getProjectBySlug(slug)
export const getEnabledFeatures = () => configLoader.getEnabledFeatures()
export const getThemeConfig = () => configLoader.getThemeConfig()
export const getLayoutConfig = () => configLoader.getLayoutConfig()

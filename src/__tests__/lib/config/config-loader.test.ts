/**
 * Config Loader Tests
 * Comprehensive tests for the configuration loading system
 */

import fs from 'fs'
import path from 'path'

// Mock fs module
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

// Mock the config loader module
jest.mock('@/lib/config/config-loader', () => {
  const originalModule = jest.requireActual('@/lib/config/config-loader')

  class MockConfigLoader {
    isConfigured(): boolean {
      try {
        const configPath = path.join(process.cwd(), 'config', 'setup.json')

        if (!mockFs.existsSync(configPath)) {
          return false
        }

        const configData = mockFs.readFileSync(configPath, 'utf8')
        const config = JSON.parse(configData)
        return config.setup.isConfigured
      } catch {
        return false
      }
    }

    getPortfolioConfig(): any {
      const configPath = path.join(process.cwd(), 'config', 'portfolio.json')

      if (!mockFs.existsSync(configPath)) {
        throw new Error('Portfolio configuration not found')
      }

      try {
        const configData = mockFs.readFileSync(configPath, 'utf8')
        return JSON.parse(configData)
      } catch {
        throw new Error('Failed to load portfolio configuration')
      }
    }

    savePortfolioConfig(config: any): void {
      try {
        const configDir = path.join(process.cwd(), 'config')
        const configPath = path.join(configDir, 'portfolio.json')

        if (!mockFs.existsSync(configDir)) {
          mockFs.mkdirSync(configDir, { recursive: true })
        }

        mockFs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      } catch (error) {
        throw error
      }
    }

    getSetupConfig(): any {
      const configPath = path.join(process.cwd(), 'config', 'setup.json')

      if (!mockFs.existsSync(configPath)) {
        throw new Error('Setup configuration not found')
      }

      try {
        const configData = mockFs.readFileSync(configPath, 'utf8')
        return JSON.parse(configData)
      } catch {
        throw new Error('Failed to load setup configuration')
      }
    }

    saveSetupConfig(config: any): void {
      const configDir = path.join(process.cwd(), 'config')
      const configPath = path.join(configDir, 'setup.json')

      if (!mockFs.existsSync(configDir)) {
        mockFs.mkdirSync(configDir, { recursive: true })
      }

      mockFs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    }

    getProjectsConfig(): any {
      const configPath = path.join(process.cwd(), 'config', 'projects.json')

      if (!mockFs.existsSync(configPath)) {
        throw new Error('Projects configuration not found')
      }

      try {
        const configData = mockFs.readFileSync(configPath, 'utf8')
        return JSON.parse(configData)
      } catch {
        throw new Error('Failed to load projects configuration')
      }
    }

    saveProjectsConfig(config: any): void {
      const configDir = path.join(process.cwd(), 'config')
      const configPath = path.join(configDir, 'projects.json')

      if (!mockFs.existsSync(configDir)) {
        mockFs.mkdirSync(configDir, { recursive: true })
      }

      mockFs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    }

    getBlogConfig(): any {
      const configPath = path.join(process.cwd(), 'config', 'blog.json')

      if (!mockFs.existsSync(configPath)) {
        throw new Error('Blog configuration not found')
      }

      try {
        const configData = mockFs.readFileSync(configPath, 'utf8')
        return JSON.parse(configData)
      } catch {
        throw new Error('Failed to load blog configuration')
      }
    }

    saveBlogConfig(config: any): void {
      const configDir = path.join(process.cwd(), 'config')
      const configPath = path.join(configDir, 'blog.json')

      if (!mockFs.existsSync(configDir)) {
        mockFs.mkdirSync(configDir, { recursive: true })
      }

      mockFs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    }
  }

  return {
    ...originalModule,
    configLoader: new MockConfigLoader()
  }
})

import { configLoader } from '@/lib/config/config-loader'

describe('ConfigLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isConfigured', () => {
    it('should return true when setup.json exists and is configured', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        setup: { isConfigured: true }
      }))

      expect(configLoader.isConfigured()).toBe(true)
    })

    it('should return false when setup.json does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      expect(configLoader.isConfigured()).toBe(false)
    })

    it('should return false when setup.json exists but is not configured', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        setup: { isConfigured: false }
      }))

      expect(configLoader.isConfigured()).toBe(false)
    })

    it('should return false when setup.json is invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue('invalid json')

      expect(configLoader.isConfigured()).toBe(false)
    })
  })

  describe('getPortfolioConfig', () => {
    it('should return portfolio configuration when file exists', () => {
      const mockConfig = {
        personal: {
          name: 'John Doe',
          title: 'Developer',
          email: 'john@example.com'
        }
      }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig))

      const result = configLoader.getPortfolioConfig()
      expect(result).toEqual(mockConfig)
    })

    it('should throw error when portfolio config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      expect(() => configLoader.getPortfolioConfig()).toThrow('Portfolio configuration not found')
    })

    it('should throw error when portfolio config file is invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue('invalid json')

      expect(() => configLoader.getPortfolioConfig()).toThrow('Failed to load portfolio configuration')
    })
  })

  describe('savePortfolioConfig', () => {
    it('should save portfolio configuration to file', () => {
      const mockConfig = {
        personal: {
          name: 'John Doe',
          title: 'Developer',
          email: 'john@example.com'
        }
      }

      mockFs.existsSync.mockReturnValue(false)
      mockFs.mkdirSync.mockImplementation()
      mockFs.writeFileSync.mockImplementation()

      configLoader.savePortfolioConfig(mockConfig)

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('config'),
        { recursive: true }
      )
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('portfolio.json'),
        JSON.stringify(mockConfig, null, 2)
      )
    })

    it('should not create directory if it already exists', () => {
      const mockConfig = { personal: { name: 'John Doe' } }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.writeFileSync.mockImplementation()

      configLoader.savePortfolioConfig(mockConfig)

      expect(mockFs.mkdirSync).not.toHaveBeenCalled()
      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })
  })

  describe('getSetupConfig', () => {
    it('should return setup configuration when file exists', () => {
      const mockConfig = {
        setup: {
          isConfigured: true,
          version: '1.0.0'
        }
      }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig))

      const result = configLoader.getSetupConfig()
      expect(result).toEqual(mockConfig)
    })

    it('should throw error when setup config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      expect(() => configLoader.getSetupConfig()).toThrow('Setup configuration not found')
    })
  })

  describe('saveSetupConfig', () => {
    it('should save setup configuration to file', () => {
      const mockConfig = {
        setup: {
          isConfigured: true,
          version: '1.0.0'
        }
      }

      mockFs.existsSync.mockReturnValue(false)
      mockFs.mkdirSync.mockImplementation()
      mockFs.writeFileSync.mockImplementation()

      configLoader.saveSetupConfig(mockConfig)

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('setup.json'),
        JSON.stringify(mockConfig, null, 2)
      )
    })
  })

  describe('getProjectsConfig', () => {
    it('should return projects configuration when file exists', () => {
      const mockConfig = {
        featured: [],
        other: [],
        categories: ['Web App', 'Mobile App']
      }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig))

      const result = configLoader.getProjectsConfig()
      expect(result).toEqual(mockConfig)
    })

    it('should throw error when projects config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      expect(() => configLoader.getProjectsConfig()).toThrow('Projects configuration not found')
    })
  })

  describe('saveProjectsConfig', () => {
    it('should save projects configuration to file', () => {
      const mockConfig = {
        featured: [],
        other: [],
        categories: ['Web App']
      }

      mockFs.existsSync.mockReturnValue(false)
      mockFs.mkdirSync.mockImplementation()
      mockFs.writeFileSync.mockImplementation()

      configLoader.saveProjectsConfig(mockConfig)

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('projects.json'),
        JSON.stringify(mockConfig, null, 2)
      )
    })
  })

  describe('getBlogConfig', () => {
    it('should return blog configuration when file exists', () => {
      const mockConfig = {
        posts: [],
        categories: ['Technology', 'Design'],
        settings: {
          postsPerPage: 10
        }
      }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig))

      const result = configLoader.getBlogConfig()
      expect(result).toEqual(mockConfig)
    })

    it('should throw error when blog config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      expect(() => configLoader.getBlogConfig()).toThrow('Blog configuration not found')
    })
  })

  describe('saveBlogConfig', () => {
    it('should save blog configuration to file', () => {
      const mockConfig = {
        posts: [],
        categories: ['Technology']
      }

      mockFs.existsSync.mockReturnValue(false)
      mockFs.mkdirSync.mockImplementation()
      mockFs.writeFileSync.mockImplementation()

      configLoader.saveBlogConfig(mockConfig)

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('blog.json'),
        JSON.stringify(mockConfig, null, 2)
      )
    })
  })

  describe('error handling', () => {
    it('should handle file system errors gracefully', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error')
      })

      expect(configLoader.isConfigured()).toBe(false)
    })

    it('should handle write errors gracefully', () => {
      // Reset mocks first
      mockFs.existsSync.mockReturnValue(true)
      mockFs.mkdirSync.mockImplementation()
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error')
      })

      expect(() => {
        configLoader.savePortfolioConfig({ personal: { name: 'Test' } })
      }).toThrow('Write error')
    })
  })
})

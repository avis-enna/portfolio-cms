/**
 * OpenAI Client Tests
 * Comprehensive tests for the OpenAI integration
 */

import { openAIClient } from '@/lib/ai/openai-client'
import OpenAI from 'openai'

// Mock OpenAI
jest.mock('openai')
const MockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>

describe('OpenAI Client', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any

    MockOpenAI.mockImplementation(() => mockOpenAIInstance)
  })

  describe('isAvailable', () => {
    it('should return true when OpenAI is configured', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      
      expect(openAIClient.isAvailable()).toBe(true)
    })

    it('should return false when OpenAI API key is not configured', () => {
      delete process.env.OPENAI_API_KEY
      
      expect(openAIClient.isAvailable()).toBe(false)
    })
  })

  describe('generateContent', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
    })

    it('should generate content successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated content',
            },
          },
        ],
      }

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse as any)

      const result = await openAIClient.generateContent({
        type: 'portfolio_summary',
        context: { name: 'John Doe', title: 'Developer' },
        tone: 'professional',
        length: 'medium',
      })

      expect(result).toEqual({
        success: true,
        content: 'Generated content',
        variations: ['Generated content'],
        metadata: {
          model: 'gpt-3.5-turbo',
          tokens: expect.any(Number),
          confidence: expect.any(Number),
        },
      })
    })

    it('should handle OpenAI API errors', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('API Error')
      )

      const result = await openAIClient.generateContent({
        type: 'portfolio_summary',
        context: { name: 'John Doe' },
        tone: 'professional',
        length: 'medium',
      })

      expect(result).toEqual({
        success: false,
        error: 'Failed to generate content: API Error',
        content: null,
        variations: [],
      })
    })

    it('should return error when OpenAI is not available', async () => {
      delete process.env.OPENAI_API_KEY

      const result = await openAIClient.generateContent({
        type: 'portfolio_summary',
        context: { name: 'John Doe' },
        tone: 'professional',
        length: 'medium',
      })

      expect(result).toEqual({
        success: false,
        error: 'OpenAI is not configured',
        content: null,
        variations: [],
      })
    })

    it('should generate multiple variations', async () => {
      const mockResponse = {
        choices: [
          { message: { content: 'Variation 1' } },
          { message: { content: 'Variation 2' } },
          { message: { content: 'Variation 3' } },
        ],
      }

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse as any)

      const result = await openAIClient.generateContent({
        type: 'portfolio_summary',
        context: { name: 'John Doe' },
        tone: 'professional',
        length: 'medium',
        variations: 3,
      })

      expect(result.variations).toHaveLength(3)
      expect(result.variations).toEqual(['Variation 1', 'Variation 2', 'Variation 3'])
    })

    it('should handle different content types', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Generated project description' } }],
      }

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse as any)

      const result = await openAIClient.generateContent({
        type: 'project_description',
        context: { 
          title: 'My Project',
          technologies: ['React', 'Node.js'],
          description: 'A web application'
        },
        tone: 'technical',
        length: 'long',
      })

      expect(result.success).toBe(true)
      expect(result.content).toBe('Generated project description')
    })

    it('should handle different tones', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Creative content' } }],
      }

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse as any)

      const result = await openAIClient.generateContent({
        type: 'portfolio_summary',
        context: { name: 'John Doe' },
        tone: 'creative',
        length: 'medium',
      })

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('creative'),
            }),
          ]),
        })
      )
    })

    it('should handle different lengths', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Short content' } }],
      }

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse as any)

      const result = await openAIClient.generateContent({
        type: 'portfolio_summary',
        context: { name: 'John Doe' },
        tone: 'professional',
        length: 'short',
      })

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: expect.any(Number),
        })
      )
    })
  })

  describe('improveContent', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
    })

    it('should improve existing content', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Improved content' } }],
      }

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse as any)

      const result = await openAIClient.improveContent({
        content: 'Original content',
        type: 'portfolio_summary',
        improvements: ['clarity', 'engagement'],
      })

      expect(result).toEqual({
        success: true,
        content: 'Improved content',
        suggestions: ['Improved content'],
        metadata: {
          model: 'gpt-3.5-turbo',
          tokens: expect.any(Number),
          confidence: expect.any(Number),
        },
      })
    })

    it('should handle improvement errors', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('Improvement failed')
      )

      const result = await openAIClient.improveContent({
        content: 'Original content',
        type: 'portfolio_summary',
        improvements: ['clarity'],
      })

      expect(result).toEqual({
        success: false,
        error: 'Failed to improve content: Improvement failed',
        content: null,
        suggestions: [],
      })
    })
  })

  describe('generateSEOContent', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
    })

    it('should generate SEO-optimized content', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'SEO optimized content' } }],
      }

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse as any)

      const result = await openAIClient.generateSEOContent({
        content: 'Original content',
        keywords: ['developer', 'portfolio'],
        type: 'meta_description',
      })

      expect(result).toEqual({
        success: true,
        content: 'SEO optimized content',
        suggestions: ['SEO optimized content'],
        metadata: {
          model: 'gpt-3.5-turbo',
          tokens: expect.any(Number),
          confidence: expect.any(Number),
        },
      })
    })

    it('should handle SEO generation errors', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('SEO generation failed')
      )

      const result = await openAIClient.generateSEOContent({
        content: 'Original content',
        keywords: ['developer'],
        type: 'meta_description',
      })

      expect(result).toEqual({
        success: false,
        error: 'Failed to generate SEO content: SEO generation failed',
        content: null,
        suggestions: [],
      })
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('Network error')
      )

      const result = await openAIClient.generateContent({
        type: 'portfolio_summary',
        context: { name: 'John Doe' },
        tone: 'professional',
        length: 'medium',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should handle rate limiting', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      
      const rateLimitError = new Error('Rate limit exceeded')
      rateLimitError.name = 'RateLimitError'
      
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(rateLimitError)

      const result = await openAIClient.generateContent({
        type: 'portfolio_summary',
        context: { name: 'John Doe' },
        tone: 'professional',
        length: 'medium',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Rate limit exceeded')
    })

    it('should handle invalid API key', async () => {
      process.env.OPENAI_API_KEY = 'invalid-key'
      
      const authError = new Error('Invalid API key')
      authError.name = 'AuthenticationError'
      
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(authError)

      const result = await openAIClient.generateContent({
        type: 'portfolio_summary',
        context: { name: 'John Doe' },
        tone: 'professional',
        length: 'medium',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid API key')
    })
  })
})

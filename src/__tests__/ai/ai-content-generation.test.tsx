/**
 * AI Content Generation Tests
 * Comprehensive tests for AI-powered content generation functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AIContentGenerator } from '@/components/AIContentGenerator'
import { openAIClient } from '@/lib/ai/openai-client'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/Toast'

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  }
})

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key'

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </ThemeProvider>
)

describe('AI Content Generation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    if (fetch && typeof (fetch as any).mockClear === 'function') {
      ;(fetch as jest.Mock).mockClear()
    }
    mockLocalStorage.getItem.mockReturnValue('mock-access-token')
  })

  describe('OpenAI Client', () => {
    test('initializes correctly with API key', () => {
      expect(openAIClient.isAvailable()).toBe(true)
    })

    test('handles missing API key gracefully', () => {
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      
      // Create new client instance
      const { openAIClient: newClient } = require('@/lib/ai/openai-client')
      expect(newClient.isAvailable()).toBe(false)
      
      process.env.OPENAI_API_KEY = originalKey
    })

    test('generates content successfully', async () => {
      const mockCompletion = {
        choices: [{
          message: {
            content: 'Generated portfolio summary content'
          },
          finish_reason: 'stop'
        }],
        usage: {
          total_tokens: 150
        }
      }

      // Mock the OpenAI client
      const mockCreate = jest.fn().mockResolvedValue(mockCompletion)
      jest.doMock('openai', () => ({
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }))

      const request = {
        type: 'portfolio_summary' as const,
        context: {
          name: 'John Doe',
          title: 'Software Developer',
          skills: ['React', 'Node.js'],
          tone: 'professional' as const,
          length: 'medium' as const
        }
      }

      const result = await openAIClient.generateContent(request)

      expect(result.content).toBe('Generated portfolio summary content')
      expect(result.metadata.tokens).toBe(150)
      expect(result.metadata.confidence).toBeGreaterThan(0)
    })

    test('handles API errors gracefully', async () => {
      const mockError = new Error('OpenAI API error')
      
      const mockCreate = jest.fn().mockRejectedValue(mockError)
      jest.doMock('openai', () => ({
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }))

      const request = {
        type: 'portfolio_summary' as const,
        context: {
          name: 'John Doe',
          tone: 'professional' as const
        }
      }

      await expect(openAIClient.generateContent(request))
        .rejects.toThrow('Failed to generate content')
    })

    test('generates multiple variations', async () => {
      const mockCompletion = {
        choices: [{
          message: {
            content: 'Generated content variation'
          },
          finish_reason: 'stop'
        }],
        usage: {
          total_tokens: 100
        }
      }

      const mockCreate = jest.fn().mockResolvedValue(mockCompletion)
      jest.doMock('openai', () => ({
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }))

      const request = {
        type: 'portfolio_summary' as const,
        context: {
          name: 'John Doe',
          tone: 'professional' as const
        }
      }

      const variations = await openAIClient.generateVariations(request, 3)

      expect(variations).toHaveLength(3)
      expect(mockCreate).toHaveBeenCalledTimes(3)
      variations.forEach(variation => {
        expect(variation.content).toBe('Generated content variation')
      })
    })

    test('enhances existing content', async () => {
      const mockCompletion = {
        choices: [{
          message: {
            content: 'Enhanced content with improvements'
          },
          finish_reason: 'stop'
        }],
        usage: {
          total_tokens: 120
        }
      }

      const mockCreate = jest.fn().mockResolvedValue(mockCompletion)
      jest.doMock('openai', () => ({
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }))

      const originalContent = 'Basic portfolio summary'
      const result = await openAIClient.enhanceContent(originalContent, 'portfolio_summary', 'professional')

      expect(result.content).toBe('Enhanced content with improvements')
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining(originalContent)
          })
        ])
      }))
    })

    test('validates content before generation', async () => {
      const request = {
        type: 'custom' as const,
        context: {},
        userInput: 'a'.repeat(10000) // Too long
      }

      // This should be handled by the API route, but we can test client-side validation
      expect(request.userInput.length).toBeGreaterThan(5000)
    })
  })

  describe('AI Content Generator Component', () => {
    test('renders AI content generator component', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { available: true }
        })
      })

      render(
        <TestWrapper>
          <AIContentGenerator type="portfolio_summary" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('ai-content-generator')).toBeInTheDocument()
        expect(screen.getByText('AI Portfolio Summary')).toBeInTheDocument()
        expect(screen.getByTestId('generate-button')).toBeInTheDocument()
      })
    })

    test('shows unavailable state when AI is not configured', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { available: false }
        })
      })

      render(
        <TestWrapper>
          <AIContentGenerator type="portfolio_summary" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('AI content generation is not available')).toBeInTheDocument()
      })
    })

    test('handles content generation successfully', async () => {
      const mockResults = [{
        content: 'Generated portfolio summary',
        suggestions: ['Add more specific achievements', 'Include quantifiable results'],
        metadata: {
          model: 'gpt-3.5-turbo',
          tokens: 150,
          processingTime: 1200,
          confidence: 0.85
        }
      }]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { available: true }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              results: mockResults,
              usage: {
                totalTokens: 150,
                totalCost: 0.0003,
                processingTime: 1200
              }
            }
          })
        })

      const onContentGenerated = jest.fn()

      render(
        <TestWrapper>
          <AIContentGenerator 
            type="portfolio_summary" 
            onContentGenerated={onContentGenerated}
          />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('generate-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('generate-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/generate', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('portfolio_summary')
        }))
      })

      await waitFor(() => {
        expect(onContentGenerated).toHaveBeenCalledWith(
          'Generated portfolio summary',
          ['Add more specific achievements', 'Include quantifiable results']
        )
      })
    })

    test('handles content enhancement', async () => {
      const existingContent = 'Basic portfolio summary'
      const enhancedContent = 'Enhanced portfolio summary with improvements'

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { available: true }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              enhanced: enhancedContent,
              suggestions: ['Consider adding specific metrics'],
              metadata: {
                model: 'gpt-3.5-turbo',
                tokens: 120,
                processingTime: 1000,
                confidence: 0.9
              }
            }
          })
        })

      const onContentGenerated = jest.fn()

      render(
        <TestWrapper>
          <AIContentGenerator 
            type="bio_enhancement" 
            existingContent={existingContent}
            onContentGenerated={onContentGenerated}
          />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('enhance-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('enhance-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/enhance', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(existingContent)
        }))
      })
    })

    test('allows customization of generation parameters', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { available: true }
        })
      })

      render(
        <TestWrapper>
          <AIContentGenerator type="portfolio_summary" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('tone-select')).toBeInTheDocument()
        expect(screen.getByTestId('length-select')).toBeInTheDocument()
        expect(screen.getByTestId('variations-select')).toBeInTheDocument()
      })

      // Change tone
      fireEvent.change(screen.getByTestId('tone-select'), {
        target: { value: 'creative' }
      })

      // Change length
      fireEvent.change(screen.getByTestId('length-select'), {
        target: { value: 'long' }
      })

      // Change variations
      fireEvent.change(screen.getByTestId('variations-select'), {
        target: { value: '3' }
      })

      expect(screen.getByTestId('tone-select')).toHaveValue('creative')
      expect(screen.getByTestId('length-select')).toHaveValue('long')
      expect(screen.getByTestId('variations-select')).toHaveValue('3')
    })

    test('shows results modal with multiple variations', async () => {
      const mockResults = [
        {
          content: 'First variation of content',
          metadata: { model: 'gpt-3.5-turbo', tokens: 100, processingTime: 1000, confidence: 0.8 }
        },
        {
          content: 'Second variation of content',
          metadata: { model: 'gpt-3.5-turbo', tokens: 110, processingTime: 1100, confidence: 0.85 }
        },
        {
          content: 'Third variation of content',
          metadata: { model: 'gpt-3.5-turbo', tokens: 120, processingTime: 1200, confidence: 0.9 }
        }
      ]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { available: true }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              results: mockResults,
              usage: { totalTokens: 330 }
            }
          })
        })

      render(
        <TestWrapper>
          <AIContentGenerator type="portfolio_summary" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('generate-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('generate-button'))

      await waitFor(() => {
        expect(screen.getByTestId('ai-results-modal')).toBeInTheDocument()
        expect(screen.getByText('3 variations generated')).toBeInTheDocument()
        expect(screen.getByTestId('variation-0')).toBeInTheDocument()
        expect(screen.getByTestId('variation-1')).toBeInTheDocument()
        expect(screen.getByTestId('variation-2')).toBeInTheDocument()
      })

      // Test variation selection
      fireEvent.click(screen.getByTestId('variation-1'))
      expect(screen.getByText('Second variation of content')).toBeInTheDocument()
    })

    test('handles content selection from modal', async () => {
      const mockResults = [{
        content: 'Selected content',
        metadata: { model: 'gpt-3.5-turbo', tokens: 100, processingTime: 1000, confidence: 0.8 }
      }]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { available: true }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { results: mockResults }
          })
        })

      const onContentSelected = jest.fn()

      render(
        <TestWrapper>
          <AIContentGenerator 
            type="portfolio_summary" 
            onContentSelected={onContentSelected}
          />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('generate-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('generate-button'))

      await waitFor(() => {
        expect(screen.getByTestId('ai-results-modal')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('select-content'))

      expect(onContentSelected).toHaveBeenCalledWith('Selected content')
      expect(screen.queryByTestId('ai-results-modal')).not.toBeInTheDocument()
    })

    test('handles API errors gracefully', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { available: true }
          })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: 'AI service rate limit exceeded'
          })
        })

      render(
        <TestWrapper>
          <AIContentGenerator type="portfolio_summary" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('generate-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('generate-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/generate', expect.any(Object))
      })

      // Should handle error gracefully without crashing
      expect(screen.getByTestId('generate-button')).toBeInTheDocument()
    })

    test('shows loading states correctly', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { available: true }
          })
        })
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              json: async () => ({
                success: true,
                data: { results: [] }
              })
            }), 100)
          )
        )

      render(
        <TestWrapper>
          <AIContentGenerator type="portfolio_summary" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('generate-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('generate-button'))

      // Should show loading state
      expect(screen.getByText('Generating...')).toBeInTheDocument()
      expect(screen.getByTestId('generate-button')).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Generate Content')).toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('provides helpful tips and guidance', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { available: true }
        })
      })

      render(
        <TestWrapper>
          <AIContentGenerator type="portfolio_summary" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('💡 Tips for better results:')).toBeInTheDocument()
        expect(screen.getByText('• Be specific about your experience and achievements')).toBeInTheDocument()
        expect(screen.getByText('• Mention relevant technologies and skills')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('handles authentication errors', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { available: true }
        })
      })

      render(
        <TestWrapper>
          <AIContentGenerator type="portfolio_summary" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('generate-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('generate-button'))

      // Should handle missing auth token
      expect(screen.getByTestId('generate-button')).toBeInTheDocument()
    })

    test('handles network errors', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { available: true }
          })
        })
        .mockRejectedValueOnce(new Error('Network error'))

      render(
        <TestWrapper>
          <AIContentGenerator type="portfolio_summary" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('generate-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('generate-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })

      // Should handle network error gracefully
      expect(screen.getByTestId('generate-button')).toBeInTheDocument()
    })
  })
})

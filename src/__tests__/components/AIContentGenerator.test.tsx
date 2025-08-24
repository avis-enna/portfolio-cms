/**
 * AI Content Generator Component Tests
 * Comprehensive tests for the AI content generation component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AIContentGenerator from '@/components/AIContentGenerator'

// Mock the useToast hook
const mockShowToast = jest.fn()
jest.mock('@/components/Toast', () => ({
  useToast: () => ({
    showToast: mockShowToast
  })
}))

// Mock fetch
global.fetch = jest.fn()

describe('AIContentGenerator', () => {
  const defaultProps = {
    type: 'portfolio_summary' as const,
    context: { name: 'John Doe', title: 'Developer' },
    onContentGenerated: jest.fn(),
    className: 'test-class'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render when AI is available', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true })
    })

    render(<AIContentGenerator {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('AI Content Generator')).toBeInTheDocument()
    })

    expect(screen.getByText('Generate with AI')).toBeInTheDocument()
  })

  it('should show helpful message when AI is not available', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: false })
    })

    render(<AIContentGenerator {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('OpenAI is not configured')).toBeInTheDocument()
    })

    expect(screen.getByText('⚙️ Configure OpenAI API Key')).toBeInTheDocument()
    expect(screen.getByText('What you\'ll get with AI:')).toBeInTheDocument()
  })

  it('should open configuration page when configure button is clicked', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: false })
    })

    // Mock window.open
    const mockOpen = jest.fn()
    window.open = mockOpen

    render(<AIContentGenerator {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('⚙️ Configure OpenAI API Key')).toBeInTheDocument()
    })

    const configureButton = screen.getByText('⚙️ Configure OpenAI API Key')
    await user.click(configureButton)

    expect(mockOpen).toHaveBeenCalledWith('/admin/settings/api-keys', '_blank')
  })

  it('should generate content successfully', async () => {
    const user = userEvent.setup()
    
    // Mock AI availability check
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true })
    })

    render(<AIContentGenerator {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument()
    })

    // Mock content generation response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        content: 'Generated content',
        variations: ['Generated content 1', 'Generated content 2', 'Generated content 3']
      })
    })

    // Click generate button
    const generateButton = screen.getByText('Generate with AI')
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Generated content 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Generated content 2')).toBeInTheDocument()
    expect(screen.getByText('Generated content 3')).toBeInTheDocument()
  })

  it('should handle content generation with tone and length selection', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true })
    })

    render(<AIContentGenerator {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument()
    })

    // Select tone
    const toneSelect = screen.getByLabelText(/tone/i)
    await user.selectOptions(toneSelect, 'creative')

    // Select length
    const lengthSelect = screen.getByLabelText(/length/i)
    await user.selectOptions(lengthSelect, 'long')

    // Mock content generation response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        content: 'Creative long content',
        variations: ['Creative long content']
      })
    })

    // Generate content
    const generateButton = screen.getByText('Generate with AI')
    await user.click(generateButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'portfolio_summary',
          context: { name: 'John Doe', title: 'Developer' },
          tone: 'creative',
          length: 'long',
          variations: 3
        })
      })
    })
  })

  it('should allow selecting and using generated content', async () => {
    const user = userEvent.setup()
    const mockOnContentGenerated = jest.fn()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true })
    })

    render(<AIContentGenerator {...defaultProps} onContentGenerated={mockOnContentGenerated} />)

    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument()
    })

    // Mock content generation
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        content: 'Generated content',
        variations: ['Variation 1', 'Variation 2']
      })
    })

    // Generate content
    const generateButton = screen.getByText('Generate with AI')
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Variation 1')).toBeInTheDocument()
    })

    // Select a variation
    const variation1 = screen.getByText('Variation 1')
    await user.click(variation1)

    // Use the selected content
    const useButton = screen.getByText('Use This Content')
    await user.click(useButton)

    expect(mockOnContentGenerated).toHaveBeenCalledWith('Variation 1')
  })

  it('should handle generation errors gracefully', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true })
    })

    render(<AIContentGenerator {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument()
    })

    // Mock generation error
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Generation failed'
      })
    })

    // Generate content
    const generateButton = screen.getByText('Generate with AI')
    await user.click(generateButton)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Generation failed', 'error')
    })
  })

  it('should handle OpenAI not configured error', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true })
    })

    render(<AIContentGenerator {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument()
    })

    // Mock OpenAI not configured error
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'OpenAI not configured',
        code: 'OPENAI_NOT_CONFIGURED'
      })
    })

    // Generate content
    const generateButton = screen.getByText('Generate with AI')
    await user.click(generateButton)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('OpenAI not configured. Please add your API key in Settings > API Keys.', 'error')
    })
  })

  it('should show loading state during generation', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true })
    })

    render(<AIContentGenerator {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument()
    })

    // Mock slow generation response
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            success: true,
            content: 'Generated content',
            variations: ['Generated content']
          })
        }), 100)
      )
    )

    // Generate content
    const generateButton = screen.getByText('Generate with AI')
    await user.click(generateButton)

    // Check loading state
    expect(screen.getByText('Generating...')).toBeInTheDocument()
    expect(generateButton).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Generated content')).toBeInTheDocument()
    })
  })

  it('should handle network errors', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true })
    })

    render(<AIContentGenerator {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument()
    })

    // Mock network error
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    // Generate content
    const generateButton = screen.getByText('Generate with AI')
    await user.click(generateButton)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to generate content', 'error')
    })
  })

  it('should regenerate content with different parameters', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true })
    })

    render(<AIContentGenerator {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument()
    })

    // First generation
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        content: 'First generation',
        variations: ['First generation']
      })
    })

    const generateButton = screen.getByText('Generate with AI')
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('First generation')).toBeInTheDocument()
    })

    // Change tone and regenerate
    const toneSelect = screen.getByLabelText(/tone/i)
    await user.selectOptions(toneSelect, 'casual')

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        content: 'Casual generation',
        variations: ['Casual generation']
      })
    })

    const regenerateButton = screen.getByText('Regenerate')
    await user.click(regenerateButton)

    await waitFor(() => {
      expect(screen.getByText('Casual generation')).toBeInTheDocument()
    })
  })

  it('should apply custom className', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true })
    })

    const { container } = render(<AIContentGenerator {...defaultProps} className="custom-class" />)

    await waitFor(() => {
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})

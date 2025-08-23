'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { useToast } from '@/components/Toast'

interface AIContentGeneratorProps {
  type: 'portfolio_summary' | 'project_description' | 'blog_idea' | 'skill_description' | 'bio_enhancement' | 'custom'
  context?: {
    name?: string
    title?: string
    skills?: string[]
    experience?: string[]
    industry?: string
  }
  existingContent?: string
  onContentGenerated?: (content: string, suggestions?: string[]) => void
  onContentSelected?: (content: string) => void
  className?: string
  placeholder?: string
}

interface AIResult {
  content: string
  suggestions?: string[]
  metadata: {
    model: string
    tokens: number
    processingTime: number
    confidence: number
  }
}

export const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
  type,
  context = {},
  existingContent,
  onContentGenerated,
  onContentSelected,
  className = '',
  placeholder = 'Enter any additional context or specific requirements...'
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [tone, setTone] = useState<'professional' | 'casual' | 'creative' | 'technical' | 'friendly'>('professional')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [variations, setVariations] = useState(1)
  const [results, setResults] = useState<AIResult[]>([])
  const [selectedResult, setSelectedResult] = useState<number>(0)
  const [isAIAvailable, setIsAIAvailable] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    checkAIAvailability()
  }, [])

  const checkAIAvailability = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) return

      const response = await fetch('/api/ai/generate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        setIsAIAvailable(result.data.available)
      }
    } catch (error) {
      console.error('Failed to check AI availability:', error)
    }
  }

  const generateContent = async () => {
    if (!isAIAvailable) {
      showToast('AI content generation is not available', 'error')
      return
    }

    try {
      setIsGenerating(true)
      const accessToken = localStorage.getItem('accessToken')
      
      if (!accessToken) {
        showToast('Please log in to use AI features', 'error')
        return
      }

      const requestBody = {
        type,
        context: {
          ...context,
          tone,
          length,
          existingContent
        },
        userInput: userInput.trim() || undefined,
        variations
      }

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (result.success) {
        setResults(result.data.results)
        setSelectedResult(0)
        setShowModal(true)
        
        // Call callback with first result
        if (onContentGenerated && result.data.results.length > 0) {
          onContentGenerated(
            result.data.results[0].content,
            result.data.results[0].suggestions
          )
        }

        showToast(`Generated ${result.data.results.length} content variation${result.data.results.length > 1 ? 's' : ''}!`, 'success')
      } else {
        showToast(result.error || 'Failed to generate content', 'error')
      }
    } catch (error) {
      console.error('AI generation error:', error)
      showToast('Failed to generate content. Please try again.', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const enhanceContent = async () => {
    if (!existingContent || !isAIAvailable) {
      showToast('No content to enhance or AI not available', 'error')
      return
    }

    try {
      setIsEnhancing(true)
      const accessToken = localStorage.getItem('accessToken')
      
      if (!accessToken) {
        showToast('Please log in to use AI features', 'error')
        return
      }

      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: existingContent,
          type: type === 'bio_enhancement' ? 'bio' : type.replace('_', '_'),
          tone,
          options: {
            generateSuggestions: true
          }
        }),
      })

      const result = await response.json()

      if (result.success) {
        const enhancedResult: AIResult = {
          content: result.data.enhanced,
          suggestions: [
            ...(result.data.suggestions || []),
            ...(result.data.additionalSuggestions || [])
          ],
          metadata: result.data.metadata
        }

        setResults([enhancedResult])
        setSelectedResult(0)
        setShowModal(true)
        
        if (onContentGenerated) {
          onContentGenerated(enhancedResult.content, enhancedResult.suggestions)
        }

        showToast('Content enhanced successfully!', 'success')
      } else {
        showToast(result.error || 'Failed to enhance content', 'error')
      }
    } catch (error) {
      console.error('AI enhancement error:', error)
      showToast('Failed to enhance content. Please try again.', 'error')
    } finally {
      setIsEnhancing(false)
    }
  }

  const selectContent = (content: string) => {
    if (onContentSelected) {
      onContentSelected(content)
    }
    setShowModal(false)
    showToast('Content selected!', 'success')
  }

  const getTypeLabel = () => {
    const labels = {
      portfolio_summary: 'Portfolio Summary',
      project_description: 'Project Description',
      blog_idea: 'Blog Ideas',
      skill_description: 'Skill Description',
      bio_enhancement: 'Bio Enhancement',
      custom: 'Custom Content'
    }
    return labels[type] || 'Content'
  }

  const getTypeIcon = () => {
    const icons = {
      portfolio_summary: '👤',
      project_description: '🚀',
      blog_idea: '📝',
      skill_description: '🛠️',
      bio_enhancement: '✨',
      custom: '🎯'
    }
    return icons[type] || '🤖'
  }

  if (!isAIAvailable) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 text-2xl mb-2">🤖</div>
          <p className="text-sm text-gray-600">AI content generation is not available</p>
          <p className="text-xs text-gray-500 mt-1">Contact administrator to enable AI features</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`space-y-4 ${className}`} data-testid="ai-content-generator">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{getTypeIcon()}</span>
            <div>
              <h3 className="text-lg font-medium text-gray-900">AI {getTypeLabel()}</h3>
              <p className="text-sm text-gray-600">Generate professional content with AI assistance</p>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            data-testid="ai-input"
          />

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="tone-select"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="creative">Creative</option>
                <option value="technical">Technical</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="length-select"
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variations</label>
              <select
                value={variations}
                onChange={(e) => setVariations(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="variations-select"
              >
                <option value={1}>1 variation</option>
                <option value={2}>2 variations</option>
                <option value={3}>3 variations</option>
                <option value={4}>4 variations</option>
                <option value={5}>5 variations</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={generateContent}
            loading={isGenerating}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
            data-testid="generate-button"
          >
            <span>🤖</span>
            <span>{isGenerating ? 'Generating...' : 'Generate Content'}</span>
          </Button>

          {existingContent && (
            <Button
              onClick={enhanceContent}
              loading={isEnhancing}
              disabled={isEnhancing}
              variant="outline"
              className="text-purple-600 border-purple-300 hover:bg-purple-50 flex items-center space-x-2"
              data-testid="enhance-button"
            >
              <span>✨</span>
              <span>{isEnhancing ? 'Enhancing...' : 'Enhance Existing'}</span>
            </Button>
          )}
        </div>

        {/* Quick Tips */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for better results:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Be specific about your experience and achievements</li>
            <li>• Mention relevant technologies and skills</li>
            <li>• Include industry context for better targeting</li>
            <li>• Try different tones to match your personal brand</li>
          </ul>
        </div>
      </div>

      {/* Results Modal */}
      {showModal && results.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="ai-results-modal">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getTypeIcon()}</span>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">AI Generated Content</h3>
                  <p className="text-sm text-gray-600">{results.length} variation{results.length > 1 ? 's' : ''} generated</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                data-testid="close-modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex h-[calc(90vh-120px)]">
              {/* Variations List */}
              {results.length > 1 && (
                <div className="w-1/4 border-r bg-gray-50 p-4 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Variations</h4>
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedResult(index)}
                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                          selectedResult === index
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                        data-testid={`variation-${index}`}
                      >
                        <div className="font-medium mb-1">Variation {index + 1}</div>
                        <div className="text-xs text-gray-500">
                          {result.content.substring(0, 60)}...
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Confidence: {(result.metadata.confidence * 100).toFixed(0)}%
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Display */}
              <div className={`${results.length > 1 ? 'w-3/4' : 'w-full'} p-6 overflow-y-auto`}>
                <div className="space-y-4">
                  {/* Generated Content */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900">Generated Content</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Model: {results[selectedResult].metadata.model}</span>
                        <span>•</span>
                        <span>Tokens: {results[selectedResult].metadata.tokens}</span>
                        <span>•</span>
                        <span>Confidence: {(results[selectedResult].metadata.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <pre className="whitespace-pre-wrap text-gray-900 font-sans">
                        {results[selectedResult].content}
                      </pre>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {results[selectedResult].suggestions && results[selectedResult].suggestions!.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Suggestions for Improvement</h4>
                      <div className="space-y-2">
                        {results[selectedResult].suggestions!.map((suggestion, index) => (
                          <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <span className="text-yellow-600 mt-0.5">💡</span>
                            <p className="text-sm text-yellow-800">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-100"
                data-testid="cancel-selection"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectContent(results[selectedResult].content)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="select-content"
              >
                Use This Content
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

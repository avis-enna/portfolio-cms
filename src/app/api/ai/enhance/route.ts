/**
 * AI Content Enhancement API Route
 * Handles AI-powered content enhancement and optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { openAIClient } from '@/lib/ai/openai-client'
import { rateLimit } from '@/lib/middleware/rateLimit'

// Rate limiting for AI enhancement
const enhanceRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 requests per hour per user
  message: 'Too many AI enhancement requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await enhanceRateLimit(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Check if OpenAI is available
    if (!openAIClient.isAvailable()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI content enhancement is not available. Please contact administrator.' 
        },
        { status: 503 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { content, type, tone = 'professional', keywords = [], options = {} } = body

    // Validate request
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content to enhance is required' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Content is too long. Maximum 5000 characters allowed.' },
        { status: 400 }
      )
    }

    const validTypes = ['portfolio_summary', 'project_description', 'blog_post', 'skill_description', 'bio', 'general']
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Determine enhancement type
    let enhancementResult
    
    if (keywords.length > 0) {
      // SEO-optimized enhancement
      enhancementResult = await openAIClient.generateSEOContent({
        type: 'custom',
        context: {
          tone,
          existingContent: content,
          customPrompt: `Enhance the following content while naturally incorporating these SEO keywords: ${keywords.join(', ')}. Improve readability, engagement, and search engine optimization without keyword stuffing.`
        },
        userInput: content
      }, keywords)
    } else {
      // General content enhancement
      enhancementResult = await openAIClient.enhanceContent(content, type || 'general', tone)
    }

    // Generate additional suggestions if requested
    let additionalSuggestions = []
    if (options.generateSuggestions) {
      try {
        const suggestionResult = await openAIClient.generateContent({
          type: 'custom',
          context: {
            tone,
            customPrompt: `Analyze this content and provide 5 specific, actionable suggestions for improvement:\n\n${content}\n\nFocus on clarity, engagement, professionalism, and impact.`
          }
        })
        
        additionalSuggestions = suggestionResult.content
          .split('\n')
          .filter(line => line.trim().length > 0)
          .slice(0, 5)
      } catch (error) {
        console.error('Failed to generate additional suggestions:', error)
      }
    }

    // Calculate improvement metrics
    const metrics = calculateImprovementMetrics(content, enhancementResult.content)

    // Log usage for analytics
    console.log('AI content enhanced:', {
      userId: payload.userId,
      type: type || 'general',
      originalLength: content.length,
      enhancedLength: enhancementResult.content.length,
      seoOptimized: keywords.length > 0,
      tokens: enhancementResult.metadata.tokens,
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      data: {
        original: content,
        enhanced: enhancementResult.content,
        suggestions: enhancementResult.suggestions || [],
        additionalSuggestions,
        metrics,
        metadata: {
          ...enhancementResult.metadata,
          enhancementType: keywords.length > 0 ? 'seo_optimized' : 'general',
          keywordsUsed: keywords
        }
      }
    })

  } catch (error) {
    console.error('AI enhancement error:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'AI service rate limit exceeded. Please try again later.',
            retryAfter: 60
          },
          { status: 429 }
        )
      }
      
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'AI service quota exceeded. Please contact administrator.' 
          },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to enhance content. Please try again.' 
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate improvement metrics between original and enhanced content
 */
function calculateImprovementMetrics(original: string, enhanced: string) {
  const originalWords = original.split(/\s+/).length
  const enhancedWords = enhanced.split(/\s+/).length
  
  const originalSentences = original.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  const enhancedSentences = enhanced.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  
  // Calculate readability improvements (simplified)
  const originalAvgWordsPerSentence = originalWords / Math.max(originalSentences, 1)
  const enhancedAvgWordsPerSentence = enhancedWords / Math.max(enhancedSentences, 1)
  
  // Calculate complexity score (based on word length and sentence structure)
  const originalComplexity = calculateComplexityScore(original)
  const enhancedComplexity = calculateComplexityScore(enhanced)
  
  return {
    wordCount: {
      original: originalWords,
      enhanced: enhancedWords,
      change: enhancedWords - originalWords,
      changePercent: ((enhancedWords - originalWords) / originalWords * 100).toFixed(1)
    },
    sentences: {
      original: originalSentences,
      enhanced: enhancedSentences,
      change: enhancedSentences - originalSentences
    },
    readability: {
      originalAvgWordsPerSentence: originalAvgWordsPerSentence.toFixed(1),
      enhancedAvgWordsPerSentence: enhancedAvgWordsPerSentence.toFixed(1),
      improvement: originalAvgWordsPerSentence > enhancedAvgWordsPerSentence ? 'Improved' : 'Similar'
    },
    complexity: {
      original: originalComplexity.toFixed(2),
      enhanced: enhancedComplexity.toFixed(2),
      improvement: enhancedComplexity < originalComplexity ? 'Simplified' : 'Similar'
    },
    overallImprovement: calculateOverallImprovement(original, enhanced)
  }
}

/**
 * Calculate a simple complexity score for text
 */
function calculateComplexityScore(text: string): number {
  const words = text.split(/\s+/)
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = words.length / sentences.length
  
  // Simple complexity formula
  return (avgWordLength * 0.3) + (avgSentenceLength * 0.7)
}

/**
 * Calculate overall improvement score
 */
function calculateOverallImprovement(original: string, enhanced: string): string {
  const originalLength = original.length
  const enhancedLength = enhanced.length
  
  // Consider various factors
  const lengthImprovement = enhancedLength > originalLength * 1.2 ? 1 : 0
  const structureImprovement = enhanced.includes('\n') || enhanced.includes('•') ? 1 : 0
  const professionalWords = ['expertise', 'experience', 'proficient', 'skilled', 'accomplished'].some(word => 
    enhanced.toLowerCase().includes(word) && !original.toLowerCase().includes(word)
  ) ? 1 : 0
  
  const score = lengthImprovement + structureImprovement + professionalWords
  
  if (score >= 2) return 'Significant'
  if (score === 1) return 'Moderate'
  return 'Minor'
}

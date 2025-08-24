/**
 * AI Content Generation API Route
 * Handles AI-powered content generation requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { openAIClient, AIContentRequest } from '@/lib/ai/openai-client'
import { rateLimit } from '@/lib/middleware/rateLimit'

// Rate limiting for AI generation (more restrictive due to cost)
const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour per user
  message: 'Too many AI generation requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await aiRateLimit(request)
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
          error: 'OpenAI is not configured. Please add your OpenAI API key in Settings > API Keys to enable AI features.',
          code: 'OPENAI_NOT_CONFIGURED'
        },
        { status: 503 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { type, context, userInput, variations = 1 } = body

    // Validate request
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Content type is required' },
        { status: 400 }
      )
    }

    const validTypes = ['portfolio_summary', 'project_description', 'blog_idea', 'skill_description', 'bio_enhancement', 'custom']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Validate variations count
    if (variations < 1 || variations > 5) {
      return NextResponse.json(
        { success: false, error: 'Variations must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Build AI request
    const aiRequest: AIContentRequest = {
      type,
      context: {
        tone: context?.tone || 'professional',
        length: context?.length || 'medium',
        language: context?.language || 'en',
        ...context
      },
      userInput
    }

    // Generate content
    let results
    if (variations === 1) {
      const result = await openAIClient.generateContent(aiRequest)
      results = [result]
    } else {
      results = await openAIClient.generateVariations(aiRequest, variations)
    }

    // Log usage for analytics
    console.log('AI content generated:', {
      userId: payload.userId,
      type,
      variations,
      totalTokens: results.reduce((sum, r) => sum + r.metadata.tokens, 0),
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      data: {
        results,
        usage: {
          totalTokens: results.reduce((sum, r) => sum + r.metadata.tokens, 0),
          totalCost: calculateCost(results),
          processingTime: Math.max(...results.map(r => r.metadata.processingTime))
        }
      }
    })

  } catch (error) {
    console.error('AI generation error:', error)
    
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
        error: 'Failed to generate content. Please try again.' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Return AI service status and available features
    return NextResponse.json({
      success: true,
      data: {
        available: openAIClient.isAvailable(),
        features: {
          contentGeneration: openAIClient.isAvailable(),
          contentEnhancement: openAIClient.isAvailable(),
          seoOptimization: openAIClient.isAvailable(),
          multipleVariations: openAIClient.isAvailable()
        },
        limits: {
          maxVariations: 5,
          hourlyLimit: 50,
          supportedTypes: [
            'portfolio_summary',
            'project_description', 
            'blog_idea',
            'skill_description',
            'bio_enhancement',
            'custom'
          ],
          supportedTones: [
            'professional',
            'casual',
            'creative',
            'technical',
            'friendly'
          ],
          supportedLengths: [
            'short',
            'medium',
            'long'
          ]
        }
      }
    })

  } catch (error) {
    console.error('AI status check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check AI service status' 
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate estimated cost for AI generation
 */
function calculateCost(results: any[]): number {
  // Rough cost calculation based on OpenAI pricing
  const totalTokens = results.reduce((sum, r) => sum + r.metadata.tokens, 0)
  
  // Approximate costs (as of 2024)
  const gpt35Cost = 0.002 / 1000 // $0.002 per 1K tokens
  const gpt4Cost = 0.03 / 1000   // $0.03 per 1K tokens
  
  // Assume mix of models, use average
  const avgCost = (gpt35Cost + gpt4Cost) / 2
  
  return totalTokens * avgCost
}

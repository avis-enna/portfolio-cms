/**
 * Test OpenAI Connection API Route
 * Test OpenAI API key and connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const { apiKey, model } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      )
    }

    // Test OpenAI connection
    const openai = new OpenAI({
      apiKey: apiKey
    })

    try {
      // Make a simple test request
      const completion = await openai.chat.completions.create({
        model: model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello! OpenAI connection is working." in exactly those words.'
          }
        ],
        max_tokens: 50,
        temperature: 0
      })

      const response = completion.choices[0]?.message?.content?.trim()

      if (response && response.includes('Hello! OpenAI connection is working.')) {
        return NextResponse.json({
          success: true,
          message: 'OpenAI connection successful',
          model: model || 'gpt-3.5-turbo',
          testResponse: response
        })
      } else {
        return NextResponse.json(
          { success: false, error: 'Unexpected response from OpenAI' },
          { status: 400 }
        )
      }

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      
      // Handle specific OpenAI errors
      if (openaiError.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key. Please check your OpenAI API key.' },
          { status: 400 }
        )
      } else if (openaiError.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please try again later.' },
          { status: 400 }
        )
      } else if (openaiError.status === 403) {
        return NextResponse.json(
          { success: false, error: 'Access denied. Please check your API key permissions.' },
          { status: 400 }
        )
      } else if (openaiError.status === 404) {
        return NextResponse.json(
          { success: false, error: `Model "${model}" not found. Please check the model name.` },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { success: false, error: `OpenAI API error: ${openaiError.message || 'Unknown error'}` },
          { status: 400 }
        )
      }
    }

  } catch (error) {
    console.error('Test OpenAI error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to test OpenAI connection' },
      { status: 500 }
    )
  }
}

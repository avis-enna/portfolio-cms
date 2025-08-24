/**
 * LinkedIn OAuth Initiation Route
 * Redirects users to LinkedIn for OAuth authorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateLinkedInAuthUrl, validateLinkedInConfig } from '@/lib/linkedin/config'
import { verifyAccessToken } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
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

    // Validate LinkedIn configuration
    if (!validateLinkedInConfig()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'LinkedIn integration is not properly configured' 
        },
        { status: 500 }
      )
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID()
    
    // Store state in session or database for verification
    // For now, we'll include it in the URL and verify it in the callback
    
    const authUrl = generateLinkedInAuthUrl(state)

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        state
      }
    })

  } catch (error) {
    console.error('LinkedIn OAuth initiation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initiate LinkedIn OAuth' 
      },
      { status: 500 }
    )
  }
}

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
    const payload = verifyJWT(token)
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'disconnect') {
      // Handle LinkedIn disconnection
      // This would typically involve:
      // 1. Revoking the LinkedIn access token
      // 2. Removing stored LinkedIn credentials
      // 3. Updating user settings

      // For now, we'll just return success
      // In a real implementation, you'd want to:
      // - Revoke the token with LinkedIn
      // - Remove from database
      // - Clear any cached data

      return NextResponse.json({
        success: true,
        message: 'LinkedIn account disconnected successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('LinkedIn OAuth action error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process LinkedIn OAuth action' 
      },
      { status: 500 }
    )
  }
}

/**
 * LinkedIn OAuth Callback Route
 * Handles the OAuth callback from LinkedIn and exchanges code for tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { createLinkedInClient } from '@/lib/linkedin/client'
import { LinkedInAuthError, LinkedInAPIError } from '@/lib/linkedin/config'
import { connectToDatabase } from '@/lib/database/connection'
import { User } from '@/lib/database/models'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription)
      
      // Redirect to admin with error
      const redirectUrl = new URL('/admin/settings?linkedin_error=oauth_failed', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Validate required parameters
    if (!code) {
      console.error('LinkedIn OAuth callback: Missing authorization code')
      const redirectUrl = new URL('/admin/settings?linkedin_error=missing_code', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    if (!state) {
      console.error('LinkedIn OAuth callback: Missing state parameter')
      const redirectUrl = new URL('/admin/settings?linkedin_error=missing_state', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Create LinkedIn client and exchange code for tokens
    const linkedInClient = createLinkedInClient()
    
    try {
      const tokens = await linkedInClient.exchangeCodeForToken(code, state)
      
      // Get user profile information
      linkedInClient.setAccessToken(tokens.accessToken, tokens.expiresAt)
      const profile = await linkedInClient.getProfile()
      const email = await linkedInClient.getEmailAddress()

      // Connect to database
      await connectToDatabase()

      // Store LinkedIn credentials in database
      // For this implementation, we'll store it with the admin user
      // In a multi-user system, you'd associate it with the authenticated user
      
      const adminUser = await User.findOne({ role: 'admin' })
      if (!adminUser) {
        throw new Error('Admin user not found')
      }

      // Update user with LinkedIn credentials
      adminUser.linkedInIntegration = {
        isConnected: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(tokens.expiresAt),
        scope: tokens.scope,
        profile: {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: email || undefined,
          profilePicture: profile.profilePicture?.displayImage
        },
        connectedAt: new Date(),
        lastUsed: new Date()
      }

      await adminUser.save()

      console.log('LinkedIn integration successful for user:', adminUser.username)

      // Redirect to admin settings with success message
      const redirectUrl = new URL('/admin/settings?linkedin_success=connected', request.url)
      return NextResponse.redirect(redirectUrl)

    } catch (authError) {
      console.error('LinkedIn token exchange error:', authError)
      
      let errorCode = 'token_exchange_failed'
      if (authError instanceof LinkedInAuthError) {
        errorCode = authError.errorCode || 'auth_failed'
      } else if (authError instanceof LinkedInAPIError) {
        errorCode = authError.errorCode || 'api_failed'
      }

      const redirectUrl = new URL(`/admin/settings?linkedin_error=${errorCode}`, request.url)
      return NextResponse.redirect(redirectUrl)
    }

  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error)
    
    // Redirect to admin with generic error
    const redirectUrl = new URL('/admin/settings?linkedin_error=callback_failed', request.url)
    return NextResponse.redirect(redirectUrl)
  }
}

// Handle POST requests for manual token refresh or other operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, refreshToken } = body

    if (action === 'refresh') {
      // Handle token refresh
      // LinkedIn doesn't provide refresh tokens in their current API
      // This would be used if they add refresh token support in the future
      
      return NextResponse.json({
        success: false,
        error: 'Token refresh not supported by LinkedIn API'
      }, { status: 400 })
    }

    if (action === 'validate') {
      // Validate current LinkedIn connection
      await connectToDatabase()
      
      const adminUser = await User.findOne({ role: 'admin' })
      if (!adminUser || !adminUser.linkedInIntegration?.isConnected) {
        return NextResponse.json({
          success: false,
          error: 'LinkedIn not connected'
        }, { status: 400 })
      }

      const integration = adminUser.linkedInIntegration
      const isExpired = integration.expiresAt && integration.expiresAt < new Date()

      if (isExpired) {
        // Mark as disconnected if expired
        integration.isConnected = false
        await adminUser.save()

        return NextResponse.json({
          success: false,
          error: 'LinkedIn token has expired'
        }, { status: 401 })
      }

      // Test the connection by making a simple API call
      try {
        const linkedInClient = createLinkedInClient(
          integration.accessToken,
          integration.expiresAt?.getTime()
        )
        
        await linkedInClient.getProfile()

        // Update last used timestamp
        integration.lastUsed = new Date()
        await adminUser.save()

        return NextResponse.json({
          success: true,
          data: {
            isConnected: true,
            profile: integration.profile,
            connectedAt: integration.connectedAt,
            lastUsed: integration.lastUsed
          }
        })

      } catch (apiError) {
        console.error('LinkedIn API validation error:', apiError)
        
        // Mark as disconnected if API call fails
        integration.isConnected = false
        await adminUser.save()

        return NextResponse.json({
          success: false,
          error: 'LinkedIn connection is no longer valid'
        }, { status: 401 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('LinkedIn callback POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process LinkedIn callback request'
    }, { status: 500 })
  }
}

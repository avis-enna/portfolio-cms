/**
 * LinkedIn Share API Route
 * Handles sharing portfolio content to LinkedIn
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { createLinkedInClient, formatShareContent, createPortfolioShareContent } from '@/lib/linkedin/client'
import { LinkedInAPIError, LinkedInAuthError } from '@/lib/linkedin/config'
import { connectToDatabase } from '@/lib/database/connection'
import { User, PortfolioData } from '@/lib/database/models'
import { rateLimit } from '@/lib/middleware/rateLimit'

// Rate limiting for LinkedIn sharing
const shareRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25, // LinkedIn allows 25 shares per hour
  message: 'Too many LinkedIn shares. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await shareRateLimit(request)
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
    const payload = verifyJWT(token)
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { 
      type, 
      content, 
      customMessage, 
      visibility = 'PUBLIC',
      includePortfolioUrl = true 
    } = body

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Share type is required' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Get admin user and LinkedIn integration
    const adminUser = await User.findOne({ role: 'admin' })
    if (!adminUser || !adminUser.linkedInIntegration?.isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'LinkedIn account not connected. Please connect your LinkedIn account first.' 
        },
        { status: 400 }
      )
    }

    const integration = adminUser.linkedInIntegration

    // Check if token is expired
    if (integration.expiresAt && integration.expiresAt < new Date()) {
      // Mark as disconnected
      integration.isConnected = false
      await adminUser.save()

      return NextResponse.json(
        { 
          success: false, 
          error: 'LinkedIn token has expired. Please reconnect your LinkedIn account.' 
        },
        { status: 401 }
      )
    }

    // Create LinkedIn client
    const linkedInClient = createLinkedInClient(
      integration.accessToken,
      integration.expiresAt?.getTime()
    )

    let shareContent: any

    try {
      // Generate share content based on type
      switch (type) {
        case 'portfolio':
          // Get portfolio data
          const portfolioData = await PortfolioData.findOne().lean()
          if (!portfolioData) {
            return NextResponse.json(
              { success: false, error: 'Portfolio data not found' },
              { status: 404 }
            )
          }

          const portfolioUrl = includePortfolioUrl 
            ? `${process.env.NEXTAUTH_URL || 'https://yourportfolio.com'}`
            : undefined

          shareContent = createPortfolioShareContent(
            {
              name: portfolioData.personalInfo?.name || 'Professional',
              title: portfolioData.personalInfo?.title || 'Developer',
              summary: portfolioData.summary
            },
            portfolioUrl || '',
            customMessage
          )
          break

        case 'project':
          if (!content?.title || !content?.description) {
            return NextResponse.json(
              { success: false, error: 'Project title and description are required' },
              { status: 400 }
            )
          }

          const projectMessage = customMessage || 
            `🚀 Excited to share my latest project: ${content.title}! ${content.description}`

          shareContent = formatShareContent(
            projectMessage,
            content.url,
            {
              title: content.title,
              description: content.description,
              visibility
            }
          )
          break

        case 'blog':
          if (!content?.title || !content?.excerpt) {
            return NextResponse.json(
              { success: false, error: 'Blog title and excerpt are required' },
              { status: 400 }
            )
          }

          const blogMessage = customMessage || 
            `📝 New blog post: ${content.title}! ${content.excerpt}`

          shareContent = formatShareContent(
            blogMessage,
            content.url,
            {
              title: content.title,
              description: content.excerpt,
              visibility
            }
          )
          break

        case 'custom':
          if (!content?.text) {
            return NextResponse.json(
              { success: false, error: 'Custom message text is required' },
              { status: 400 }
            )
          }

          shareContent = formatShareContent(
            content.text,
            content.url,
            {
              title: content.title,
              description: content.description,
              visibility
            }
          )
          break

        default:
          return NextResponse.json(
            { success: false, error: 'Invalid share type' },
            { status: 400 }
          )
      }

      // Share to LinkedIn
      const shareResponse = await linkedInClient.shareContent(shareContent)

      // Update last used timestamp
      integration.lastUsed = new Date()
      await adminUser.save()

      // Log the share for analytics
      console.log('LinkedIn share successful:', {
        type,
        shareId: shareResponse.id,
        userId: adminUser._id,
        timestamp: new Date()
      })

      return NextResponse.json({
        success: true,
        data: {
          shareId: shareResponse.id,
          shareUrl: `https://www.linkedin.com/feed/update/${shareResponse.activity}`,
          message: 'Content shared to LinkedIn successfully!',
          sharedAt: new Date(shareResponse.created.time)
        }
      })

    } catch (shareError) {
      console.error('LinkedIn share error:', shareError)

      if (shareError instanceof LinkedInAuthError) {
        // Token might be invalid, mark as disconnected
        integration.isConnected = false
        await adminUser.save()

        return NextResponse.json(
          { 
            success: false, 
            error: 'LinkedIn authentication failed. Please reconnect your account.',
            code: 'auth_failed'
          },
          { status: 401 }
        )
      }

      if (shareError instanceof LinkedInAPIError) {
        let errorMessage = 'Failed to share to LinkedIn'
        
        switch (shareError.errorCode) {
          case 'text_too_long':
            errorMessage = 'Share text is too long. Please shorten your message.'
            break
          case 'invalid_content':
            errorMessage = 'Invalid content format. Please check your message.'
            break
          case 'rate_limit_exceeded':
            errorMessage = 'LinkedIn rate limit exceeded. Please try again later.'
            break
          default:
            errorMessage = shareError.message || errorMessage
        }

        return NextResponse.json(
          { 
            success: false, 
            error: errorMessage,
            code: shareError.errorCode
          },
          { status: shareError.statusCode || 400 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'An unexpected error occurred while sharing to LinkedIn' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('LinkedIn share API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process LinkedIn share request' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check LinkedIn connection status
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
    const payload = verifyJWT(token)
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Get LinkedIn integration status
    const adminUser = await User.findOne({ role: 'admin' })
    if (!adminUser || !adminUser.linkedInIntegration) {
      return NextResponse.json({
        success: true,
        data: {
          isConnected: false,
          profile: null
        }
      })
    }

    const integration = adminUser.linkedInIntegration
    const isExpired = integration.expiresAt && integration.expiresAt < new Date()

    if (isExpired && integration.isConnected) {
      // Mark as disconnected if expired
      integration.isConnected = false
      await adminUser.save()
    }

    return NextResponse.json({
      success: true,
      data: {
        isConnected: integration.isConnected && !isExpired,
        profile: integration.isConnected ? {
          name: `${integration.profile?.firstName?.localized?.en_US || ''} ${integration.profile?.lastName?.localized?.en_US || ''}`.trim(),
          email: integration.profile?.email,
          profilePicture: integration.profile?.profilePicture
        } : null,
        connectedAt: integration.connectedAt,
        lastUsed: integration.lastUsed,
        expiresAt: integration.expiresAt
      }
    })

  } catch (error) {
    console.error('LinkedIn status check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check LinkedIn connection status' 
      },
      { status: 500 }
    )
  }
}

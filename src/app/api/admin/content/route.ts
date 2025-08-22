import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { connectToDatabase } from '@/lib/database/connection'
import { PortfolioContent } from '@/lib/database/models'

/**
 * GET /api/admin/content
 * Get portfolio content for admin editing
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: 401 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Get portfolio content from database
    let portfolioContent = await PortfolioContent.findOne().sort({ updatedAt: -1 })

    // If no content exists, create minimal default content
    if (!portfolioContent) {
      portfolioContent = new PortfolioContent({
        summary: 'Welcome to my portfolio. Please update this content through the admin panel.',
        technicalSkills: [],
        softSkills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        contactInfo: {
          email: 'contact@example.com',
          location: 'Location not specified',
        },
        seoMetadata: {
          title: 'Portfolio',
          description: 'Professional portfolio website',
          keywords: []
        }
      })
      await portfolioContent.save()
    }

    // Return current content
    return NextResponse.json(
      {
        success: true,
        content: portfolioContent,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get content error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/content
 * Update portfolio content
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: 401 }
      )
    }

    // Check content type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type must be application/json',
        },
        { status: 400 }
      )
    }

    // Parse request body
    let updateData
    try {
      updateData = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Get existing portfolio content or create new one
    let portfolioContent = await PortfolioContent.findOne().sort({ updatedAt: -1 })

    if (!portfolioContent) {
      // Create new portfolio content
      portfolioContent = new PortfolioContent({
        summary: updateData.summary || 'I\'m a passionate full-stack developer with experience building scalable web applications.',
        technicalSkills: updateData.technicalSkills || [],
        softSkills: updateData.softSkills || [],
        experience: updateData.experience || [],
        education: updateData.education || [],
        projects: updateData.projects || [],
        certifications: updateData.certifications || [],
        contactInfo: updateData.contactInfo || {
          email: 'admin@example.com',
          location: 'Remote',
        },
        seoMetadata: updateData.seoMetadata || {
          title: 'Full Stack Developer Portfolio',
          description: 'Professional portfolio showcasing web development projects and skills',
          keywords: ['web development', 'full stack', 'react', 'node.js']
        }
      })
    } else {
      // Update existing content
      Object.assign(portfolioContent, updateData)
    }

    // Save to database
    await portfolioContent.save()

    console.log('✅ Content updated successfully in database:', Object.keys(updateData))

    return NextResponse.json(
      {
        success: true,
        message: 'Content updated successfully',
        content: portfolioContent,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update content error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
    },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
    },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
    },
    { status: 405 }
  )
}

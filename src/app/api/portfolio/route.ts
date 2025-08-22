import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import { PortfolioContent } from '@/lib/database/models'

/**
 * GET /api/portfolio
 * Get public portfolio content
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase()

    // Get portfolio content from database
    const portfolioContent = await PortfolioContent.findOne()
      .sort({ updatedAt: -1 })
      .lean()

    // If no content exists, return minimal default content
    if (!portfolioContent) {
      const defaultContent = {
        technicalSkills: [],
        softSkills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        contactInfo: {
          email: 'contact@example.com',
          location: 'Location not specified'
        },
        seoMetadata: {
          title: 'Portfolio',
          description: 'Professional portfolio website',
          keywords: []
        }
      }

      return NextResponse.json(
        {
          success: true,
          content: defaultContent,
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
          }
        }
      )
    }

    // Return portfolio content
    return NextResponse.json(
      {
        success: true,
        content: portfolioContent,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      }
    )
  } catch (error) {
    console.error('Portfolio API error:', error)

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

export async function PUT() {
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

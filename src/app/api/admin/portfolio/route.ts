import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import { PortfolioContent } from '@/lib/database/models'
import { verifyAccessToken } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get portfolio data
    const portfolio = await PortfolioContent.findOne({ userId: decoded.userId })
    
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        id: portfolio._id,
        personal: portfolio.personal,
        social: portfolio.social,
        features: portfolio.features,
        theme: portfolio.theme,
        projects: portfolio.projects,
        skills: portfolio.skills,
        experience: portfolio.experience,
        education: portfolio.education,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt
      }
    })
  } catch (error) {
    console.error('Portfolio GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    await connectToDatabase()

    // Update portfolio data
    const portfolio = await PortfolioContent.findOneAndUpdate(
      { userId: decoded.userId },
      {
        $set: {
          ...body,
          updatedAt: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    )

    return NextResponse.json({
      success: true,
      portfolio: {
        id: portfolio._id,
        personal: portfolio.personal,
        social: portfolio.social,
        features: portfolio.features,
        theme: portfolio.theme,
        projects: portfolio.projects,
        skills: portfolio.skills,
        experience: portfolio.experience,
        education: portfolio.education,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt
      }
    })
  } catch (error) {
    console.error('Portfolio PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

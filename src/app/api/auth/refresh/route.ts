import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import User from '@/lib/database/models/User'
import { verifyRefreshToken, generateTokens } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
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
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    const { refreshToken } = body

    // Validate required fields
    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh token is required',
        },
        { status: 400 }
      )
    }

    // Validate field type
    if (typeof refreshToken !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh token must be a string',
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Verify refresh token
    let payload
    try {
      payload = await verifyRefreshToken(refreshToken)
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid refresh token',
        },
        { status: 401 }
      )
    }

    // Find user with this refresh token
    const user = await User.findOne({
      _id: payload.userId,
      refreshTokens: refreshToken,
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid refresh token',
        },
        { status: 401 }
      )
    }

    // Generate new tokens
    const newTokens = await generateTokens({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    })

    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken)
    await user.addRefreshToken(newTokens.refreshToken)
    await user.save()

    // Return new tokens
    return NextResponse.json(
      {
        success: true,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Refresh token error:', error)
    
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
export async function GET() {
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

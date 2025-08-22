import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import User from '@/lib/database/models/User'
import { verifyRefreshToken } from '@/lib/auth/jwt'

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

    const { refreshToken, logoutAll = false } = body

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

    // Validate field types
    if (typeof refreshToken !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh token must be a string',
        },
        { status: 400 }
      )
    }

    if (typeof logoutAll !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'logoutAll must be a boolean',
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

    // Remove refresh token(s)
    if (logoutAll) {
      // Clear all refresh tokens (logout from all sessions)
      await user.clearRefreshTokens()
      await user.save()

      return NextResponse.json(
        {
          success: true,
          message: 'Logged out from all sessions successfully',
        },
        { status: 200 }
      )
    } else {
      // Remove only this refresh token (logout from current session)
      await user.removeRefreshToken(refreshToken)
      await user.save()

      return NextResponse.json(
        {
          success: true,
          message: 'Logged out successfully',
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Logout error:', error)
    
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

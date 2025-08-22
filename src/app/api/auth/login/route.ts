import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import User from '@/lib/database/models/User'
import { generateTokens } from '@/lib/auth/jwt'
import { loginRateLimiter, getClientIdentifier } from '@/lib/auth/rateLimiter'
import { securityAuditor } from '@/lib/auth/securityAudit'

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const startTime = Date.now()

  try {
    // Check rate limiting first
    if (loginRateLimiter.isRateLimited(clientId)) {
      const status = loginRateLimiter.getStatus(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil(status.timeUntilUnblocked / 1000), // seconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(status.timeUntilUnblocked / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': status.remainingAttempts.toString(),
            'X-RateLimit-Reset': Math.ceil(status.windowResetTime / 1000).toString(),
          }
        }
      )
    }

    // Check content type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      loginRateLimiter.recordFailedAttempt(clientId)
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

    const { username, password } = body

    // Validate required fields
    if (!username || !password) {
      loginRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Username and password are required',
        },
        { status: 400 }
      )
    }

    // Validate field types
    if (typeof username !== 'string' || typeof password !== 'string') {
      loginRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Username and password must be strings',
        },
        { status: 400 }
      )
    }

    // Additional security validations
    if (username.length > 100 || password.length > 200) {
      loginRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Input too long',
        },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim().toLowerCase()

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /[<>'"]/,  // HTML/JS injection
      /[;\\]/,   // SQL injection
      /\x00/,    // Null bytes
      /\r|\n/,   // Line breaks
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitizedUsername) || pattern.test(password)) {
        loginRateLimiter.recordFailedAttempt(clientId)
        securityAuditor.logSuspiciousActivity(clientId, 'injection_attempt', {
          username: sanitizedUsername,
          userAgent: request.headers.get('user-agent'),
          pattern: pattern.toString(),
        }, 'high')

        return NextResponse.json(
          {
            success: false,
            error: 'Invalid characters in credentials',
          },
          { status: 400 }
        )
      }
    }

    // Connect to database
    await connectToDatabase()

    // Add timing attack protection - always take minimum time
    const startTime = Date.now()
    const minResponseTime = 100 // 100ms minimum

    // Find user by username or email
    const user = await User.findByUsernameOrEmail(sanitizedUsername)
    if (!user) {
      // Ensure consistent timing
      const elapsed = Date.now() - startTime
      if (elapsed < minResponseTime) {
        await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsed))
      }

      loginRateLimiter.recordFailedAttempt(clientId)
      securityAuditor.logLoginAttempt(clientId, sanitizedUsername, false, {
        reason: 'user_not_found',
        userAgent: request.headers.get('user-agent'),
        responseTime: Date.now() - startTime,
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
        },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      // Ensure consistent timing
      const elapsed = Date.now() - startTime
      if (elapsed < minResponseTime) {
        await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsed))
      }

      loginRateLimiter.recordFailedAttempt(clientId)
      securityAuditor.logLoginAttempt(clientId, sanitizedUsername, false, {
        reason: 'invalid_password',
        userAgent: request.headers.get('user-agent'),
        responseTime: Date.now() - startTime,
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
        },
        { status: 401 }
      )
    }

    // Generate tokens
    const tokens = await generateTokens({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    })

    // Add refresh token to user
    await user.addRefreshToken(tokens.refreshToken)
    await user.save()

    // Record successful login (resets rate limit)
    loginRateLimiter.recordSuccessfulAttempt(clientId)
    securityAuditor.logLoginAttempt(clientId, sanitizedUsername, true, {
      userId: user._id.toString(),
      userAgent: request.headers.get('user-agent'),
      responseTime: Date.now() - startTime,
    })

    // Return success response with security headers
    return NextResponse.json(
      {
        success: true,
        user: user.toJSON(),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      {
        status: 200,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        }
      }
    )
  } catch (error) {
    console.error('Login error:', error)
    
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

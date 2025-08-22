import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import { ContactSubmission } from '@/lib/database/models'
import { apiRateLimiter, getClientIdentifier } from '@/lib/auth/rateLimiter'
import { securityAuditor } from '@/lib/auth/securityAudit'

/**
 * POST /api/contact
 * Submit a contact form message
 */
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const startTime = Date.now()
  
  try {
    // Check rate limiting (stricter for contact form to prevent spam)
    if (apiRateLimiter.isRateLimited(clientId)) {
      const status = apiRateLimiter.getStatus(clientId)
      securityAuditor.logRateLimitHit(clientId, '/api/contact', {
        remainingAttempts: status.remainingAttempts,
        timeUntilUnblocked: status.timeUntilUnblocked,
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Too many contact submissions. Please try again later.',
          retryAfter: Math.ceil(status.timeUntilUnblocked / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(status.timeUntilUnblocked / 1000).toString(),
          }
        }
      )
    }

    // Check content type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      apiRateLimiter.recordFailedAttempt(clientId)
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
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    const { name, email, message, subject } = body

    // Validate required fields
    if (!name || !email || !message) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Name, email, and message are required',
          details: {
            name: !name ? 'Name is required' : null,
            email: !email ? 'Email is required' : null,
            message: !message ? 'Message is required' : null
          }
        },
        { status: 400 }
      )
    }

    // Validate field types
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Name, email, and message must be strings',
        },
        { status: 400 }
      )
    }

    // Validate field lengths
    if (name.length > 100) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Name must be 100 characters or less',
        },
        { status: 400 }
      )
    }

    if (email.length > 254) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Email must be 254 characters or less',
        },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Message must be 5,000 characters or less',
        },
        { status: 400 }
      )
    }

    if (subject && subject.length > 200) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Subject must be 200 characters or less',
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(email)) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid email address',
        },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedName = name.trim()
    const sanitizedEmail = email.trim().toLowerCase()
    const sanitizedMessage = message.trim()
    const sanitizedSubject = subject ? subject.trim() : ''

    // Check for suspicious patterns (spam detection)
    const suspiciousPatterns = [
      /[<>'"]/,  // HTML/JS injection
      /\b(viagra|cialis|casino|lottery|winner|congratulations)\b/i, // Common spam words
      /\b(click here|free money|make money|work from home)\b/i, // More spam patterns
      /\x00/,    // Null bytes
    ]

    const fieldsToCheck = [sanitizedName, sanitizedEmail, sanitizedMessage, sanitizedSubject].filter(Boolean)
    
    for (const field of fieldsToCheck) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(field)) {
          apiRateLimiter.recordFailedAttempt(clientId)
          securityAuditor.logSuspiciousActivity(clientId, 'spam_attempt', {
            name: sanitizedName,
            email: sanitizedEmail,
            userAgent: request.headers.get('user-agent'),
            pattern: pattern.toString(),
          }, 'medium')
          
          return NextResponse.json(
            {
              success: false,
              error: 'Message contains invalid content',
            },
            { status: 400 }
          )
        }
      }
    }

    // Check for duplicate submissions (same email and message within 1 hour)
    await connectToDatabase()
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const duplicateSubmission = await ContactSubmission.findOne({
      email: sanitizedEmail,
      message: sanitizedMessage,
      submittedAt: { $gte: oneHourAgo }
    })

    if (duplicateSubmission) {
      apiRateLimiter.recordFailedAttempt(clientId)
      securityAuditor.logSuspiciousActivity(clientId, 'duplicate_submission', {
        email: sanitizedEmail,
        originalSubmissionId: duplicateSubmission._id.toString(),
      }, 'medium')
      
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate submission detected. Please wait before submitting again.',
        },
        { status: 429 }
      )
    }

    // Create contact submission
    const contactSubmission = new ContactSubmission({
      name: sanitizedName,
      email: sanitizedEmail,
      message: sanitizedMessage,
      subject: sanitizedSubject || 'Contact Form Submission',
      submittedAt: new Date(),
      isRead: false,
      metadata: {
        userAgent: request.headers.get('user-agent') || 'Unknown',
        ipAddress: clientId,
        referer: request.headers.get('referer') || null,
        responseTime: Date.now() - startTime
      }
    })

    await contactSubmission.save()

    // Record successful submission
    apiRateLimiter.recordSuccessfulAttempt(clientId)
    securityAuditor.logEvent({
      type: 'login_attempt', // Using existing type for now
      clientId,
      details: {
        action: 'contact_submission',
        submissionId: contactSubmission._id.toString(),
        email: sanitizedEmail,
        responseTime: Date.now() - startTime,
      },
      severity: 'low'
    })

    // In a real application, you might want to:
    // 1. Send an email notification to the admin
    // 2. Send a confirmation email to the user
    // 3. Add to a queue for processing

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message! I\'ll get back to you soon.',
        data: {
          submissionId: contactSubmission._id.toString(),
          submittedAt: contactSubmission.submittedAt.toISOString()
        }
      },
      { 
        status: 201,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        }
      }
    )
  } catch (error) {
    console.error('Contact submission error:', error)
    apiRateLimiter.recordFailedAttempt(clientId)
    securityAuditor.logSuspiciousActivity(clientId, 'api_error', {
      endpoint: '/api/contact',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

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

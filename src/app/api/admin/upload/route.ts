import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { apiRateLimiter, getClientIdentifier } from '@/lib/auth/rateLimiter'
import { securityAuditor } from '@/lib/auth/securityAudit'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * POST /api/admin/upload
 * Upload files (images, documents, etc.)
 */
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  
  try {
    // Check rate limiting
    if (apiRateLimiter.isRateLimited(clientId)) {
      const status = apiRateLimiter.getStatus(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many upload requests. Please try again later.',
          retryAfter: Math.ceil(status.timeUntilUnblocked / 1000),
        },
        { status: 429 }
      )
    }

    // Authenticate user
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: 401 }
      )
    }

    // Parse form data
    let formData
    try {
      formData = await request.formData()
    } catch (error) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data',
        },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File
    const uploadType = formData.get('type') as string || 'general'

    if (!file) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'File size must be less than 10MB',
        },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      general: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    }

    const validTypes = allowedTypes[uploadType as keyof typeof allowedTypes] || allowedTypes.general
    
    if (!validTypes.includes(file.type)) {
      apiRateLimiter.recordFailedAttempt(clientId)
      securityAuditor.logSuspiciousActivity(clientId, 'invalid_file_upload', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadType,
      }, 'medium')
      
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed types: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate file name
    const originalName = file.name
    if (originalName.length > 255) {
      return NextResponse.json(
        {
          success: false,
          error: 'File name must be 255 characters or less',
        },
        { status: 400 }
      )
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.(php|jsp|asp|exe|bat|cmd|sh|ps1)$/i, // Executable extensions
      /[<>:"|?*]/,  // Invalid filename characters
      /\x00/,       // Null bytes
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(originalName)) {
        apiRateLimiter.recordFailedAttempt(clientId)
        securityAuditor.logSuspiciousActivity(clientId, 'malicious_filename', {
          fileName: originalName,
          pattern: pattern.toString(),
        }, 'high')
        
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid file name',
          },
          { status: 400 }
        )
      }
    }

    // Generate safe file name
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || ''
    const safeFileName = `${timestamp}-${randomString}.${fileExtension}`

    // Determine upload directory based on type
    const uploadDir = join(process.cwd(), 'public', 'uploads', uploadType)
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Additional security check: validate file content
    if (uploadType === 'image') {
      // Check if file actually contains image data
      const imageSignatures = [
        [0xFF, 0xD8, 0xFF], // JPEG
        [0x89, 0x50, 0x4E, 0x47], // PNG
        [0x47, 0x49, 0x46], // GIF
        [0x52, 0x49, 0x46, 0x46], // WEBP (RIFF)
      ]

      const isValidImage = imageSignatures.some(signature => {
        return signature.every((byte, index) => buffer[index] === byte)
      })

      if (!isValidImage) {
        apiRateLimiter.recordFailedAttempt(clientId)
        securityAuditor.logSuspiciousActivity(clientId, 'fake_image_upload', {
          fileName: originalName,
          fileType: file.type,
          actualSignature: Array.from(buffer.slice(0, 8)).map(b => b.toString(16)).join(' '),
        }, 'high')
        
        return NextResponse.json(
          {
            success: false,
            error: 'File does not contain valid image data',
          },
          { status: 400 }
        )
      }
    }

    // Write file to disk
    const filePath = join(uploadDir, safeFileName)
    await writeFile(filePath, buffer)

    // Generate public URL
    const publicUrl = `/uploads/${uploadType}/${safeFileName}`

    // Log successful upload
    securityAuditor.logEvent({
      type: 'login_attempt', // Using existing type
      clientId,
      userId: authResult.user!.userId,
      details: {
        action: 'file_upload',
        fileName: originalName,
        safeFileName,
        fileType: file.type,
        fileSize: file.size,
        uploadType,
        publicUrl,
      },
      severity: 'low'
    })

    return NextResponse.json(
      {
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileName: safeFileName,
          originalName,
          fileType: file.type,
          fileSize: file.size,
          uploadType,
          url: publicUrl,
          uploadedAt: new Date().toISOString()
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('File upload error:', error)
    apiRateLimiter.recordFailedAttempt(clientId)
    securityAuditor.logSuspiciousActivity(clientId, 'upload_error', {
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

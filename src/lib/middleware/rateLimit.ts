import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum number of requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (req: NextRequest) => string // Custom key generator
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (in production, use Redis)
const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req: NextRequest) => {
      // Default key generator uses IP address
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
      return ip
    }
  } = config

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = keyGenerator(req)
    const now = Date.now()
    const resetTime = now + windowMs

    // Initialize or get existing record
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime
      }
    }

    // Check if limit exceeded
    if (store[key].count >= maxRequests) {
      return NextResponse.json(
        { 
          error: message,
          retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': store[key].resetTime.toString(),
            'Retry-After': Math.ceil((store[key].resetTime - now) / 1000).toString()
          }
        }
      )
    }

    // Increment counter
    store[key].count++

    // Add rate limit headers to response (will be added by the calling function)
    return null // Allow request to proceed
  }
}

// Middleware wrapper for API routes
export function withRateLimit(config: RateLimitConfig) {
  return function rateLimitMiddleware(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const rateLimitResponse = await rateLimit(config)(req)
      
      if (rateLimitResponse) {
        return rateLimitResponse
      }

      // Execute the actual handler
      const response = await handler(req)

      // Add rate limit headers to successful responses
      const key = config.keyGenerator ? config.keyGenerator(req) : req.ip || 'unknown'
      const record = store[key]
      
      if (record) {
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - record.count).toString())
        response.headers.set('X-RateLimit-Reset', record.resetTime.toString())
      }

      return response
    }
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Strict rate limiting for expensive operations
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many requests. Please wait 15 minutes before trying again.'
  },

  // Moderate rate limiting for API calls
  moderate: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Rate limit exceeded. Please try again later.'
  },

  // Lenient rate limiting for general use
  lenient: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Rate limit exceeded. Please try again later.'
  },

  // AI-specific rate limiting (expensive operations)
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'AI request limit exceeded. Please try again in an hour.'
  },

  // Authentication rate limiting
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.'
  },

  // Analytics rate limiting (more permissive)
  analytics: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 1000,
    message: 'Analytics rate limit exceeded.'
  },

  // File upload rate limiting
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Upload limit exceeded. Please try again later.'
  }
}

// Helper function to get client IP
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const cfConnectingIP = req.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  return req.ip || 'unknown'
}

// Advanced rate limiting with sliding window
export class SlidingWindowRateLimit {
  private windows: Map<string, number[]> = new Map()
  
  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    // Get or create window for this key
    let window = this.windows.get(key) || []
    
    // Remove old requests outside the window
    window = window.filter(timestamp => timestamp > windowStart)
    
    // Check if we can allow this request
    if (window.length >= this.maxRequests) {
      return false
    }
    
    // Add current request
    window.push(now)
    this.windows.set(key, window)
    
    return true
  }

  getRemainingRequests(key: string): number {
    const now = Date.now()
    const windowStart = now - this.windowMs
    const window = this.windows.get(key) || []
    const validRequests = window.filter(timestamp => timestamp > windowStart)
    
    return Math.max(0, this.maxRequests - validRequests.length)
  }

  cleanup(): void {
    const now = Date.now()
    const cutoff = now - this.windowMs * 2 // Keep some buffer
    
    for (const [key, window] of this.windows.entries()) {
      const validRequests = window.filter(timestamp => timestamp > cutoff)
      if (validRequests.length === 0) {
        this.windows.delete(key)
      } else {
        this.windows.set(key, validRequests)
      }
    }
  }
}

// Global cleanup for sliding window rate limits
const slidingWindowCleanupInterval = setInterval(() => {
  // This would be called on any active sliding window instances
  // In a real implementation, you'd track these instances
}, 10 * 60 * 1000) // Clean up every 10 minutes

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    clearInterval(slidingWindowCleanupInterval)
  })
}

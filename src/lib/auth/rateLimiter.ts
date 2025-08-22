/**
 * Rate limiting utilities for authentication security
 */

interface RateLimitEntry {
  count: number
  firstAttempt: number
  lastAttempt: number
  blocked: boolean
  blockUntil?: number
}

class RateLimiter {
  private attempts = new Map<string, RateLimitEntry>()
  private maxAttempts: number
  private windowMs: number
  private blockDurationMs: number

  constructor(
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000, // 15 minutes
    blockDurationMs = 30 * 60 * 1000 // 30 minutes
  ) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
    this.blockDurationMs = blockDurationMs

    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Check if an IP/identifier is rate limited
   */
  isRateLimited(identifier: string): boolean {
    const entry = this.attempts.get(identifier)
    
    if (!entry) {
      return false
    }

    const now = Date.now()

    // Check if currently blocked
    if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
      return true
    }

    // Reset if block period has expired
    if (entry.blocked && entry.blockUntil && now >= entry.blockUntil) {
      this.attempts.delete(identifier)
      return false
    }

    // Check if window has expired
    if (now - entry.firstAttempt > this.windowMs) {
      this.attempts.delete(identifier)
      return false
    }

    return entry.count >= this.maxAttempts
  }

  /**
   * Record a failed attempt
   */
  recordFailedAttempt(identifier: string): void {
    const now = Date.now()
    const entry = this.attempts.get(identifier)

    if (!entry) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
      })
      return
    }

    // Reset if window has expired
    if (now - entry.firstAttempt > this.windowMs) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
      })
      return
    }

    // Increment count
    entry.count++
    entry.lastAttempt = now

    // Block if max attempts reached
    if (entry.count >= this.maxAttempts) {
      entry.blocked = true
      entry.blockUntil = now + this.blockDurationMs
    }

    this.attempts.set(identifier, entry)
  }

  /**
   * Record a successful attempt (resets the counter)
   */
  recordSuccessfulAttempt(identifier: string): void {
    this.attempts.delete(identifier)
  }

  /**
   * Get remaining attempts before rate limit
   */
  getRemainingAttempts(identifier: string): number {
    const entry = this.attempts.get(identifier)
    
    if (!entry) {
      return this.maxAttempts
    }

    const now = Date.now()

    // Reset if window has expired
    if (now - entry.firstAttempt > this.windowMs) {
      this.attempts.delete(identifier)
      return this.maxAttempts
    }

    return Math.max(0, this.maxAttempts - entry.count)
  }

  /**
   * Get time until unblocked (in milliseconds)
   */
  getTimeUntilUnblocked(identifier: string): number {
    const entry = this.attempts.get(identifier)
    
    if (!entry || !entry.blocked || !entry.blockUntil) {
      return 0
    }

    const now = Date.now()
    return Math.max(0, entry.blockUntil - now)
  }

  /**
   * Manually block an identifier
   */
  blockIdentifier(identifier: string, durationMs?: number): void {
    const now = Date.now()
    const blockDuration = durationMs || this.blockDurationMs

    this.attempts.set(identifier, {
      count: this.maxAttempts,
      firstAttempt: now,
      lastAttempt: now,
      blocked: true,
      blockUntil: now + blockDuration,
    })
  }

  /**
   * Manually unblock an identifier
   */
  unblockIdentifier(identifier: string): void {
    this.attempts.delete(identifier)
  }

  /**
   * Get rate limit status for an identifier
   */
  getStatus(identifier: string): {
    isBlocked: boolean
    remainingAttempts: number
    timeUntilUnblocked: number
    windowResetTime: number
  } {
    const entry = this.attempts.get(identifier)
    const now = Date.now()

    if (!entry) {
      return {
        isBlocked: false,
        remainingAttempts: this.maxAttempts,
        timeUntilUnblocked: 0,
        windowResetTime: 0,
      }
    }

    // Check if window has expired
    if (now - entry.firstAttempt > this.windowMs) {
      this.attempts.delete(identifier)
      return {
        isBlocked: false,
        remainingAttempts: this.maxAttempts,
        timeUntilUnblocked: 0,
        windowResetTime: 0,
      }
    }

    return {
      isBlocked: this.isRateLimited(identifier),
      remainingAttempts: this.getRemainingAttempts(identifier),
      timeUntilUnblocked: this.getTimeUntilUnblocked(identifier),
      windowResetTime: entry.firstAttempt + this.windowMs,
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    
    for (const [identifier, entry] of this.attempts.entries()) {
      // Remove if window has expired and not blocked
      if (!entry.blocked && now - entry.firstAttempt > this.windowMs) {
        this.attempts.delete(identifier)
        continue
      }

      // Remove if block has expired
      if (entry.blocked && entry.blockUntil && now >= entry.blockUntil) {
        this.attempts.delete(identifier)
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntries: number
    blockedEntries: number
    activeEntries: number
  } {
    const now = Date.now()
    let blockedCount = 0
    let activeCount = 0

    for (const entry of this.attempts.values()) {
      if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
        blockedCount++
      }
      
      if (now - entry.firstAttempt <= this.windowMs) {
        activeCount++
      }
    }

    return {
      totalEntries: this.attempts.size,
      blockedEntries: blockedCount,
      activeEntries: activeCount,
    }
  }
}

// Create singleton instances for different types of rate limiting
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000, 30 * 60 * 1000) // 5 attempts per 15 min, block for 30 min
export const apiRateLimiter = new RateLimiter(100, 60 * 1000, 5 * 60 * 1000) // 100 requests per minute, block for 5 min
export const refreshRateLimiter = new RateLimiter(10, 60 * 1000, 10 * 60 * 1000) // 10 refresh attempts per minute, block for 10 min

/**
 * Extract client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  // Use the first available IP
  const ip = forwardedFor?.split(',')[0]?.trim() || 
            realIp || 
            cfConnectingIp || 
            'unknown'

  // In development, use a default identifier
  if (process.env.NODE_ENV === 'development' && ip === 'unknown') {
    return 'dev-client'
  }

  return ip
}

export default RateLimiter

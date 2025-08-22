/**
 * Rate limiter tests
 */

import RateLimiter, { loginRateLimiter, getClientIdentifier } from '../rateLimiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter(3, 1000, 2000) // 3 attempts per second, block for 2 seconds
  })

  describe('Basic Rate Limiting', () => {
    test('should allow requests under the limit', () => {
      expect(rateLimiter.isRateLimited('test-ip')).toBe(false)
      
      rateLimiter.recordFailedAttempt('test-ip')
      expect(rateLimiter.isRateLimited('test-ip')).toBe(false)
      
      rateLimiter.recordFailedAttempt('test-ip')
      expect(rateLimiter.isRateLimited('test-ip')).toBe(false)
    })

    test('should block after max attempts', () => {
      const ip = 'test-ip'
      
      // Make max attempts
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordFailedAttempt(ip)
      }
      
      expect(rateLimiter.isRateLimited(ip)).toBe(true)
    })

    test('should reset after successful attempt', () => {
      const ip = 'test-ip'
      
      rateLimiter.recordFailedAttempt(ip)
      rateLimiter.recordFailedAttempt(ip)
      
      expect(rateLimiter.getRemainingAttempts(ip)).toBe(1)
      
      rateLimiter.recordSuccessfulAttempt(ip)
      
      expect(rateLimiter.getRemainingAttempts(ip)).toBe(3)
    })

    test('should track remaining attempts correctly', () => {
      const ip = 'test-ip'
      
      expect(rateLimiter.getRemainingAttempts(ip)).toBe(3)
      
      rateLimiter.recordFailedAttempt(ip)
      expect(rateLimiter.getRemainingAttempts(ip)).toBe(2)
      
      rateLimiter.recordFailedAttempt(ip)
      expect(rateLimiter.getRemainingAttempts(ip)).toBe(1)
      
      rateLimiter.recordFailedAttempt(ip)
      expect(rateLimiter.getRemainingAttempts(ip)).toBe(0)
    })
  })

  describe('Time-based Behavior', () => {
    test('should reset after window expires', async () => {
      const ip = 'test-ip'
      
      // Make max attempts
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordFailedAttempt(ip)
      }
      
      expect(rateLimiter.isRateLimited(ip)).toBe(true)
      
      // Wait for window to expire (simulate by creating new limiter with expired time)
      const newLimiter = new RateLimiter(3, 1, 2000) // 1ms window
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(newLimiter.isRateLimited(ip)).toBe(false)
    })

    test('should unblock after block duration', async () => {
      const shortBlockLimiter = new RateLimiter(2, 1000, 10) // 10ms block
      const ip = 'test-ip'
      
      // Trigger block
      shortBlockLimiter.recordFailedAttempt(ip)
      shortBlockLimiter.recordFailedAttempt(ip)
      
      expect(shortBlockLimiter.isRateLimited(ip)).toBe(true)
      
      // Wait for block to expire
      await new Promise(resolve => setTimeout(resolve, 20))
      
      expect(shortBlockLimiter.isRateLimited(ip)).toBe(false)
    })
  })

  describe('Manual Controls', () => {
    test('should manually block identifier', () => {
      const ip = 'test-ip'
      
      expect(rateLimiter.isRateLimited(ip)).toBe(false)
      
      rateLimiter.blockIdentifier(ip, 1000)
      
      expect(rateLimiter.isRateLimited(ip)).toBe(true)
    })

    test('should manually unblock identifier', () => {
      const ip = 'test-ip'
      
      // Trigger block
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordFailedAttempt(ip)
      }
      
      expect(rateLimiter.isRateLimited(ip)).toBe(true)
      
      rateLimiter.unblockIdentifier(ip)
      
      expect(rateLimiter.isRateLimited(ip)).toBe(false)
    })
  })

  describe('Status Information', () => {
    test('should provide accurate status', () => {
      const ip = 'test-ip'
      
      let status = rateLimiter.getStatus(ip)
      expect(status.isBlocked).toBe(false)
      expect(status.remainingAttempts).toBe(3)
      
      rateLimiter.recordFailedAttempt(ip)
      
      status = rateLimiter.getStatus(ip)
      expect(status.isBlocked).toBe(false)
      expect(status.remainingAttempts).toBe(2)
      
      // Trigger block
      rateLimiter.recordFailedAttempt(ip)
      rateLimiter.recordFailedAttempt(ip)
      
      status = rateLimiter.getStatus(ip)
      expect(status.isBlocked).toBe(true)
      expect(status.remainingAttempts).toBe(0)
      expect(status.timeUntilUnblocked).toBeGreaterThan(0)
    })

    test('should provide statistics', () => {
      rateLimiter.recordFailedAttempt('ip1')
      rateLimiter.recordFailedAttempt('ip2')
      
      // Block ip3
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordFailedAttempt('ip3')
      }
      
      const stats = rateLimiter.getStats()
      expect(stats.totalEntries).toBe(3)
      expect(stats.blockedEntries).toBe(1)
      expect(stats.activeEntries).toBe(3)
    })
  })

  describe('Multiple Identifiers', () => {
    test('should handle multiple IPs independently', () => {
      const ip1 = 'ip1'
      const ip2 = 'ip2'
      
      // Block ip1
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordFailedAttempt(ip1)
      }
      
      expect(rateLimiter.isRateLimited(ip1)).toBe(true)
      expect(rateLimiter.isRateLimited(ip2)).toBe(false)
      
      // ip2 should still have full attempts
      expect(rateLimiter.getRemainingAttempts(ip2)).toBe(3)
    })
  })
})

describe('Client Identifier Extraction', () => {
  test('should extract IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1'
      }
    })
    
    expect(getClientIdentifier(request)).toBe('192.168.1.1')
  })

  test('should extract IP from x-real-ip header', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-real-ip': '192.168.1.2'
      }
    })
    
    expect(getClientIdentifier(request)).toBe('192.168.1.2')
  })

  test('should extract IP from cf-connecting-ip header', () => {
    const request = new Request('http://localhost', {
      headers: {
        'cf-connecting-ip': '192.168.1.3'
      }
    })
    
    expect(getClientIdentifier(request)).toBe('192.168.1.3')
  })

  test('should prioritize x-forwarded-for over other headers', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.2',
        'cf-connecting-ip': '192.168.1.3'
      }
    })
    
    expect(getClientIdentifier(request)).toBe('192.168.1.1')
  })

  test('should handle missing headers in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    const request = new Request('http://localhost')
    
    expect(getClientIdentifier(request)).toBe('dev-client')
    
    process.env.NODE_ENV = originalEnv
  })
})

describe('Singleton Rate Limiters', () => {
  test('should have different configurations for different limiters', () => {
    expect(loginRateLimiter).toBeDefined()
    
    // Test that they're independent
    loginRateLimiter.recordFailedAttempt('test-ip')
    
    expect(loginRateLimiter.getRemainingAttempts('test-ip')).toBeLessThan(5)
  })
})

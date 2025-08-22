import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware, requireAuth, optionalAuth } from '../middleware'
import * as jwt from '../jwt'

// Mock the JWT utilities
jest.mock('../jwt', () => ({
  extractTokenFromHeader: jest.fn(),
  verifyAccessToken: jest.fn(),
  isTokenExpired: jest.fn(),
}))

const mockJwt = jwt as jest.Mocked<typeof jwt>

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
    next: jest.fn(),
  },
}))

const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>

// Create mock response with headers
const mockResponseWithHeaders = {
  headers: {
    set: jest.fn(),
  },
}

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mock response headers
    mockResponseWithHeaders.headers.set.mockClear()
    mockNextResponse.next.mockReturnValue(mockResponseWithHeaders as any)
  })

  describe('authMiddleware', () => {
    it('should allow requests to public routes', async () => {
      const request = {
        nextUrl: { pathname: '/api/portfolio/content' },
        headers: { get: jest.fn() },
      } as unknown as NextRequest

      mockNextResponse.next.mockReturnValue('next-response' as any)

      const result = await authMiddleware(request)

      expect(result).toBe('next-response')
      expect(mockNextResponse.next).toHaveBeenCalled()
    })

    it('should require authentication for admin routes', async () => {
      const request = {
        nextUrl: { pathname: '/api/admin/content' },
        headers: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest

      mockNextResponse.json.mockReturnValue('unauthorized-response' as any)

      const result = await authMiddleware(request)

      expect(result).toBe('unauthorized-response')
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    })

    it('should validate token for admin routes', async () => {
      const request = {
        nextUrl: { pathname: '/api/admin/content' },
        headers: { get: jest.fn().mockReturnValue('Bearer valid-token') },
      } as unknown as NextRequest

      mockJwt.extractTokenFromHeader.mockReturnValue('valid-token')
      mockJwt.verifyAccessToken.mockResolvedValue({
        userId: 'user123',
        username: 'admin',
        email: 'admin@test.com',
      })

      const result = await authMiddleware(request)

      expect(result).toBe(mockResponseWithHeaders)
      expect(mockJwt.verifyAccessToken).toHaveBeenCalledWith('valid-token')
      expect(mockResponseWithHeaders.headers.set).toHaveBeenCalledWith('x-user-id', 'user123')
      expect(mockResponseWithHeaders.headers.set).toHaveBeenCalledWith('x-username', 'admin')
      expect(mockResponseWithHeaders.headers.set).toHaveBeenCalledWith('x-user-email', 'admin@test.com')
    })

    it('should reject invalid tokens', async () => {
      const request = {
        nextUrl: { pathname: '/api/admin/content' },
        headers: { get: jest.fn().mockReturnValue('Bearer invalid-token') },
      } as unknown as NextRequest

      mockJwt.extractTokenFromHeader.mockReturnValue('invalid-token')
      mockJwt.verifyAccessToken.mockRejectedValue(new Error('Invalid token'))
      mockNextResponse.json.mockReturnValue('unauthorized-response' as any)

      const result = await authMiddleware(request)

      expect(result).toBe('unauthorized-response')
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Invalid token' },
        { status: 401 }
      )
    })

    it('should handle expired tokens', async () => {
      const request = {
        nextUrl: { pathname: '/api/admin/content' },
        headers: { get: jest.fn().mockReturnValue('Bearer expired-token') },
      } as unknown as NextRequest

      mockJwt.extractTokenFromHeader.mockReturnValue('expired-token')
      mockJwt.verifyAccessToken.mockRejectedValue(new Error('Token expired'))
      mockNextResponse.json.mockReturnValue('expired-response' as any)

      const result = await authMiddleware(request)

      expect(result).toBe('expired-response')
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Token expired' },
        { status: 401 }
      )
    })
  })

  describe('requireAuth', () => {
    it('should authenticate valid requests', async () => {
      const request = {
        headers: { get: jest.fn().mockReturnValue('Bearer valid-token') },
      } as unknown as NextRequest

      mockJwt.extractTokenFromHeader.mockReturnValue('valid-token')
      mockJwt.verifyAccessToken.mockResolvedValue({
        userId: 'user123',
        username: 'admin',
        email: 'admin@test.com',
      })

      const result = await requireAuth(request)

      expect(result).toEqual({
        success: true,
        user: {
          userId: 'user123',
          username: 'admin',
          email: 'admin@test.com',
        },
      })
    })

    it('should reject requests without authorization header', async () => {
      const request = {
        headers: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest

      const result = await requireAuth(request)

      expect(result).toEqual({
        success: false,
        error: 'Authorization header is required',
      })
    })

    it('should reject requests with invalid token format', async () => {
      const request = {
        headers: { get: jest.fn().mockReturnValue('InvalidFormat') },
      } as unknown as NextRequest

      mockJwt.extractTokenFromHeader.mockReturnValue(null)

      const result = await requireAuth(request)

      expect(result).toEqual({
        success: false,
        error: 'Invalid authorization header format',
      })
    })

    it('should handle token verification errors', async () => {
      const request = {
        headers: { get: jest.fn().mockReturnValue('Bearer invalid-token') },
      } as unknown as NextRequest

      mockJwt.extractTokenFromHeader.mockReturnValue('invalid-token')
      mockJwt.verifyAccessToken.mockRejectedValue(new Error('Token verification failed'))

      const result = await requireAuth(request)

      expect(result).toEqual({
        success: false,
        error: 'Token verification failed',
      })
    })
  })

  describe('optionalAuth', () => {
    it('should return user for valid token', async () => {
      const request = {
        headers: { get: jest.fn().mockReturnValue('Bearer valid-token') },
      } as unknown as NextRequest

      mockJwt.extractTokenFromHeader.mockReturnValue('valid-token')
      mockJwt.verifyAccessToken.mockResolvedValue({
        userId: 'user123',
        username: 'admin',
        email: 'admin@test.com',
      })

      const result = await optionalAuth(request)

      expect(result).toEqual({
        userId: 'user123',
        username: 'admin',
        email: 'admin@test.com',
      })
    })

    it('should return null for missing token', async () => {
      const request = {
        headers: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest

      const result = await optionalAuth(request)

      expect(result).toBeNull()
    })

    it('should return null for invalid token', async () => {
      const request = {
        headers: { get: jest.fn().mockReturnValue('Bearer invalid-token') },
      } as unknown as NextRequest

      mockJwt.extractTokenFromHeader.mockReturnValue('invalid-token')
      mockJwt.verifyAccessToken.mockRejectedValue(new Error('Invalid token'))

      const result = await optionalAuth(request)

      expect(result).toBeNull()
    })
  })

  describe('Route protection patterns', () => {
    const protectedRoutes = [
      '/api/admin/content',
      '/api/admin/blog',
      '/api/admin/contact',
      '/api/admin/logs',
      '/admin',
      '/admin/blog',
      '/admin/contact',
    ]

    const publicRoutes = [
      '/api/portfolio/content',
      '/api/portfolio/blog',
      '/api/portfolio/contact',
      '/api/auth/login',
      '/api/auth/refresh',
      '/',
      '/blog',
      '/contact',
    ]

    protectedRoutes.forEach(route => {
      it(`should protect ${route}`, async () => {
        const request = {
          nextUrl: { pathname: route },
          headers: { get: jest.fn().mockReturnValue(null) },
        } as unknown as NextRequest

        mockNextResponse.json.mockReturnValue('unauthorized-response' as any)

        const result = await authMiddleware(request)

        expect(result).toBe('unauthorized-response')
      })
    })

    publicRoutes.forEach(route => {
      it(`should allow public access to ${route}`, async () => {
        const request = {
          nextUrl: { pathname: route },
          headers: { get: jest.fn() },
        } as unknown as NextRequest

        mockNextResponse.next.mockReturnValue('next-response' as any)

        const result = await authMiddleware(request)

        expect(result).toBe('next-response')
      })
    })
  })
})

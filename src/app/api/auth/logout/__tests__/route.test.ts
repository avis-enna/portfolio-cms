import { NextRequest } from 'next/server'
import { POST } from '../route'
import * as jwt from '@/lib/auth/jwt'
import { connectToDatabase } from '@/lib/database/connection'

// Mock dependencies
jest.mock('@/lib/auth/jwt')
jest.mock('@/lib/database/connection')

// Mock User model
jest.mock('@/lib/database/models/User', () => ({
  User: {
    findOne: jest.fn(),
  },
}))

// Mock mongoose to avoid BSON issues
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    readyState: 1,
  },
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    methods: {},
    statics: {},
    index: jest.fn(),
    set: jest.fn(),
  })),
  model: jest.fn(),
  models: {},
  Types: {
    ObjectId: jest.fn(),
  },
}))

const mockJwt = jwt as jest.Mocked<typeof jwt>
const mockConnect = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>

// Get the mocked User
const { User: mockUser } = jest.requireMock('@/lib/database/models/User')

describe('/api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnect.mockResolvedValue({} as any)
  })

  describe('POST', () => {
    it('should logout user with valid refresh token', async () => {
      const mockUserDoc = {
        _id: 'user123',
        username: 'admin',
        email: 'admin@test.com',
        refreshTokens: ['valid-refresh-token'],
        removeRefreshToken: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
      }

      mockUser.findOne.mockResolvedValue(mockUserDoc)
      mockJwt.verifyRefreshToken.mockResolvedValue({
        userId: 'user123',
        username: 'admin',
        email: 'admin@test.com',
      })

      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token',
        }),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Logged out successfully',
      })

      expect(mockJwt.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token')
      expect(mockUser.findOne).toHaveBeenCalledWith({
        _id: 'user123',
        refreshTokens: 'valid-refresh-token',
      })
      expect(mockUserDoc.removeRefreshToken).toHaveBeenCalledWith('valid-refresh-token')
      expect(mockUserDoc.save).toHaveBeenCalled()
    })

    it('should logout all sessions when logoutAll is true', async () => {
      const mockUserDoc = {
        _id: 'user123',
        username: 'admin',
        email: 'admin@test.com',
        refreshTokens: ['token1', 'token2', 'valid-refresh-token'],
        clearRefreshTokens: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
      }

      mockUser.findOne.mockResolvedValue(mockUserDoc)
      mockJwt.verifyRefreshToken.mockResolvedValue({
        userId: 'user123',
        username: 'admin',
        email: 'admin@test.com',
      })

      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token',
          logoutAll: true,
        }),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Logged out from all sessions successfully',
      })

      expect(mockUserDoc.clearRefreshTokens).toHaveBeenCalled()
      expect(mockUserDoc.save).toHaveBeenCalled()
    })

    it('should handle invalid refresh token', async () => {
      mockJwt.verifyRefreshToken.mockRejectedValue(new Error('Invalid refresh token'))

      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'invalid-refresh-token',
        }),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Invalid refresh token',
      })
    })

    it('should handle refresh token not found in database', async () => {
      mockJwt.verifyRefreshToken.mockResolvedValue({
        userId: 'user123',
        username: 'admin',
        email: 'admin@test.com',
      })
      mockUser.findOne.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'valid-but-not-stored-token',
        }),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Invalid refresh token',
      })
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Refresh token is required',
      })
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Invalid JSON in request body',
      })
    })

    it('should handle database connection errors', async () => {
      mockConnect.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'some-token',
        }),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
      })
    })

    it('should handle missing content-type header', async () => {
      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'some-token',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Content-Type must be application/json',
      })
    })
  })
})

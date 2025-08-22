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
    findByUsernameOrEmail: jest.fn(),
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

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnect.mockResolvedValue({} as any)
  })

  describe('POST', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUserDoc = {
        _id: 'user123',
        username: 'admin',
        email: 'admin@test.com',
        comparePassword: jest.fn().mockResolvedValue(true),
        addRefreshToken: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        toJSON: jest.fn().mockReturnValue({
          _id: 'user123',
          username: 'admin',
          email: 'admin@test.com',
        }),
      }

      mockUser.findByUsernameOrEmail.mockResolvedValue(mockUserDoc as any)
      mockJwt.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          password: 'password123',
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
        user: {
          _id: 'user123',
          username: 'admin',
          email: 'admin@test.com',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })

      expect(mockUser.findByUsernameOrEmail).toHaveBeenCalledWith('admin')
      expect(mockUserDoc.comparePassword).toHaveBeenCalledWith('password123')
      expect(mockJwt.generateTokens).toHaveBeenCalledWith({
        userId: 'user123',
        username: 'admin',
        email: 'admin@test.com',
      })
      expect(mockUserDoc.addRefreshToken).toHaveBeenCalledWith('refresh-token')
    })

    it('should reject invalid credentials', async () => {
      const mockUserDoc = {
        comparePassword: jest.fn().mockResolvedValue(false),
      }

      mockUser.findByUsernameOrEmail.mockResolvedValue(mockUserDoc as any)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          password: 'wrongpassword',
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
        error: 'Invalid credentials',
      })
    })

    it('should reject non-existent user', async () => {
      mockUser.findByUsernameOrEmail.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'nonexistent',
          password: 'password123',
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
        error: 'Invalid credentials',
      })
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          // missing password
        }),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Username and password are required',
      })
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
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

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          password: 'password123',
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

    it('should handle token generation errors', async () => {
      const mockUserDoc = {
        _id: 'user123',
        username: 'admin',
        email: 'admin@test.com',
        comparePassword: jest.fn().mockResolvedValue(true),
      }

      mockUser.findByUsernameOrEmail.mockResolvedValue(mockUserDoc as any)
      mockJwt.generateTokens.mockRejectedValue(new Error('Token generation failed'))

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          password: 'password123',
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

    it('should handle password comparison errors', async () => {
      const mockUserDoc = {
        comparePassword: jest.fn().mockRejectedValue(new Error('Password comparison failed')),
      }

      mockUser.findByUsernameOrEmail.mockResolvedValue(mockUserDoc as any)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          password: 'password123',
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
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          password: 'password123',
        }),
        // missing content-type header
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

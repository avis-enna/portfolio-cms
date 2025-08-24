import jwt from 'jsonwebtoken'
import { generateTokens, verifyAccessToken, verifyRefreshToken, decodeToken } from '../jwt'

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
}))

const mockJwt = jwt as jest.Mocked<typeof jwt>

describe('JWT Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set up environment variables
    process.env.JWT_SECRET = 'test-jwt-secret'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
  })

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET
    delete process.env.JWT_REFRESH_SECRET
  })

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const mockAccessToken = 'mock-access-token'
      const mockRefreshToken = 'mock-refresh-token'
      
      mockJwt.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken)

      const payload = { userId: '507f1f77bcf86cd799439011', username: 'testuser' }
      const result = await generateTokens(payload)

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      })

      // Verify access token generation
      expect(mockJwt.sign).toHaveBeenCalledWith(
        payload,
        'test-jwt-secret',
        { expiresIn: '15m' }
      )

      // Verify refresh token generation
      expect(mockJwt.sign).toHaveBeenCalledWith(
        payload,
        'test-refresh-secret',
        { expiresIn: '7d' }
      )
    })

    it('should throw error when JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET

      const payload = { userId: 'user123', username: 'testuser' }

      await expect(generateTokens(payload)).rejects.toThrow(
        'JWT_SECRET environment variable is required'
      )
    })

    it('should throw error when JWT_REFRESH_SECRET is missing', async () => {
      delete process.env.JWT_REFRESH_SECRET

      const payload = { userId: 'user123', username: 'testuser' }

      await expect(generateTokens(payload)).rejects.toThrow(
        'JWT_REFRESH_SECRET environment variable is required'
      )
    })

    it('should handle JWT signing errors', async () => {
      mockJwt.sign.mockImplementation(() => {
        throw new Error('JWT signing failed')
      })

      const payload = { userId: 'user123', username: 'testuser' }

      await expect(generateTokens(payload)).rejects.toThrow('Invalid userId format')
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const mockPayload = { userId: 'user123', username: 'testuser' }
      mockJwt.verify.mockReturnValueOnce(mockPayload)

      const token = 'valid-access-token'
      const result = await verifyAccessToken(token)

      expect(result).toEqual(mockPayload)
      expect(mockJwt.verify).toHaveBeenCalledWith(token, 'test-jwt-secret')
    })

    it('should throw error for invalid access token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const token = 'invalid-access-token'

      await expect(verifyAccessToken(token)).rejects.toThrow('Invalid token')
    })

    it('should throw error when JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET

      const token = 'some-token'

      await expect(verifyAccessToken(token)).rejects.toThrow(
        'JWT_SECRET environment variable is required'
      )
    })

    it('should handle expired tokens', async () => {
      const expiredError = new Error('Token expired')
      expiredError.name = 'TokenExpiredError'
      mockJwt.verify.mockImplementation(() => {
        throw expiredError
      })

      const token = 'expired-token'

      await expect(verifyAccessToken(token)).rejects.toThrow('Token expired')
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const mockPayload = { userId: 'user123', username: 'testuser' }
      mockJwt.verify.mockReturnValueOnce(mockPayload)

      const token = 'valid-refresh-token'
      const result = await verifyRefreshToken(token)

      expect(result).toEqual(mockPayload)
      expect(mockJwt.verify).toHaveBeenCalledWith(token, 'test-refresh-secret')
    })

    it('should throw error for invalid refresh token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid refresh token')
      })

      const token = 'invalid-refresh-token'

      await expect(verifyRefreshToken(token)).rejects.toThrow('Invalid refresh token')
    })

    it('should throw error when JWT_REFRESH_SECRET is missing', async () => {
      delete process.env.JWT_REFRESH_SECRET

      const token = 'some-token'

      await expect(verifyRefreshToken(token)).rejects.toThrow(
        'JWT_REFRESH_SECRET environment variable is required'
      )
    })
  })

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const mockPayload = { userId: 'user123', username: 'testuser' }
      mockJwt.decode.mockReturnValueOnce(mockPayload)

      const token = 'some-token'
      const result = decodeToken(token)

      expect(result).toEqual(mockPayload)
      expect(mockJwt.decode).toHaveBeenCalledWith(token)
    })

    it('should return null for invalid token format', () => {
      mockJwt.decode.mockReturnValueOnce(null)

      const token = 'invalid-token-format'
      const result = decodeToken(token)

      expect(result).toBeNull()
    })

    it('should handle decode errors gracefully', () => {
      mockJwt.decode.mockImplementation(() => {
        throw new Error('Decode failed')
      })

      const token = 'problematic-token'

      expect(() => decodeToken(token)).toThrow('Decode failed')
    })
  })

  describe('Token payload validation', () => {
    it('should validate required payload fields', async () => {
      const invalidPayload = { username: 'testuser' } // missing userId

      await expect(generateTokens(invalidPayload as any)).rejects.toThrow(
        'userId is required in token payload'
      )
    })

    it('should validate payload types', async () => {
      const invalidPayload = { userId: 123, username: 'testuser' } // userId should be string

      await expect(generateTokens(invalidPayload as any)).rejects.toThrow(
        'userId must be a string'
      )
    })
  })
})

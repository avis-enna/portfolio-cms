import jwt from 'jsonwebtoken'

export interface TokenPayload {
  userId: string
  username: string
  email?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

/**
 * Generate access and refresh tokens for a user
 */
export async function generateTokens(payload: TokenPayload): Promise<TokenPair> {
  // Validate environment variables
  const jwtSecret = process.env.JWT_SECRET
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required')
  }

  // Validate payload
  validateTokenPayload(payload)

  try {
    // Generate access token (15 minutes)
    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: '15m',
    })

    // Generate refresh token (7 days)
    const refreshToken = jwt.sign(payload, jwtRefreshSecret, {
      expiresIn: '7d',
    })

    return {
      accessToken,
      refreshToken,
    }
  } catch (error) {
    throw new Error(`JWT signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload
    return decoded
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired')
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token')
      }
      throw error
    }
    throw new Error('Token verification failed')
  }
}

/**
 * Verify and decode a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET

  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required')
  }

  try {
    const decoded = jwt.verify(token, jwtRefreshSecret) as TokenPayload
    return decoded
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired')
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token')
      }
      throw error
    }
    throw new Error('Refresh token verification failed')
  }
}

/**
 * Decode a token without verification (useful for extracting payload)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload | null
    return decoded
  } catch (error) {
    throw new Error(`Token decode failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate token payload structure
 */
function validateTokenPayload(payload: any): asserts payload is TokenPayload {
  if (!payload.userId) {
    throw new Error('userId is required in token payload')
  }

  if (typeof payload.userId !== 'string') {
    throw new Error('userId must be a string')
  }

  if (!payload.username) {
    throw new Error('username is required in token payload')
  }

  if (typeof payload.username !== 'string') {
    throw new Error('username must be a string')
  }

  if (payload.email && typeof payload.email !== 'string') {
    throw new Error('email must be a string')
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Check if a token is expired without verifying signature
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) {
      return true
    }

    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    return true
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) {
      return null
    }

    return new Date(decoded.exp * 1000)
  } catch (error) {
    return null
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  try {
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken)
    
    // Generate new access token with same payload
    const { accessToken } = await generateTokens({
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
    })
    
    return accessToken
  } catch (error) {
    throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

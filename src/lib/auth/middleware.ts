import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyAccessToken, TokenPayload } from './jwt'

export interface AuthResult {
  success: boolean
  user?: TokenPayload
  error?: string
}

/**
 * Protected route patterns
 */
const PROTECTED_ROUTES = [
  '/api/admin',
  '/admin',
]

/**
 * Public route patterns that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/portfolio',
  '/api/health',
  '/',
  '/blog',
  '/contact',
  '/about',
]

/**
 * Check if a route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is explicitly public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Main authentication middleware for Next.js
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (isPublicRoute(pathname) && !isProtectedRoute(pathname)) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  if (isProtectedRoute(pathname)) {
    const authResult = await requireAuth(request)
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      )
    }

    // Add user info to request headers for downstream handlers
    const response = NextResponse.next()
    response.headers.set('x-user-id', authResult.user!.userId)
    response.headers.set('x-username', authResult.user!.username)
    if (authResult.user!.email) {
      response.headers.set('x-user-email', authResult.user!.email)
    }
    
    return response
  }

  // Default: allow the request
  return NextResponse.next()
}

/**
 * Require authentication for a request
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return {
        success: false,
        error: 'Authorization header is required',
      }
    }

    const token = extractTokenFromHeader(authHeader)
    
    if (!token) {
      return {
        success: false,
        error: 'Invalid authorization header format',
      }
    }

    const user = await verifyAccessToken(token)
    
    return {
      success: true,
      user,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    }
  }
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 */
export async function optionalAuth(request: NextRequest): Promise<TokenPayload | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return null
    }

    const token = extractTokenFromHeader(authHeader)
    
    if (!token) {
      return null
    }

    const user = await verifyAccessToken(token)
    return user
  } catch (error) {
    // Silently fail for optional auth
    return null
  }
}

/**
 * Extract user information from request headers (set by middleware)
 */
export function getUserFromHeaders(request: NextRequest): TokenPayload | null {
  const userId = request.headers.get('x-user-id')
  const username = request.headers.get('x-username')
  const email = request.headers.get('x-user-email')

  if (!userId || !username) {
    return null
  }

  return {
    userId,
    username,
    email: email || undefined,
  }
}

/**
 * Create an authenticated response with user context
 */
export function createAuthenticatedResponse(
  data: any,
  user: TokenPayload,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // Add user context to response headers
  response.headers.set('x-user-id', user.userId)
  response.headers.set('x-username', user.username)
  if (user.email) {
    response.headers.set('x-user-email', user.email)
  }
  
  return response
}

/**
 * Middleware configuration for Next.js
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

/**
 * Role-based access control
 */
export interface UserRole {
  name: string
  permissions: string[]
}

export const ROLES = {
  ADMIN: {
    name: 'admin',
    permissions: [
      'read:all',
      'write:all',
      'delete:all',
      'manage:users',
      'manage:content',
      'manage:blog',
      'manage:contact',
      'view:logs',
    ],
  },
  EDITOR: {
    name: 'editor',
    permissions: [
      'read:content',
      'write:content',
      'read:blog',
      'write:blog',
      'read:contact',
    ],
  },
  VIEWER: {
    name: 'viewer',
    permissions: [
      'read:content',
      'read:blog',
      'read:contact',
    ],
  },
} as const

/**
 * Check if user has required permission
 */
export function hasPermission(userRole: string, requiredPermission: string): boolean {
  const role = Object.values(ROLES).find(r => r.name === userRole)
  if (!role) {
    return false
  }
  
  return role.permissions.includes(requiredPermission) || role.permissions.includes('read:all')
}

/**
 * Require specific permission for a request
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<AuthResult> {
  const authResult = await requireAuth(request)
  
  if (!authResult.success) {
    return authResult
  }

  // For now, assume all authenticated users are admins
  // In a real app, you'd get the user's role from the database
  const userRole = 'admin'
  
  if (!hasPermission(userRole, permission)) {
    return {
      success: false,
      error: 'Insufficient permissions',
    }
  }

  return authResult
}

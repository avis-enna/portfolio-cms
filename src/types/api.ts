/**
 * API-specific type definitions
 */

import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// API HANDLER TYPES
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiHandler {
  (req: NextRequest): Promise<NextResponse>
}

export interface ApiRouteHandlers {
  GET?: ApiHandler
  POST?: ApiHandler
  PUT?: ApiHandler
  PATCH?: ApiHandler
  DELETE?: ApiHandler
}

export interface ApiContext {
  params?: Record<string, string>
  searchParams?: Record<string, string>
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface ApiRequest<T = unknown> extends NextRequest {
  body: T
  user?: {
    id: string
    email: string
    role: string
  }
  params?: Record<string, string>
  query?: Record<string, string>
}

export interface ApiResponseData<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
  timestamp?: string
  requestId?: string
  metadata?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
    version?: string
  }
}

export interface PaginatedResponse<T = unknown> extends ApiResponseData<T[]> {
  metadata: {
    total: number
    page: number
    limit: number
    hasMore: boolean
    totalPages: number
  }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  code: string
  message: string
  statusCode: number
  details?: Record<string, unknown>
  stack?: string
}

export interface ValidationErrorDetail {
  field: string
  message: string
  value?: unknown
  constraint?: string
}

export interface ApiValidationError extends ApiError {
  code: 'VALIDATION_ERROR'
  details: {
    errors: ValidationErrorDetail[]
  }
}

// ============================================================================
// MIDDLEWARE TYPES
// ============================================================================

export interface MiddlewareContext {
  req: NextRequest
  res: NextResponse
  user?: {
    id: string
    email: string
    role: string
  }
  params?: Record<string, string>
}

export type MiddlewareFunction = (
  context: MiddlewareContext
) => Promise<NextResponse | void>

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
}

export interface AuthMiddlewareOptions {
  required?: boolean
  roles?: string[]
  permissions?: string[]
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'date'
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
    enum?: unknown[]
    custom?: (value: unknown) => boolean | string
    items?: ValidationSchema
    properties?: ValidationSchema
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationErrorDetail[]
  data?: Record<string, unknown>
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

export interface FileUploadConfig {
  maxSize: number
  allowedTypes: string[]
  destination: string
  generateFilename?: (originalName: string) => string
}

export interface UploadedFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer?: Buffer
}

export interface FileUploadResult {
  success: boolean
  file?: {
    filename: string
    originalName: string
    size: number
    mimetype: string
    url: string
  }
  error?: string
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookPayload {
  event: string
  data: Record<string, unknown>
  timestamp: string
  signature?: string
}

export interface WebhookHandler {
  (payload: WebhookPayload): Promise<void>
}

export interface WebhookConfig {
  secret: string
  tolerance?: number
  handlers: Record<string, WebhookHandler>
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheConfig {
  ttl: number
  maxSize?: number
  strategy?: 'lru' | 'fifo' | 'lfu'
}

export interface CacheEntry<T = unknown> {
  key: string
  value: T
  expiresAt: number
  createdAt: number
  accessCount: number
  lastAccessed: number
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

// ============================================================================
// LOGGING TYPES
// ============================================================================

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  requestId?: string
  userId?: string
  metadata?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

export interface Logger {
  error: (message: string, metadata?: Record<string, unknown>) => void
  warn: (message: string, metadata?: Record<string, unknown>) => void
  info: (message: string, metadata?: Record<string, unknown>) => void
  debug: (message: string, metadata?: Record<string, unknown>) => void
  trace: (message: string, metadata?: Record<string, unknown>) => void
}

// ============================================================================
// MONITORING TYPES
// ============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn'
    message?: string
    duration?: number
  }>
  timestamp: string
  uptime: number
  version: string
}

export interface MetricsData {
  requests: {
    total: number
    success: number
    error: number
    averageResponseTime: number
  }
  system: {
    memory: {
      used: number
      total: number
      percentage: number
    }
    cpu: {
      usage: number
    }
    uptime: number
  }
  database: {
    connections: number
    queries: number
    averageQueryTime: number
  }
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchQuery {
  q?: string
  filters?: Record<string, unknown>
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
  page?: number
  limit?: number
  facets?: string[]
}

export interface SearchResult<T = unknown> {
  items: T[]
  total: number
  page: number
  limit: number
  facets?: Record<string, Array<{
    value: string
    count: number
  }>>
  suggestions?: string[]
  took: number
}

export interface SearchIndex {
  name: string
  fields: string[]
  weights?: Record<string, number>
  filters?: Record<string, unknown>
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  NextRequest,
  NextResponse,
} from 'next/server'

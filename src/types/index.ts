/**
 * Comprehensive Type Definitions for Portfolio CMS
 */

import { Document, Types } from 'mongoose'

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ObjectId = Types.ObjectId | string

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  metadata?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface SearchParams extends PaginationParams {
  search?: string
  category?: string
  tag?: string
  status?: string
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User extends Document {
  _id: ObjectId
  email: string
  password: string
  role: 'admin' | 'user'
  profile: {
    name: string
    avatar?: string
    bio?: string
  }
  settings: {
    theme: 'light' | 'dark' | 'system'
    notifications: boolean
    language: string
  }
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserCreateInput {
  email: string
  password: string
  role?: 'admin' | 'user'
  profile: {
    name: string
    avatar?: string
    bio?: string
  }
}

export interface UserUpdateInput {
  email?: string
  profile?: {
    name?: string
    avatar?: string
    bio?: string
  }
  settings?: {
    theme?: 'light' | 'dark' | 'system'
    notifications?: boolean
    language?: string
  }
  isActive?: boolean
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface JWTPayload {
  userId: string
  email: string
  role: 'admin' | 'user'
  iat: number
  exp: number
}

export interface RefreshToken extends Document {
  _id: ObjectId
  token: string
  userId: ObjectId
  expiresAt: Date
  isActive: boolean
  createdAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  name: string
  acceptTerms: boolean
}

// ============================================================================
// PORTFOLIO TYPES
// ============================================================================

export interface PersonalInfo {
  name: string
  title: string
  tagline?: string
  email: string
  phone?: string
  location?: string
  bio: string
  profileImage?: string
  resumeUrl?: string
}

export interface SocialLinks {
  linkedin?: string
  github?: string
  twitter?: string
  instagram?: string
  facebook?: string
  youtube?: string
  website?: string
  custom?: Array<{
    name: string
    url: string
    icon?: string
  }>
}

export interface Skill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  category: string
  yearsOfExperience?: number
  certifications?: string[]
}

export interface Experience {
  id: string
  company: string
  position: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  technologies?: string[]
  achievements?: string[]
  type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  gpa?: string
  description?: string
  achievements?: string[]
}

export interface Project {
  id: string
  title: string
  description: string
  longDescription?: string
  technologies: string[]
  category: string
  status: 'completed' | 'in-progress' | 'planned' | 'archived'
  startDate?: string
  endDate?: string
  images?: string[]
  demoUrl?: string
  githubUrl?: string
  featured: boolean
  tags?: string[]
  challenges?: string[]
  learnings?: string[]
  teamSize?: number
  role?: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
  credentialId?: string
  credentialUrl?: string
  description?: string
  skills?: string[]
}

export interface PortfolioFeatures {
  showBlog: boolean
  showProjects: boolean
  showExperience: boolean
  showEducation: boolean
  showSkills: boolean
  showCertifications: boolean
  showContact: boolean
  showResume: boolean
  enableDarkMode: boolean
  enableAnimations: boolean
  enableAnalytics: boolean
  enablePWA: boolean
}

export interface PortfolioTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  fontSize: 'small' | 'medium' | 'large'
  borderRadius: 'none' | 'small' | 'medium' | 'large'
  layout: 'minimal' | 'modern' | 'classic' | 'creative'
  colorMode: 'light' | 'dark' | 'system'
}

export interface PortfolioContent extends Document {
  _id: ObjectId
  userId: ObjectId
  personal: PersonalInfo
  social: SocialLinks
  skills: Skill[]
  experience: Experience[]
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  features: PortfolioFeatures
  theme: PortfolioTheme
  seo: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
  }
  analytics: {
    googleAnalyticsId?: string
    enableTracking: boolean
  }
  isPublished: boolean
  slug?: string
  customDomain?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// BLOG TYPES
// ============================================================================

export interface BlogPost extends Document {
  _id: ObjectId
  title: string
  slug: string
  content: string
  excerpt?: string
  featuredImage?: string
  author: ObjectId
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date
  viewCount: number
  readingTime: number
  seo: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
  }
  comments: Array<{
    id: string
    author: string
    email: string
    content: string
    status: 'pending' | 'approved' | 'rejected'
    createdAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

export interface BlogPostCreateInput {
  title: string
  content: string
  excerpt?: string
  featuredImage?: string
  category: string
  tags: string[]
  status?: 'draft' | 'published'
  publishedAt?: Date
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
  }
}

export interface BlogPostUpdateInput extends Partial<BlogPostCreateInput> {
  slug?: string
}

// ============================================================================
// CONTACT TYPES
// ============================================================================

export interface ContactSubmission extends Document {
  _id: ObjectId
  name: string
  email: string
  subject?: string
  message: string
  phone?: string
  company?: string
  projectType?: string
  budget?: string
  timeline?: string
  status: 'new' | 'read' | 'replied' | 'archived'
  priority: 'low' | 'medium' | 'high'
  tags?: string[]
  notes?: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  createdAt: Date
  updatedAt: Date
}

export interface ContactFormData {
  name: string
  email: string
  subject?: string
  message: string
  phone?: string
  company?: string
  projectType?: string
  budget?: string
  timeline?: string
}

// ============================================================================
// AI TYPES
// ============================================================================

export interface AIGenerationRequest {
  type: 'bio' | 'project-description' | 'experience-description' | 'blog-post' | 'seo-content'
  prompt: string
  context?: Record<string, unknown>
  tone?: 'professional' | 'casual' | 'creative' | 'technical'
  length?: 'short' | 'medium' | 'long'
  language?: string
}

export interface AIGenerationResponse {
  success: boolean
  content?: string
  suggestions?: string[]
  error?: string
  metadata?: {
    originalLength: number
    tokens: number
    confidence: number
    model: string
  }
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsEvent {
  event: string
  properties: Record<string, unknown>
  userId?: string
  sessionId?: string
  timestamp: Date
}

export interface AnalyticsData {
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
  averageSessionDuration: number
  topPages: Array<{
    path: string
    views: number
    uniqueViews: number
  }>
  topReferrers: Array<{
    source: string
    visits: number
  }>
  deviceTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
  countries: Array<{
    country: string
    count: number
    percentage: number
  }>
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date'
  placeholder?: string
  required?: boolean
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    custom?: (value: unknown) => boolean | string
  }
  options?: Array<{
    value: string
    label: string
  }>
  defaultValue?: unknown
  disabled?: boolean
  hidden?: boolean
}

export interface FormErrors {
  [key: string]: string | undefined
}

export interface FormState<T = Record<string, unknown>> {
  values: T
  errors: FormErrors
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
}

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface ComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  'data-testid'?: string
}

export interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface ModalProps extends ComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseApiOptions<T = unknown> {
  initialData?: T
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface UseApiResult<T = unknown> {
  data: T | undefined
  error: Error | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  refetch: () => Promise<void>
  mutate: (data: T) => void
}

export interface UsePaginationOptions {
  initialPage?: number
  pageSize?: number
  total?: number
}

export interface UsePaginationResult {
  currentPage: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  setPageSize: (size: number) => void
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface AppConfig {
  name: string
  version: string
  description: string
  url: string
  api: {
    baseUrl: string
    timeout: number
  }
  features: {
    ai: boolean
    analytics: boolean
    pwa: boolean
    blog: boolean
    contact: boolean
    linkedin: boolean
  }
  limits: {
    fileUpload: {
      maxSize: number
      allowedTypes: string[]
    }
    rateLimit: {
      windowMs: number
      maxRequests: number
    }
  }
  seo: {
    defaultTitle: string
    defaultDescription: string
    defaultKeywords: string[]
    defaultOgImage: string
  }
}

export interface DatabaseConfig {
  uri: string
  options: {
    useNewUrlParser: boolean
    useUnifiedTopology: boolean
    maxPoolSize: number
    minPoolSize: number
    maxIdleTimeMS: number
    serverSelectionTimeoutMS: number
  }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AppError extends Error {
  code: string
  statusCode: number
  isOperational: boolean
  context?: Record<string, unknown>
}

export interface ValidationError extends AppError {
  field: string
  value: unknown
  constraint: string
}

export interface DatabaseError extends AppError {
  operation: string
  collection?: string
  query?: Record<string, unknown>
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export * from './api'
export * from './auth'
export * from './portfolio'
export * from './blog'
export * from './contact'
export * from './ai'
export * from './analytics'

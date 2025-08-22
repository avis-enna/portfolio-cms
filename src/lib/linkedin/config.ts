/**
 * LinkedIn API Configuration
 * Handles OAuth 2.0 configuration and API endpoints for LinkedIn integration
 */

export interface LinkedInConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
  apiBaseUrl: string
  authBaseUrl: string
}

export interface LinkedInTokens {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  expiresAt: number
  tokenType: string
  scope: string
}

export interface LinkedInProfile {
  id: string
  firstName: {
    localized: Record<string, string>
    preferredLocale: {
      country: string
      language: string
    }
  }
  lastName: {
    localized: Record<string, string>
    preferredLocale: {
      country: string
      language: string
    }
  }
  profilePicture?: {
    displayImage: string
  }
  emailAddress?: string
}

export interface LinkedInShareContent {
  author: string
  lifecycleState: 'PUBLISHED' | 'DRAFT'
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string
      }
      shareMediaCategory: 'NONE' | 'ARTICLE' | 'IMAGE'
      media?: Array<{
        status: 'READY'
        description: {
          text: string
        }
        media?: string
        originalUrl?: string
        title?: {
          text: string
        }
      }>
    }
  }
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' | 'CONNECTIONS'
  }
}

export interface LinkedInShareResponse {
  id: string
  activity: string
  created: {
    time: number
  }
  lastModified: {
    time: number
  }
}

// LinkedIn API Configuration
export const linkedInConfig: LinkedInConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID || '',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  redirectUri: process.env.LINKEDIN_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`,
  scope: [
    'r_liteprofile',
    'r_emailaddress',
    'w_member_social'
  ],
  apiBaseUrl: 'https://api.linkedin.com/v2',
  authBaseUrl: 'https://www.linkedin.com/oauth/v2'
}

// LinkedIn API Endpoints
export const linkedInEndpoints = {
  // OAuth endpoints
  authorize: `${linkedInConfig.authBaseUrl}/authorization`,
  token: `${linkedInConfig.authBaseUrl}/accessToken`,
  
  // Profile endpoints
  profile: `${linkedInConfig.apiBaseUrl}/people/~`,
  profileWithEmail: `${linkedInConfig.apiBaseUrl}/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`,
  emailAddress: `${linkedInConfig.apiBaseUrl}/emailAddress?q=members&projection=(elements*(handle~))`,
  
  // Sharing endpoints
  shares: `${linkedInConfig.apiBaseUrl}/ugcPosts`,
  
  // Media upload endpoints (for future use)
  mediaUpload: `${linkedInConfig.apiBaseUrl}/assets?action=registerUpload`
}

// OAuth URL generation
export const generateLinkedInAuthUrl = (state?: string): string => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: linkedInConfig.clientId,
    redirect_uri: linkedInConfig.redirectUri,
    scope: linkedInConfig.scope.join(' '),
    ...(state && { state })
  })

  return `${linkedInEndpoints.authorize}?${params.toString()}`
}

// Validate LinkedIn configuration
export const validateLinkedInConfig = (): boolean => {
  const requiredFields = [
    'clientId',
    'clientSecret',
    'redirectUri'
  ] as const

  return requiredFields.every(field => {
    const value = linkedInConfig[field]
    return value && value.length > 0
  })
}

// Error types for LinkedIn API
export class LinkedInAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'LinkedInAPIError'
  }
}

export class LinkedInAuthError extends Error {
  constructor(
    message: string,
    public errorCode?: string,
    public errorDescription?: string
  ) {
    super(message)
    this.name = 'LinkedInAuthError'
  }
}

// Rate limiting configuration
export const linkedInRateLimit = {
  // LinkedIn API rate limits (per application)
  maxRequestsPerDay: 500000,
  maxRequestsPerHour: 100000,
  
  // Sharing specific limits
  maxSharesPerDay: 100,
  maxSharesPerHour: 25,
  
  // Burst limits
  burstLimit: 100,
  burstWindow: 60 // seconds
}

// Content validation rules
export const linkedInContentRules = {
  maxTextLength: 3000,
  maxTitleLength: 200,
  maxDescriptionLength: 256,
  supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif'],
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxImagesPerPost: 9
}

// Default sharing templates
export const defaultShareTemplates = {
  portfolioUpdate: {
    text: "🚀 Just updated my portfolio! Check out my latest work and projects.",
    includeUrl: true,
    visibility: 'PUBLIC' as const
  },
  newProject: {
    text: "🎯 Excited to share my latest project! Built with modern technologies and best practices.",
    includeUrl: true,
    visibility: 'PUBLIC' as const
  },
  blogPost: {
    text: "📝 New blog post is live! Sharing insights and learnings from my development journey.",
    includeUrl: true,
    visibility: 'PUBLIC' as const
  },
  achievement: {
    text: "🏆 Proud to share this milestone in my professional journey!",
    includeUrl: true,
    visibility: 'PUBLIC' as const
  }
}

// LinkedIn API response types
export interface LinkedInErrorResponse {
  error: string
  error_description: string
  error_code?: number
}

export interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope: string
  token_type: string
}

// Utility functions
export const isLinkedInConfigured = (): boolean => {
  return validateLinkedInConfig()
}

export const getLinkedInScopes = (): string[] => {
  return [...linkedInConfig.scope]
}

export const formatLinkedInError = (error: any): string => {
  if (error.error_description) {
    return error.error_description
  }
  if (error.message) {
    return error.message
  }
  return 'An unknown LinkedIn API error occurred'
}

// Export configuration for testing
export const getLinkedInConfigForTesting = () => ({
  ...linkedInConfig,
  endpoints: linkedInEndpoints,
  rateLimit: linkedInRateLimit,
  contentRules: linkedInContentRules
})

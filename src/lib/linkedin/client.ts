/**
 * LinkedIn API Client
 * Handles all LinkedIn API interactions including OAuth, profile, and sharing
 */

import {
  linkedInConfig,
  linkedInEndpoints,
  LinkedInTokens,
  LinkedInProfile,
  LinkedInShareContent,
  LinkedInShareResponse,
  LinkedInAPIError,
  LinkedInAuthError,
  LinkedInTokenResponse,
  linkedInContentRules
} from './config'

export class LinkedInClient {
  private accessToken: string | null = null
  private tokenExpiresAt: number | null = null

  constructor(accessToken?: string, expiresAt?: number) {
    this.accessToken = accessToken || null
    this.tokenExpiresAt = expiresAt || null
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state?: string): Promise<LinkedInTokens> {
    try {
      const response = await fetch(linkedInEndpoints.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: linkedInConfig.redirectUri,
          client_id: linkedInConfig.clientId,
          client_secret: linkedInConfig.clientSecret
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new LinkedInAuthError(
          errorData.error_description || 'Failed to exchange code for token',
          errorData.error,
          errorData.error_description
        )
      }

      const tokenData: LinkedInTokenResponse = await response.json()
      
      const tokens: LinkedInTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        tokenType: tokenData.token_type,
        scope: tokenData.scope
      }

      // Set the access token for this client instance
      this.accessToken = tokens.accessToken
      this.tokenExpiresAt = tokens.expiresAt

      return tokens
    } catch (error) {
      if (error instanceof LinkedInAuthError) {
        throw error
      }
      throw new LinkedInAuthError('Failed to exchange authorization code', 'exchange_failed')
    }
  }

  /**
   * Get user profile information
   */
  async getProfile(): Promise<LinkedInProfile> {
    this.validateToken()

    try {
      const response = await this.makeAuthenticatedRequest(linkedInEndpoints.profileWithEmail)
      
      if (!response.ok) {
        throw new LinkedInAPIError(
          'Failed to fetch profile',
          response.status,
          'profile_fetch_failed'
        )
      }

      const profileData = await response.json()
      return this.formatProfileData(profileData)
    } catch (error) {
      if (error instanceof LinkedInAPIError) {
        throw error
      }
      throw new LinkedInAPIError('Failed to get LinkedIn profile', 500, 'profile_error')
    }
  }

  /**
   * Get user email address
   */
  async getEmailAddress(): Promise<string | null> {
    this.validateToken()

    try {
      const response = await this.makeAuthenticatedRequest(linkedInEndpoints.emailAddress)
      
      if (!response.ok) {
        throw new LinkedInAPIError(
          'Failed to fetch email',
          response.status,
          'email_fetch_failed'
        )
      }

      const emailData = await response.json()
      const emailElement = emailData.elements?.[0]
      return emailElement?.['handle~']?.emailAddress || null
    } catch (error) {
      if (error instanceof LinkedInAPIError) {
        throw error
      }
      throw new LinkedInAPIError('Failed to get email address', 500, 'email_error')
    }
  }

  /**
   * Share content to LinkedIn
   */
  async shareContent(content: {
    text: string
    url?: string
    title?: string
    description?: string
    imageUrl?: string
    visibility?: 'PUBLIC' | 'CONNECTIONS'
  }): Promise<LinkedInShareResponse> {
    this.validateToken()
    this.validateShareContent(content)

    try {
      // Get user profile to get the author URN
      const profile = await this.getProfile()
      const authorUrn = `urn:li:person:${profile.id}`

      const shareData: LinkedInShareContent = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content.text
            },
            shareMediaCategory: content.url ? 'ARTICLE' : 'NONE',
            ...(content.url && {
              media: [{
                status: 'READY',
                description: {
                  text: content.description || content.text
                },
                originalUrl: content.url,
                ...(content.title && {
                  title: {
                    text: content.title
                  }
                })
              }]
            })
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': content.visibility || 'PUBLIC'
        }
      }

      const response = await this.makeAuthenticatedRequest(linkedInEndpoints.shares, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shareData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new LinkedInAPIError(
          errorData.message || 'Failed to share content',
          response.status,
          'share_failed',
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof LinkedInAPIError) {
        throw error
      }
      throw new LinkedInAPIError('Failed to share content to LinkedIn', 500, 'share_error')
    }
  }

  /**
   * Check if token is valid and not expired
   */
  isTokenValid(): boolean {
    return !!(
      this.accessToken &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt > Date.now()
    )
  }

  /**
   * Set access token for the client
   */
  setAccessToken(token: string, expiresAt: number): void {
    this.accessToken = token
    this.tokenExpiresAt = expiresAt
  }

  /**
   * Clear access token
   */
  clearToken(): void {
    this.accessToken = null
    this.tokenExpiresAt = null
  }

  /**
   * Make authenticated request to LinkedIn API
   */
  private async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    this.validateToken()

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/json',
      ...options.headers
    }

    return fetch(url, {
      ...options,
      headers
    })
  }

  /**
   * Validate that we have a valid access token
   */
  private validateToken(): void {
    if (!this.accessToken) {
      throw new LinkedInAPIError('No access token available', 401, 'no_token')
    }

    if (this.tokenExpiresAt && this.tokenExpiresAt <= Date.now()) {
      throw new LinkedInAPIError('Access token has expired', 401, 'token_expired')
    }
  }

  /**
   * Validate share content before posting
   */
  private validateShareContent(content: {
    text: string
    url?: string
    title?: string
    description?: string
  }): void {
    if (!content.text || content.text.trim().length === 0) {
      throw new LinkedInAPIError('Share text is required', 400, 'invalid_content')
    }

    if (content.text.length > linkedInContentRules.maxTextLength) {
      throw new LinkedInAPIError(
        `Share text exceeds maximum length of ${linkedInContentRules.maxTextLength} characters`,
        400,
        'text_too_long'
      )
    }

    if (content.title && content.title.length > linkedInContentRules.maxTitleLength) {
      throw new LinkedInAPIError(
        `Title exceeds maximum length of ${linkedInContentRules.maxTitleLength} characters`,
        400,
        'title_too_long'
      )
    }

    if (content.description && content.description.length > linkedInContentRules.maxDescriptionLength) {
      throw new LinkedInAPIError(
        `Description exceeds maximum length of ${linkedInContentRules.maxDescriptionLength} characters`,
        400,
        'description_too_long'
      )
    }

    if (content.url && !this.isValidUrl(content.url)) {
      throw new LinkedInAPIError('Invalid URL format', 400, 'invalid_url')
    }
  }

  /**
   * Format profile data from LinkedIn API response
   */
  private formatProfileData(data: any): LinkedInProfile {
    return {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      profilePicture: data.profilePicture,
      emailAddress: data.emailAddress
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Create a new LinkedIn client instance
 */
export const createLinkedInClient = (accessToken?: string, expiresAt?: number): LinkedInClient => {
  return new LinkedInClient(accessToken, expiresAt)
}

/**
 * Utility function to format LinkedIn share content
 */
export const formatShareContent = (
  text: string,
  portfolioUrl?: string,
  options?: {
    title?: string
    description?: string
    visibility?: 'PUBLIC' | 'CONNECTIONS'
  }
) => {
  return {
    text,
    url: portfolioUrl,
    title: options?.title,
    description: options?.description,
    visibility: options?.visibility || 'PUBLIC'
  }
}

/**
 * Utility function to create portfolio share content
 */
export const createPortfolioShareContent = (
  portfolioData: {
    name: string
    title: string
    summary?: string
  },
  portfolioUrl: string,
  customMessage?: string
) => {
  const defaultMessage = `🚀 Check out my updated portfolio! I'm ${portfolioData.name}, ${portfolioData.title}.`
  const message = customMessage || defaultMessage
  
  return formatShareContent(
    message,
    portfolioUrl,
    {
      title: `${portfolioData.name} - Portfolio`,
      description: portfolioData.summary || `Professional portfolio of ${portfolioData.name}`,
      visibility: 'PUBLIC'
    }
  )
}

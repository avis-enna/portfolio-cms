/**
 * OpenAI Client for AI-Powered Content Generation
 * Handles all OpenAI API interactions for generating portfolio content
 */

import OpenAI from 'openai'

export interface AIContentRequest {
  type: 'portfolio_summary' | 'project_description' | 'blog_idea' | 'skill_description' | 'bio_enhancement' | 'custom'
  context: {
    name?: string
    title?: string
    skills?: string[]
    experience?: string[]
    industry?: string
    tone?: 'professional' | 'casual' | 'creative' | 'technical' | 'friendly'
    length?: 'short' | 'medium' | 'long'
    language?: string
    customPrompt?: string
    existingContent?: string
  }
  userInput?: string
}

export interface AIContentResponse {
  content: string
  suggestions?: string[]
  metadata: {
    model: string
    tokens: number
    processingTime: number
    confidence: number
  }
}

export interface AIPromptTemplate {
  id: string
  name: string
  description: string
  type: AIContentRequest['type']
  template: string
  variables: string[]
  examples: string[]
}

class OpenAIClient {
  private client: OpenAI | null = null
  private isConfigured: boolean = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    const apiKey = this.getApiKey()

    if (apiKey) {
      try {
        this.client = new OpenAI({
          apiKey: apiKey,
        })
        this.isConfigured = true
        console.log('OpenAI client initialized successfully')
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error)
        this.isConfigured = false
      }
    } else {
      console.warn('OpenAI API key not configured. AI features will be disabled.')
      this.isConfigured = false
    }
  }

  private getApiKey(): string | null {
    // First try environment variable
    let apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      // Try to load from stored settings
      try {
        const fs = require('fs')
        const path = require('path')
        const crypto = require('crypto')

        const settingsPath = path.join(process.cwd(), 'config', 'api-keys.json')

        if (fs.existsSync(settingsPath)) {
          const data = fs.readFileSync(settingsPath, 'utf8')
          const settings = JSON.parse(data)

          if (settings.openai?.apiKey && settings.openai?.enabled) {
            // Decrypt the API key
            apiKey = this.decrypt(settings.openai.apiKey)
          }
        }
      } catch (error) {
        console.error('Failed to load API key from settings:', error)
      }
    }

    return apiKey
  }

  private decrypt(encryptedText: string): string {
    if (!encryptedText) return ''

    try {
      const crypto = require('crypto')
      const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'

      const algorithm = 'aes-256-cbc'
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)

      const textParts = encryptedText.split(':')
      const iv = Buffer.from(textParts.shift()!, 'hex')
      const encrypted = textParts.join(':')

      const decipher = crypto.createDecipher(algorithm, key)
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      return ''
    }
  }

  /**
   * Reinitialize the client (useful after API key changes)
   */
  reinitialize() {
    this.initialize()
  }

  /**
   * Check if OpenAI is properly configured
   */
  isAvailable(): boolean {
    return this.isConfigured
  }

  /**
   * Generate content based on request parameters
   */
  async generateContent(request: AIContentRequest): Promise<AIContentResponse> {
    if (!this.isConfigured) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY environment variable.')
    }

    const startTime = Date.now()
    
    try {
      const prompt = this.buildPrompt(request)
      const model = this.selectModel(request.type)
      
      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.type, request.context.tone || 'professional')
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.getMaxTokens(request.context.length || 'medium'),
        temperature: this.getTemperature(request.type),
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      })

      const content = completion.choices[0]?.message?.content || ''
      const processingTime = Date.now() - startTime

      // Generate suggestions based on the content type
      const suggestions = await this.generateSuggestions(request, content)

      return {
        content: content.trim(),
        suggestions,
        metadata: {
          model,
          tokens: completion.usage?.total_tokens || 0,
          processingTime,
          confidence: this.calculateConfidence(completion)
        }
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to generate content. Please try again.')
    }
  }

  /**
   * Generate multiple content variations
   */
  async generateVariations(request: AIContentRequest, count: number = 3): Promise<AIContentResponse[]> {
    const variations = await Promise.all(
      Array.from({ length: count }, () => this.generateContent(request))
    )
    
    return variations
  }

  /**
   * Enhance existing content
   */
  async enhanceContent(content: string, type: AIContentRequest['type'], tone: string = 'professional'): Promise<AIContentResponse> {
    const request: AIContentRequest = {
      type: 'custom',
      context: {
        tone: tone as any,
        existingContent: content,
        customPrompt: `Please enhance and improve the following ${type.replace('_', ' ')} content while maintaining its core message and improving clarity, engagement, and professionalism:`
      },
      userInput: content
    }

    return this.generateContent(request)
  }

  /**
   * Generate SEO-optimized content
   */
  async generateSEOContent(request: AIContentRequest, keywords: string[]): Promise<AIContentResponse> {
    const enhancedRequest = {
      ...request,
      context: {
        ...request.context,
        customPrompt: `Generate SEO-optimized content that naturally incorporates these keywords: ${keywords.join(', ')}. ${request.context.customPrompt || ''}`
      }
    }

    return this.generateContent(enhancedRequest)
  }

  /**
   * Build prompt based on request type and context
   */
  private buildPrompt(request: AIContentRequest): string {
    const { type, context, userInput } = request
    
    if (context.customPrompt) {
      return `${context.customPrompt}\n\nContext: ${JSON.stringify(context, null, 2)}\n\nUser Input: ${userInput || 'N/A'}`
    }

    const prompts = {
      portfolio_summary: this.buildPortfolioSummaryPrompt(context),
      project_description: this.buildProjectDescriptionPrompt(context, userInput),
      blog_idea: this.buildBlogIdeaPrompt(context),
      skill_description: this.buildSkillDescriptionPrompt(context, userInput),
      bio_enhancement: this.buildBioEnhancementPrompt(context, userInput),
      custom: userInput || 'Please generate relevant content based on the provided context.'
    }

    return prompts[type] || prompts.custom
  }

  /**
   * Build portfolio summary prompt
   */
  private buildPortfolioSummaryPrompt(context: any): string {
    return `Create a compelling professional summary for ${context.name || 'a professional'} who is a ${context.title || 'developer'}.

Skills: ${context.skills?.join(', ') || 'Various technical skills'}
Experience: ${context.experience?.join(', ') || 'Professional experience'}
Industry: ${context.industry || 'Technology'}
Tone: ${context.tone || 'professional'}
Length: ${context.length || 'medium'}

Please create a summary that highlights their expertise, achievements, and unique value proposition. Make it engaging and suitable for a professional portfolio website.`
  }

  /**
   * Build project description prompt
   */
  private buildProjectDescriptionPrompt(context: any, userInput?: string): string {
    return `Create an engaging project description based on the following information:

Project Details: ${userInput || 'No specific details provided'}
Developer: ${context.name || 'Professional developer'}
Technical Skills: ${context.skills?.join(', ') || 'Various technologies'}
Tone: ${context.tone || 'professional'}
Length: ${context.length || 'medium'}

Please create a description that explains what the project does, the technologies used, challenges overcome, and the impact or results achieved. Make it compelling for potential employers or clients.`
  }

  /**
   * Build blog idea prompt
   */
  private buildBlogIdeaPrompt(context: any): string {
    return `Generate creative and engaging blog post ideas for ${context.name || 'a professional'} in the ${context.industry || 'technology'} industry.

Expertise Areas: ${context.skills?.join(', ') || 'Various technical skills'}
Experience Level: ${context.experience?.join(', ') || 'Professional experience'}
Tone: ${context.tone || 'professional'}

Please provide 5-7 blog post ideas with:
1. Catchy titles
2. Brief descriptions
3. Target audience
4. Key points to cover

Focus on topics that showcase expertise and provide value to readers.`
  }

  /**
   * Build skill description prompt
   */
  private buildSkillDescriptionPrompt(context: any, userInput?: string): string {
    return `Create a detailed description for the skill: ${userInput || 'the specified skill'}

Professional Context:
- Name: ${context.name || 'Professional'}
- Title: ${context.title || 'Developer'}
- Experience: ${context.experience?.join(', ') || 'Professional experience'}
- Tone: ${context.tone || 'professional'}

Please describe:
1. What this skill involves
2. How it's applied in real projects
3. Level of expertise
4. Specific technologies or tools used
5. Impact on project outcomes

Make it suitable for a professional portfolio skills section.`
  }

  /**
   * Build bio enhancement prompt
   */
  private buildBioEnhancementPrompt(context: any, userInput?: string): string {
    return `Enhance and improve the following professional bio:

Current Bio: ${userInput || context.existingContent || 'No bio provided'}

Context:
- Name: ${context.name || 'Professional'}
- Title: ${context.title || 'Developer'}
- Skills: ${context.skills?.join(', ') || 'Various skills'}
- Tone: ${context.tone || 'professional'}
- Length: ${context.length || 'medium'}

Please improve the bio by:
1. Making it more engaging and compelling
2. Highlighting unique strengths and achievements
3. Improving flow and readability
4. Maintaining authenticity
5. Optimizing for the target audience

Keep the core personality and facts while enhancing presentation.`
  }

  /**
   * Get system prompt based on content type and tone
   */
  private getSystemPrompt(type: string, tone: string): string {
    const basePrompt = `You are an expert content writer specializing in professional portfolio and career content. You create compelling, authentic, and engaging content that helps professionals showcase their skills and experience effectively.`
    
    const toneInstructions = {
      professional: 'Use a professional, polished tone that conveys expertise and credibility.',
      casual: 'Use a friendly, approachable tone that feels conversational yet professional.',
      creative: 'Use a creative, innovative tone that showcases personality and unique thinking.',
      technical: 'Use a precise, technical tone that demonstrates deep expertise and attention to detail.',
      friendly: 'Use a warm, personable tone that builds connection while maintaining professionalism.'
    }

    return `${basePrompt} ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}`
  }

  /**
   * Select appropriate model based on content type
   */
  private selectModel(type: string): string {
    const complexTypes = ['blog_idea', 'custom']
    return complexTypes.includes(type) ? 'gpt-4' : 'gpt-3.5-turbo'
  }

  /**
   * Get max tokens based on length preference
   */
  private getMaxTokens(length: string): number {
    const tokenLimits = {
      short: 150,
      medium: 300,
      long: 500
    }
    return tokenLimits[length as keyof typeof tokenLimits] || tokenLimits.medium
  }

  /**
   * Get temperature based on content type
   */
  private getTemperature(type: string): number {
    const temperatures = {
      portfolio_summary: 0.7,
      project_description: 0.6,
      blog_idea: 0.9,
      skill_description: 0.5,
      bio_enhancement: 0.6,
      custom: 0.7
    }
    return temperatures[type as keyof typeof temperatures] || 0.7
  }

  /**
   * Calculate confidence score based on completion
   */
  private calculateConfidence(completion: any): number {
    // Simple confidence calculation based on response quality indicators
    const choice = completion.choices[0]
    if (!choice) return 0
    
    const finishReason = choice.finish_reason
    const contentLength = choice.message?.content?.length || 0
    
    let confidence = 0.5 // Base confidence
    
    if (finishReason === 'stop') confidence += 0.3
    if (contentLength > 50) confidence += 0.2
    if (contentLength > 200) confidence += 0.1
    
    return Math.min(confidence, 1.0)
  }

  /**
   * Generate content suggestions
   */
  private async generateSuggestions(request: AIContentRequest, content: string): Promise<string[]> {
    try {
      const suggestionPrompt = `Based on this generated content, provide 3-5 brief suggestions for improvement or alternative approaches:

Content: ${content}

Provide practical, actionable suggestions that could enhance the content further.`

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful content advisor. Provide brief, actionable suggestions for content improvement.'
          },
          {
            role: 'user',
            content: suggestionPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      })

      const suggestions = completion.choices[0]?.message?.content || ''
      return suggestions.split('\n').filter(s => s.trim().length > 0).slice(0, 5)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      return []
    }
  }

  /**
   * Improve existing content using OpenAI
   */
  async improveContent(params: {
    content: string
    type: string
    improvements: string[]
    tone?: string
    length?: string
  }): Promise<{
    success: boolean
    content?: string
    suggestions?: string[]
    error?: string
    metadata?: {
      originalLength: number
      tokens: number
      confidence: number
    }
  }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'OpenAI is not configured',
        content: undefined,
        suggestions: [],
      }
    }

    try {
      const { content, type, improvements, tone = 'professional', length = 'medium' } = params

      const improvementList = improvements.join(', ')
      const prompt = `Please improve the following ${type} content by focusing on: ${improvementList}.

Content to improve:
"${content}"

Requirements:
- Tone: ${tone}
- Length: ${length}
- Maintain the core message while enhancing clarity, engagement, and professionalism
- Provide specific suggestions for improvement

Please provide:
1. The improved content
2. A list of specific improvements made
3. Additional suggestions for further enhancement`

      const response = await this.client!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional content editor and copywriter. Provide improved content and actionable suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const result = response.choices[0]?.message?.content || ''

      // Parse the response to extract improved content and suggestions
      const lines = result.split('\n').filter(line => line.trim())
      const improvedContent = lines.find(line =>
        line.toLowerCase().includes('improved') ||
        line.toLowerCase().includes('enhanced')
      ) || result

      const suggestions = lines.filter(line =>
        line.includes('•') ||
        line.includes('-') ||
        line.includes('suggestion')
      ).map(line => line.replace(/^[•\-\d\.]\s*/, '').trim())

      return {
        success: true,
        content: improvedContent,
        suggestions: suggestions.length > 0 ? suggestions : ['Content has been improved for clarity and engagement'],
        metadata: {
          originalLength: content.length,
          tokens: response.usage?.total_tokens || 0,
          confidence: 0.8,
        }
      }
    } catch (error: any) {
      console.error('Failed to improve content:', error)
      return {
        success: false,
        error: `Failed to improve content: ${error.message}`,
        content: undefined,
        suggestions: [],
      }
    }
  }

  /**
   * Generate SEO-optimized content using OpenAI
   */
  async generateSEOContent(params: {
    content: string
    keywords: string[]
    type: 'meta_description' | 'title' | 'heading' | 'alt_text'
    maxLength?: number
  }): Promise<{
    success: boolean
    content?: string
    suggestions?: string[]
    error?: string
    metadata?: {
      originalLength: number
      tokens: number
      confidence: number
    }
  }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'OpenAI is not configured',
        content: undefined,
        suggestions: [],
      }
    }

    try {
      const { content, keywords, type, maxLength } = params
      const keywordList = keywords.join(', ')

      let prompt = ''
      let lengthGuidance = ''

      switch (type) {
        case 'meta_description':
          lengthGuidance = maxLength ? `${maxLength} characters` : '150-160 characters'
          prompt = `Create an SEO-optimized meta description for the following content. Include these keywords naturally: ${keywordList}. Keep it under ${lengthGuidance} and make it compelling for search results.`
          break
        case 'title':
          lengthGuidance = maxLength ? `${maxLength} characters` : '50-60 characters'
          prompt = `Create an SEO-optimized title for the following content. Include these keywords naturally: ${keywordList}. Keep it under ${lengthGuidance} and make it click-worthy.`
          break
        case 'heading':
          lengthGuidance = maxLength ? `${maxLength} characters` : '70 characters'
          prompt = `Create an SEO-optimized heading for the following content. Include these keywords naturally: ${keywordList}. Keep it under ${lengthGuidance} and make it engaging.`
          break
        case 'alt_text':
          lengthGuidance = maxLength ? `${maxLength} characters` : '125 characters'
          prompt = `Create SEO-optimized alt text for an image related to the following content. Include these keywords naturally: ${keywordList}. Keep it under ${lengthGuidance} and be descriptive.`
          break
      }

      prompt += `\n\nContent: "${content}"`

      const response = await this.client!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert. Create optimized content that ranks well in search engines while being natural and engaging.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.5,
      })

      const result = response.choices[0]?.message?.content?.trim() || ''

      return {
        success: true,
        content: result,
        suggestions: [
          'Consider A/B testing different variations',
          'Monitor search performance and adjust keywords',
          'Ensure content matches user search intent'
        ],
        metadata: {
          originalLength: content.length,
          tokens: response.usage?.total_tokens || 0,
          confidence: 0.85,
        }
      }
    } catch (error: any) {
      console.error('Failed to generate SEO content:', error)
      return {
        success: false,
        error: `Failed to generate SEO content: ${error.message}`,
        content: undefined,
        suggestions: [],
      }
    }
  }
}

// Export singleton instance
export const openAIClient = new OpenAIClient()

// Export prompt templates for UI
export const promptTemplates: AIPromptTemplate[] = [
  {
    id: 'portfolio_summary',
    name: 'Portfolio Summary',
    description: 'Generate a compelling professional summary',
    type: 'portfolio_summary',
    template: 'Create a professional summary for {name} who is a {title} with expertise in {skills}',
    variables: ['name', 'title', 'skills'],
    examples: ['Professional developer summary', 'Designer portfolio overview']
  },
  {
    id: 'project_description',
    name: 'Project Description',
    description: 'Create engaging project descriptions',
    type: 'project_description',
    template: 'Describe a {type} project that uses {technologies} and solves {problem}',
    variables: ['type', 'technologies', 'problem'],
    examples: ['Web application description', 'Mobile app overview']
  },
  {
    id: 'blog_ideas',
    name: 'Blog Post Ideas',
    description: 'Generate creative blog post ideas',
    type: 'blog_idea',
    template: 'Generate blog ideas for {industry} professional with {expertise}',
    variables: ['industry', 'expertise'],
    examples: ['Tech blog ideas', 'Design article topics']
  }
]

  /**
   * Improve existing content using OpenAI
   */
  async improveContent(params: {
    content: string
    type: string
    improvements: string[]
    tone?: string
    length?: string
  }): Promise<{
    success: boolean
    content?: string
    suggestions?: string[]
    error?: string
    metadata?: {
      model: string
      tokens: number
      confidence: number
    }
  }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'OpenAI is not configured',
        content: null,
        suggestions: [],
      }
    }

    try {
      const { content, type, improvements, tone = 'professional', length = 'medium' } = params

      const improvementPrompt = `Please improve the following ${type.replace('_', ' ')} content based on these specific improvements: ${improvements.join(', ')}.

Original content:
"${content}"

Please provide an improved version that:
- Maintains the original meaning and intent
- Applies the requested improvements: ${improvements.join(', ')}
- Uses a ${tone} tone
- Is ${length} in length
- Is engaging and well-written

Improved content:`

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional content editor and copywriter. Improve content while maintaining its core message and intent.',
          },
          {
            role: 'user',
            content: improvementPrompt,
          },
        ],
        max_tokens: this.getMaxTokens(length),
        temperature: 0.7,
        n: 3, // Generate 3 suggestions
      })

      const suggestions = response.choices.map(choice => choice.message.content?.trim() || '')
      const improvedContent = suggestions[0]

      return {
        success: true,
        content: improvedContent,
        suggestions,
        metadata: {
          model: 'gpt-3.5-turbo',
          tokens: response.usage?.total_tokens || 0,
          confidence: 0.85,
        },
      }
    } catch (error) {
      console.error('OpenAI improvement error:', error)
      return {
        success: false,
        error: `Failed to improve content: ${error.message}`,
        content: null,
        suggestions: [],
      }
    }
  }

  /**
   * Generate SEO-optimized content using OpenAI
   */
  async generateSEOContent(params: {
    content: string
    keywords: string[]
    type: 'meta_description' | 'title' | 'heading' | 'alt_text'
    maxLength?: number
  }): Promise<{
    success: boolean
    content?: string
    suggestions?: string[]
    error?: string
    metadata?: {
      model: string
      tokens: number
      confidence: number
    }
  }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'OpenAI is not configured',
        content: null,
        suggestions: [],
      }
    }

    try {
      const { content, keywords, type, maxLength } = params

      const seoPrompt = `Create SEO-optimized ${type.replace('_', ' ')} based on the following content and target keywords.

Content:
"${content}"

Target Keywords: ${keywords.join(', ')}

Requirements:
- Naturally incorporate the target keywords
- Follow SEO best practices for ${type.replace('_', ' ')}
- Be compelling and click-worthy
- ${maxLength ? `Stay under ${maxLength} characters` : ''}
- Maintain readability and natural flow

Generate 3 variations of SEO-optimized ${type.replace('_', ' ')}:`

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert and copywriter. Create compelling, keyword-optimized content that ranks well and converts visitors.',
          },
          {
            role: 'user',
            content: seoPrompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
        n: 3,
      })

      const suggestions = response.choices.map(choice => choice.message.content?.trim() || '')
      const seoContent = suggestions[0]

      return {
        success: true,
        content: seoContent,
        suggestions,
        metadata: {
          model: 'gpt-3.5-turbo',
          tokens: response.usage?.total_tokens || 0,
          confidence: 0.9,
        },
      }
    } catch (error) {
      console.error('OpenAI SEO generation error:', error)
      return {
        success: false,
        error: `Failed to generate SEO content: ${error.message}`,
        content: null,
        suggestions: [],
      }
    }
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient()

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
  private client: OpenAI
  private isConfigured: boolean

  constructor() {
    this.isConfigured = !!process.env.OPENAI_API_KEY
    
    if (this.isConfigured) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    } else {
      console.warn('OpenAI API key not configured. AI features will be disabled.')
    }
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

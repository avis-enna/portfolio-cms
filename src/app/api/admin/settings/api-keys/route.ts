/**
 * API Keys Settings API Route
 * Manage OpenAI and other API keys securely
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Encryption key for API keys (in production, use environment variable)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'

interface APIKeySettings {
  openai: {
    apiKey: string
    model: string
    maxTokens: number
    temperature: number
    enabled: boolean
  }
  analytics: {
    googleAnalyticsId: string
    enabled: boolean
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    enabled: boolean
  }
}

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
  if (!text) return ''
  
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipher(algorithm, key)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  
  try {
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
 * Get API keys settings file path
 */
function getSettingsPath(): string {
  return path.join(process.cwd(), 'config', 'api-keys.json')
}

/**
 * Load API keys settings
 */
function loadSettings(): APIKeySettings {
  const settingsPath = getSettingsPath()
  
  const defaultSettings: APIKeySettings = {
    openai: {
      apiKey: '',
      model: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.7,
      enabled: false
    },
    analytics: {
      googleAnalyticsId: '',
      enabled: false
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      enabled: false
    }
  }
  
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8')
      const settings = JSON.parse(data)
      
      // Decrypt sensitive fields
      if (settings.openai?.apiKey) {
        settings.openai.apiKey = decrypt(settings.openai.apiKey)
      }
      if (settings.email?.smtpPassword) {
        settings.email.smtpPassword = decrypt(settings.email.smtpPassword)
      }
      
      return { ...defaultSettings, ...settings }
    }
  } catch (error) {
    console.error('Failed to load API key settings:', error)
  }
  
  return defaultSettings
}

/**
 * Save API keys settings
 */
function saveSettings(settings: APIKeySettings): void {
  const settingsPath = getSettingsPath()
  
  // Create config directory if it doesn't exist
  const configDir = path.dirname(settingsPath)
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
  
  // Encrypt sensitive fields before saving
  const settingsToSave = JSON.parse(JSON.stringify(settings))
  
  if (settingsToSave.openai?.apiKey) {
    settingsToSave.openai.apiKey = encrypt(settingsToSave.openai.apiKey)
  }
  if (settingsToSave.email?.smtpPassword) {
    settingsToSave.email.smtpPassword = encrypt(settingsToSave.email.smtpPassword)
  }
  
  fs.writeFileSync(settingsPath, JSON.stringify(settingsToSave, null, 2))
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Load settings
    const settings = loadSettings()
    
    // Mask sensitive data for display
    const maskedSettings = {
      ...settings,
      openai: {
        ...settings.openai,
        apiKey: settings.openai.apiKey ? maskApiKey(settings.openai.apiKey) : ''
      },
      email: {
        ...settings.email,
        smtpPassword: settings.email.smtpPassword ? '••••••••' : ''
      }
    }

    return NextResponse.json({
      success: true,
      settings: maskedSettings
    })

  } catch (error) {
    console.error('API keys settings GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load API key settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const newSettings: APIKeySettings = await request.json()

    // Validate settings
    if (newSettings.openai?.maxTokens && (newSettings.openai.maxTokens < 100 || newSettings.openai.maxTokens > 2000)) {
      return NextResponse.json(
        { success: false, error: 'Max tokens must be between 100 and 2000' },
        { status: 400 }
      )
    }

    if (newSettings.openai?.temperature && (newSettings.openai.temperature < 0 || newSettings.openai.temperature > 1)) {
      return NextResponse.json(
        { success: false, error: 'Temperature must be between 0 and 1' },
        { status: 400 }
      )
    }

    // Load current settings to preserve unchanged values
    const currentSettings = loadSettings()
    
    // Merge settings, preserving masked values
    const settingsToSave: APIKeySettings = {
      openai: {
        ...currentSettings.openai,
        ...newSettings.openai,
        // If API key is masked, keep the current one
        apiKey: newSettings.openai.apiKey && !newSettings.openai.apiKey.includes('•') 
          ? newSettings.openai.apiKey 
          : currentSettings.openai.apiKey
      },
      analytics: {
        ...currentSettings.analytics,
        ...newSettings.analytics
      },
      email: {
        ...currentSettings.email,
        ...newSettings.email,
        // If password is masked, keep the current one
        smtpPassword: newSettings.email.smtpPassword && newSettings.email.smtpPassword !== '••••••••'
          ? newSettings.email.smtpPassword
          : currentSettings.email.smtpPassword
      }
    }

    // Save settings
    saveSettings(settingsToSave)

    // Update environment variables for immediate use
    if (settingsToSave.openai.apiKey) {
      process.env.OPENAI_API_KEY = settingsToSave.openai.apiKey
    }

    return NextResponse.json({
      success: true,
      message: 'API key settings saved successfully'
    })

  } catch (error) {
    console.error('API keys settings POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save API key settings' },
      { status: 500 }
    )
  }
}

/**
 * Mask API key for display
 */
function maskApiKey(key: string): string {
  if (!key) return ''
  if (key.length <= 8) return key
  return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4)
}

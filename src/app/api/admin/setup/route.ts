import { NextRequest, NextResponse } from 'next/server'
import { configLoader } from '@/lib/config/config-loader'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { personal, social, features, theme } = body

    // Validate required fields
    if (!personal?.name || !personal?.title || !personal?.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required personal information' },
        { status: 400 }
      )
    }

    // Save configuration using config loader
    const config = {
      personal,
      social: social || {},
      features: features || {},
      theme: theme || {
        style: 'default',
        primaryColor: '#2563eb',
        mode: 'system'
      }
    }

    // Update portfolio configuration
    configLoader.updatePortfolioConfig({
      personal: config.personal,
      social: config.social
    })

    // Update setup configuration
    configLoader.updateSetupConfig({
      features: Object.fromEntries(
        Object.entries(config.features).map(([key, enabled]) => [
          key,
          { enabled: Boolean(enabled), configured: Boolean(enabled) }
        ])
      ),
      theme: config.theme,
      setup: {
        isComplete: true,
        setupDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Setup completed successfully',
      config
    })
  } catch (error) {
    console.error('Setup completion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete setup' },
      { status: 500 }
    )
  }
}

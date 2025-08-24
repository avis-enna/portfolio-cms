/**
 * Setup Status API Route
 * Returns the current setup status and configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { configLoader } from '@/lib/config/config-loader'

export async function GET(request: NextRequest) {
  try {
    const isConfigured = configLoader.isConfigured()
    
    if (isConfigured) {
      // Return current configuration for editing
      const portfolioConfig = configLoader.getPortfolioConfig()
      const setupConfig = configLoader.getSetupConfig()
      
      return NextResponse.json({
        success: true,
        isConfigured: true,
        config: {
          personal: portfolioConfig.personal,
          social: portfolioConfig.social,
          features: Object.fromEntries(
            Object.entries(setupConfig.features).map(([key, config]) => [key, config.enabled])
          ),
          theme: setupConfig.theme
        },
        setupDate: setupConfig.setup.setupDate,
        lastModified: setupConfig.setup.lastModified
      })
    } else {
      return NextResponse.json({
        success: true,
        isConfigured: false,
        config: null
      })
    }
  } catch (error) {
    console.error('Setup status error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check setup status',
        isConfigured: false 
      },
      { status: 500 }
    )
  }
}

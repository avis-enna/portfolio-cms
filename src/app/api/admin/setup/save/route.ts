/**
 * Setup Save API Route
 * Saves the portfolio configuration from the setup wizard
 */

import { NextRequest, NextResponse } from 'next/server'
import { configLoader } from '@/lib/config/config-loader'
import crypto from 'crypto'

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

    // Create portfolio configuration
    const portfolioConfig = {
      personal: {
        name: personal.name,
        title: personal.title,
        tagline: personal.tagline || '',
        bio: personal.bio || '',
        location: personal.location || '',
        timezone: 'America/New_York',
        languages: ['English'],
        email: personal.email,
        phone: personal.phone || null,
        website: personal.website || null,
        avatar: '/images/avatar.jpg',
        resume: '/files/resume.pdf'
      },
      social: social || {},
      about: {
        shortDescription: personal.tagline || `${personal.title} passionate about creating amazing digital experiences`,
        longDescription: personal.bio || `I'm ${personal.name}, a ${personal.title} with expertise in modern technologies.`,
        interests: [],
        values: [],
        funFacts: []
      },
      experience: [],
      education: [],
      certifications: [],
      awards: [],
      testimonials: [],
      contact: {
        availability: "Available for opportunities",
        preferredContact: "email",
        responseTime: "Within 24 hours",
        timezone: "EST (UTC-5)",
        workingHours: "9 AM - 6 PM EST"
      },
      seo: {
        title: `${personal.name} - ${personal.title} Portfolio`,
        description: `Professional portfolio of ${personal.name}, a ${personal.title} specializing in modern web technologies.`,
        keywords: [
          personal.title.toLowerCase(),
          "portfolio",
          personal.name.toLowerCase(),
          "developer",
          "web development"
        ],
        ogImage: "/images/og-image.jpg",
        twitterCard: "summary_large_image",
        canonicalUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }
    }

    // Create setup configuration
    const setupConfig = {
      setup: {
        isConfigured: true,
        version: "1.0.0",
        setupDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        configuredBy: personal.name
      },
      deployment: {
        platform: "vercel",
        domain: null,
        customDomain: null,
        environment: "development",
        deploymentUrl: null
      },
      features: {
        ai: {
          enabled: features?.ai || false,
          provider: "openai",
          model: "gpt-3.5-turbo",
          maxTokens: 500,
          temperature: 0.7
        },
        analytics: {
          enabled: features?.analytics || false,
          provider: "internal",
          trackingId: null,
          enableRealTime: true,
          enablePerformance: true
        },
        pwa: {
          enabled: features?.pwa || false,
          enableOffline: true,
          enableNotifications: true,
          enableInstallPrompt: true
        },
        blog: {
          enabled: features?.blog || false,
          enableComments: false,
          enableSearch: true,
          postsPerPage: 10
        },
        contact: {
          enabled: features?.contact || false,
          enableForm: true,
          enableCalendly: false,
          enableChat: false
        },
        social: {
          enableSharing: true,
          enableLinkedInIntegration: false,
          enableTwitterIntegration: false
        }
      },
      theme: {
        name: theme?.name || "default",
        mode: theme?.mode || "system",
        primaryColor: theme?.primaryColor || "#2563eb",
        secondaryColor: "#64748b",
        accentColor: "#f59e0b",
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        fontFamily: "Inter",
        borderRadius: "0.5rem",
        animations: true
      },
      layout: {
        header: {
          style: "modern",
          showLogo: true,
          showNavigation: true,
          sticky: true
        },
        hero: {
          style: "gradient",
          showAvatar: true,
          showSocial: true,
          showCTA: true
        },
        sections: {
          about: { enabled: true, order: 1 },
          experience: { enabled: true, order: 2 },
          projects: { enabled: true, order: 3 },
          skills: { enabled: true, order: 4 },
          blog: { enabled: features?.blog || false, order: 5 },
          testimonials: { enabled: true, order: 6 },
          contact: { enabled: features?.contact || false, order: 7 }
        },
        footer: {
          showSocial: true,
          showCopyright: true,
          showBackToTop: true
        }
      },
      seo: {
        enableSitemap: true,
        enableRobots: true,
        enableStructuredData: true,
        enableOpenGraph: true,
        enableTwitterCards: true
      },
      performance: {
        enableImageOptimization: true,
        enableLazyLoading: true,
        enableCompression: true,
        enableCaching: true
      },
      security: {
        enableCSP: true,
        enableCORS: true,
        enableRateLimit: true,
        enableInputValidation: true
      }
    }

    // Create default projects configuration if it doesn't exist
    const defaultProjectsConfig = {
      featured: [],
      other: [],
      categories: [
        "Web Application",
        "Mobile Application",
        "API Development",
        "Data Analytics",
        "Machine Learning",
        "E-commerce",
        "Productivity Tools"
      ],
      technologies: [
        "React",
        "Vue.js",
        "Angular",
        "Node.js",
        "Python",
        "TypeScript",
        "JavaScript",
        "React Native",
        "Flutter",
        "MongoDB",
        "PostgreSQL",
        "MySQL",
        "Redis",
        "AWS",
        "Docker",
        "Kubernetes"
      ]
    }

    // Save configurations
    configLoader.savePortfolioConfig(portfolioConfig)
    configLoader.saveSetupConfig(setupConfig)
    
    // Save projects config if it doesn't exist
    try {
      configLoader.getProjectsConfig()
    } catch {
      configLoader.saveProjectsConfig(defaultProjectsConfig)
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio setup completed successfully',
      config: {
        personal: portfolioConfig.personal,
        features: Object.fromEntries(
          Object.entries(setupConfig.features).map(([key, config]) => [key, config.enabled])
        ),
        theme: setupConfig.theme
      }
    })

  } catch (error) {
    console.error('Setup save error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save setup configuration' },
      { status: 500 }
    )
  }
}

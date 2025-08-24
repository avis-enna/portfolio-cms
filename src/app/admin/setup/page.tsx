/**
 * Admin Setup Page
 * Web-based setup wizard for configuring the portfolio
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { useToast } from '@/components/Toast'

interface SetupStep {
  id: string
  title: string
  description: string
  completed: boolean
}

interface PersonalInfo {
  name: string
  title: string
  tagline: string
  email: string
  phone: string
  location: string
  bio: string
}

interface SocialLinks {
  github: string
  linkedin: string
  twitter: string
  instagram: string
  youtube: string
  dribbble: string
  behance: string
  medium: string
}

interface FeatureConfig {
  ai: boolean
  analytics: boolean
  pwa: boolean
  blog: boolean
  contact: boolean
}

interface ThemeConfig {
  name: string
  primaryColor: string
  mode: string
}

export default function AdminSetupPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const { showToast } = useToast()

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: '',
    title: '',
    tagline: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  })

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    youtube: '',
    dribbble: '',
    behance: '',
    medium: ''
  })

  const [features, setFeatures] = useState<FeatureConfig>({
    ai: true,
    analytics: true,
    pwa: true,
    blog: true,
    contact: true
  })

  const [theme, setTheme] = useState<ThemeConfig>({
    name: 'default',
    primaryColor: '#2563eb',
    mode: 'system'
  })

  const steps: SetupStep[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Add your basic information and bio',
      completed: false
    },
    {
      id: 'social',
      title: 'Social Links',
      description: 'Connect your social media profiles',
      completed: false
    },
    {
      id: 'features',
      title: 'Features',
      description: 'Choose which features to enable',
      completed: false
    },
    {
      id: 'theme',
      title: 'Theme & Design',
      description: 'Customize your portfolio appearance',
      completed: false
    },
    {
      id: 'complete',
      title: 'Complete Setup',
      description: 'Review and save your configuration',
      completed: false
    }
  ]

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/admin/setup/status')
      if (response.ok) {
        const data = await response.json()
        setIsConfigured(data.isConfigured)
        
        if (data.isConfigured && data.config) {
          // Pre-populate form with existing config
          if (data.config.personal) {
            setPersonalInfo(data.config.personal)
          }
          if (data.config.social) {
            setSocialLinks(data.config.social)
          }
          if (data.config.features) {
            setFeatures(data.config.features)
          }
          if (data.config.theme) {
            setTheme(data.config.theme)
          }
        }
      }
    } catch (error) {
      console.error('Failed to check setup status:', error)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    
    try {
      const config = {
        personal: personalInfo,
        social: socialLinks,
        features,
        theme
      }

      const response = await fetch('/api/admin/setup/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        showToast('Portfolio setup completed successfully!', 'success')
        setIsConfigured(true)
        
        // Redirect to admin dashboard
        setTimeout(() => {
          window.location.href = '/admin'
        }, 2000)
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Setup error:', error)
      showToast('Failed to complete setup. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const renderPersonalInfoStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={personalInfo.name}
              onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Full Name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Title *
            </label>
            <input
              type="text"
              value={personalInfo.title}
              onChange={(e) => setPersonalInfo({ ...personalInfo, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Full Stack Developer"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={personalInfo.tagline}
              onChange={(e) => setPersonalInfo({ ...personalInfo, tagline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your professional motto"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={personalInfo.email}
              onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={personalInfo.location}
              onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="City, Country"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio / About You
          </label>
          <textarea
            value={personalInfo.bio}
            onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell visitors about yourself, your experience, and what you're passionate about..."
          />
        </div>
      </div>
    </div>
  )

  const renderSocialLinksStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h3>
        <p className="text-sm text-gray-600 mb-6">
          Add your social media profiles to help visitors connect with you. Leave empty to skip.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(socialLinks).map(([platform, url]) => (
            <div key={platform}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {platform}
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`https://${platform}.com/username`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderFeaturesStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Features</h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose which features you want to enable in your portfolio.
        </p>
        
        <div className="space-y-4">
          {Object.entries(features).map(([feature, enabled]) => {
            const featureInfo = {
              ai: { name: 'AI Content Generation', description: 'Generate content with OpenAI assistance' },
              analytics: { name: 'Analytics Dashboard', description: 'Track visitors and performance metrics' },
              pwa: { name: 'Progressive Web App', description: 'Offline support and app-like experience' },
              blog: { name: 'Blog System', description: 'Write and publish blog posts' },
              contact: { name: 'Contact Form', description: 'Allow visitors to contact you directly' }
            }[feature]

            return (
              <div key={feature} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{featureInfo?.name}</h4>
                  <p className="text-sm text-gray-600">{featureInfo?.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setFeatures({ ...features, [feature]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderThemeStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme & Design</h3>
        <p className="text-sm text-gray-600 mb-6">
          Customize the appearance of your portfolio.
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme Style
            </label>
            <select
              value={theme.name}
              onChange={(e) => setTheme({ ...theme, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default</option>
              <option value="minimal">Minimal</option>
              <option value="dark">Dark</option>
              <option value="colorful">Colorful</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                className="w-12 h-12 border border-gray-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#2563eb"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Mode
            </label>
            <select
              value={theme.mode}
              onChange={(e) => setTheme({ ...theme, mode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="system">System (Auto)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Complete!</h3>
        <p className="text-sm text-gray-600 mb-6">
          Review your configuration and complete the setup.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Personal Information</h4>
            <p className="text-sm text-gray-600">{personalInfo.name} - {personalInfo.title}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900">Features Enabled</h4>
            <p className="text-sm text-gray-600">
              {Object.entries(features).filter(([_, enabled]) => enabled).map(([feature]) => feature).join(', ')}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900">Theme</h4>
            <p className="text-sm text-gray-600">{theme.name} theme with {theme.primaryColor} primary color</p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Access your admin dashboard to add projects and content</li>
            <li>• Upload your profile picture and project images</li>
            <li>• Write your first blog post</li>
            <li>• Customize your theme further if needed</li>
            <li>• Deploy your portfolio to make it live</li>
          </ul>
        </div>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderPersonalInfoStep()
      case 1: return renderSocialLinksStep()
      case 2: return renderFeaturesStep()
      case 3: return renderThemeStep()
      case 4: return renderCompleteStep()
      default: return renderPersonalInfoStep()
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return personalInfo.name && personalInfo.title && personalInfo.email
      case 1: return true // Social links are optional
      case 2: return true // Features have defaults
      case 3: return true // Theme has defaults
      case 4: return true
      default: return false
    }
  }

  if (isConfigured && currentStep === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Portfolio Already Configured</h1>
          <p className="text-gray-600 mb-6">
            Your portfolio is already set up! You can make changes through the admin dashboard.
          </p>
          <div className="space-x-4">
            <Button
              onClick={() => window.location.href = '/admin'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Admin Dashboard
            </Button>
            <Button
              onClick={() => setCurrentStep(0)}
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Reconfigure Setup
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Setup</h1>
        <p className="text-gray-600">Let's configure your portfolio with your personal information and preferences.</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index <= currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`ml-6 w-16 h-0.5 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
          className="text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </Button>

        <div className="flex space-x-4">
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              loading={isLoading}
              disabled={!isStepValid() || isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

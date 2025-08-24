/**
 * API Keys Settings Page
 * Manage OpenAI and other API keys from the admin panel
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { useToast } from '@/components/Toast'

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

export default function APIKeysPage() {
  const [settings, setSettings] = useState<APIKeySettings>({
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
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingAI, setTestingAI] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadAPIKeySettings()
  }, [])

  const loadAPIKeySettings = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/settings/api-keys', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Failed to load API key settings:', error)
      showToast('Failed to load API key settings', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const saveAPIKeySettings = async () => {
    setIsSaving(true)
    try {
      const accessToken = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/settings/api-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast('API key settings saved successfully!', 'success')
        } else {
          throw new Error(data.error || 'Failed to save settings')
        }
      } else {
        throw new Error('Failed to save API key settings')
      }
    } catch (error) {
      console.error('Save error:', error)
      showToast('Failed to save API key settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const testOpenAIConnection = async () => {
    if (!settings.openai.apiKey) {
      showToast('Please enter an OpenAI API key first', 'error')
      return
    }

    setTestingAI(true)
    try {
      const accessToken = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/settings/test-openai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: settings.openai.apiKey,
          model: settings.openai.model
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast('OpenAI connection successful! ✨', 'success')
          setSettings(prev => ({
            ...prev,
            openai: { ...prev.openai, enabled: true }
          }))
        } else {
          throw new Error(data.error || 'Connection test failed')
        }
      } else {
        throw new Error('Failed to test OpenAI connection')
      }
    } catch (error) {
      console.error('OpenAI test error:', error)
      showToast('OpenAI connection failed. Please check your API key.', 'error')
      setSettings(prev => ({
        ...prev,
        openai: { ...prev.openai, enabled: false }
      }))
    } finally {
      setTestingAI(false)
    }
  }

  const maskApiKey = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return key
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="api-keys-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys & Integrations</h1>
        <p className="text-gray-600">
          Manage your API keys and external service integrations. All keys are encrypted and stored securely.
        </p>
      </div>

      <div className="space-y-8">
        {/* OpenAI Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🤖</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">OpenAI Integration</h2>
                <p className="text-sm text-gray-600">Enable AI-powered content generation</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              settings.openai.enabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {settings.openai.enabled ? 'Connected' : 'Not Connected'}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.openai.apiKey}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      openai: { ...prev.openai, apiKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <Button
                  onClick={testOpenAIConnection}
                  loading={testingAI}
                  disabled={!settings.openai.apiKey || testingAI}
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  data-testid="test-openai-button"
                >
                  {testingAI ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from{' '}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={settings.openai.model}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    openai: { ...prev.openai, model: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Recommended)</option>
                  <option value="gpt-4">GPT-4 (More Expensive)</option>
                  <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="100"
                  max="2000"
                  value={settings.openai.maxTokens}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    openai: { ...prev.openai, maxTokens: parseInt(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.openai.temperature}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    openai: { ...prev.openai, temperature: parseFloat(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {!settings.openai.apiKey && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🚀 Get Started with AI Features</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Generate professional portfolio content automatically</li>
                  <li>• Create project descriptions with multiple variations</li>
                  <li>• Get blog post ideas and content enhancement</li>
                  <li>• SEO optimization and improvement suggestions</li>
                </ul>
                <p className="text-sm text-blue-600 mt-3">
                  <strong>No API key?</strong> You can still use all other features. Add your OpenAI key later to unlock AI content generation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Google Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Google Analytics</h2>
                <p className="text-sm text-gray-600">Track additional analytics with Google Analytics</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.analytics.enabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  analytics: { ...prev.analytics, enabled: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Analytics Measurement ID
            </label>
            <input
              type="text"
              value={settings.analytics.googleAnalyticsId}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                analytics: { ...prev.analytics, googleAnalyticsId: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="G-XXXXXXXXXX"
              disabled={!settings.analytics.enabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Add Google Analytics for additional tracking alongside built-in analytics
            </p>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📧</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Email Configuration</h2>
                <p className="text-sm text-gray-600">Configure SMTP for contact form emails</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.email.enabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, enabled: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.email.smtpHost}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, smtpHost: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="smtp.gmail.com"
                disabled={!settings.email.enabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <input
                type="number"
                value={settings.email.smtpPort}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, smtpPort: parseInt(e.target.value) }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="587"
                disabled={!settings.email.enabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username
              </label>
              <input
                type="text"
                value={settings.email.smtpUser}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, smtpUser: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-email@gmail.com"
                disabled={!settings.email.enabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password
              </label>
              <input
                type="password"
                value={settings.email.smtpPassword}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, smtpPassword: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="app-password"
                disabled={!settings.email.enabled}
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> For Gmail, use an App Password instead of your regular password. 
              Enable 2-factor authentication and generate an app password in your Google Account settings.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-8">
        <Button
          onClick={saveAPIKeySettings}
          loading={isSaving}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          data-testid="save-settings-button"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}

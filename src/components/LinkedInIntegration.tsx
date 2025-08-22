'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { useToast } from '@/components/Toast'

interface LinkedInProfile {
  name: string
  email?: string
  profilePicture?: string
}

interface LinkedInIntegrationData {
  isConnected: boolean
  profile: LinkedInProfile | null
  connectedAt?: string
  lastUsed?: string
  expiresAt?: string
}

interface LinkedInIntegrationProps {
  onConnectionChange?: (isConnected: boolean) => void
}

export const LinkedInIntegration: React.FC<LinkedInIntegrationProps> = ({
  onConnectionChange
}) => {
  const [integrationData, setIntegrationData] = useState<LinkedInIntegrationData>({
    isConnected: false,
    profile: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadLinkedInStatus()
  }, [])

  const loadLinkedInStatus = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) return

      const response = await fetch('/api/linkedin/share', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setIntegrationData(result.data)
          onConnectionChange?.(result.data.isConnected)
        }
      }
    } catch (error) {
      console.error('Failed to load LinkedIn status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const connectLinkedIn = async () => {
    try {
      setIsConnecting(true)
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        showToast('Please log in to connect LinkedIn', 'error')
        return
      }

      // Get LinkedIn OAuth URL
      const response = await fetch('/api/auth/linkedin', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get LinkedIn OAuth URL')
      }

      const result = await response.json()
      if (result.success && result.data.authUrl) {
        // Redirect to LinkedIn OAuth
        window.location.href = result.data.authUrl
      } else {
        throw new Error(result.error || 'Failed to initiate LinkedIn OAuth')
      }
    } catch (error) {
      console.error('LinkedIn connection error:', error)
      showToast('Failed to connect LinkedIn. Please try again.', 'error')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectLinkedIn = async () => {
    try {
      setIsDisconnecting(true)
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) return

      const response = await fetch('/api/auth/linkedin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disconnect' }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setIntegrationData({
            isConnected: false,
            profile: null
          })
          onConnectionChange?.(false)
          showToast('LinkedIn account disconnected successfully', 'success')
        } else {
          throw new Error(result.error || 'Failed to disconnect LinkedIn')
        }
      } else {
        throw new Error('Failed to disconnect LinkedIn')
      }
    } catch (error) {
      console.error('LinkedIn disconnection error:', error)
      showToast('Failed to disconnect LinkedIn. Please try again.', 'error')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const testConnection = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) return

      const response = await fetch('/api/auth/linkedin/callback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'validate' }),
      })

      const result = await response.json()
      if (result.success) {
        showToast('LinkedIn connection is working correctly', 'success')
        await loadLinkedInStatus() // Refresh status
      } else {
        showToast(result.error || 'LinkedIn connection test failed', 'error')
        if (response.status === 401) {
          // Token expired, update status
          setIntegrationData(prev => ({ ...prev, isConnected: false }))
          onConnectionChange?.(false)
        }
      }
    } catch (error) {
      console.error('LinkedIn connection test error:', error)
      showToast('Failed to test LinkedIn connection', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6" data-testid="linkedin-integration">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6" data-testid="linkedin-integration">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">LinkedIn Integration</h3>
            <p className="text-sm text-gray-600">
              Connect your LinkedIn account to share portfolio updates
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            integrationData.isConnected ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <span className={`text-sm font-medium ${
            integrationData.isConnected ? 'text-green-700' : 'text-gray-500'
          }`}>
            {integrationData.isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>

      {integrationData.isConnected && integrationData.profile ? (
        <div className="mb-6">
          <div className="flex items-center p-4 bg-blue-50 rounded-lg">
            {integrationData.profile.profilePicture ? (
              <img
                src={integrationData.profile.profilePicture}
                alt="LinkedIn Profile"
                className="w-12 h-12 rounded-full mr-4"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{integrationData.profile.name}</p>
              {integrationData.profile.email && (
                <p className="text-sm text-gray-600">{integrationData.profile.email}</p>
              )}
              {integrationData.connectedAt && (
                <p className="text-xs text-gray-500">
                  Connected on {new Date(integrationData.connectedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {integrationData.lastUsed && (
            <p className="text-xs text-gray-500 mt-2">
              Last used: {new Date(integrationData.lastUsed).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Connect your LinkedIn account to automatically share portfolio updates, new projects, and blog posts to your professional network.
          </p>
          <ul className="mt-3 text-sm text-gray-600 space-y-1">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Share portfolio updates automatically
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Promote new projects and achievements
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Increase professional visibility
            </li>
          </ul>
        </div>
      )}

      <div className="flex items-center space-x-3">
        {integrationData.isConnected ? (
          <>
            <Button
              onClick={testConnection}
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
              data-testid="test-connection-button"
            >
              Test Connection
            </Button>
            <Button
              onClick={disconnectLinkedIn}
              loading={isDisconnecting}
              disabled={isDisconnecting}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              data-testid="disconnect-button"
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </>
        ) : (
          <Button
            onClick={connectLinkedIn}
            loading={isConnecting}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="connect-button"
          >
            {isConnecting ? 'Connecting...' : 'Connect LinkedIn'}
          </Button>
        )}
      </div>

      {integrationData.isConnected && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                LinkedIn Token Information
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                LinkedIn access tokens expire after 60 days. You'll need to reconnect your account when it expires.
                {integrationData.expiresAt && (
                  <span className="block mt-1">
                    Current token expires: {new Date(integrationData.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Offline Page
 * Displayed when the user is offline and the requested page is not cached
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { useNetworkStatus } from '@/hooks/usePWA'

export default function OfflinePage() {
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const network = useNetworkStatus()

  useEffect(() => {
    // Automatically retry when coming back online
    if (network.isOnline && lastAttempt) {
      const timeSinceLastAttempt = Date.now() - lastAttempt.getTime()
      // Only auto-retry if it's been more than 5 seconds since last attempt
      if (timeSinceLastAttempt > 5000) {
        handleRetry()
      }
    }
  }, [network.isOnline, lastAttempt])

  const handleRetry = () => {
    setLastAttempt(new Date())
    setRetryCount(prev => prev + 1)
    
    // Try to go back to the previous page
    if (window.history.length > 1) {
      window.history.back()
    } else {
      // Fallback to home page
      window.location.href = '/'
    }
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* Offline Icon */}
          <div className="mx-auto h-24 w-24 text-6xl mb-6">
            {network.isOnline ? '🔄' : '📡'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {network.isOnline ? 'Reconnecting...' : 'You\'re Offline'}
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            {network.isOnline 
              ? 'Your connection has been restored. Attempting to reload...'
              : 'It looks like you\'re not connected to the internet. Check your connection and try again.'
            }
          </p>
        </div>

        {/* Network Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Connection Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                network.isOnline 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-1 ${
                  network.isOnline ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                {network.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {network.effectiveType && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection Type</span>
                <span className="text-sm font-medium text-gray-900">
                  {network.effectiveType.toUpperCase()}
                </span>
              </div>
            )}
            
            {network.downlink && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Speed</span>
                <span className="text-sm font-medium text-gray-900">
                  {network.downlink} Mbps
                </span>
              </div>
            )}
            
            {retryCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Retry Attempts</span>
                <span className="text-sm font-medium text-gray-900">
                  {retryCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleRetry}
            disabled={!network.isOnline}
            className={`w-full ${
              network.isOnline 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            data-testid="retry-button"
          >
            {network.isOnline ? '🔄 Retry' : '⏳ Waiting for Connection'}
          </Button>
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
              data-testid="home-button"
            >
              🏠 Go Home
            </Button>
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
              data-testid="refresh-button"
            >
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 While you wait:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Try moving to an area with better signal</li>
            <li>• Some content may be available offline</li>
            <li>• Your changes will sync when you reconnect</li>
          </ul>
        </div>

        {/* PWA Features */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">📱 App Features:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Offline Browsing
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Auto Sync
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Background Updates
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Push Notifications
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Portfolio CMS • Progressive Web App
          </p>
          <p className="text-xs text-gray-400 mt-1">
            This page works offline thanks to service worker caching
          </p>
        </div>
      </div>
    </div>
  )
}

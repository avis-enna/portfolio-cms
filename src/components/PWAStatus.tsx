'use client'

import React, { useState } from 'react'
import { Button } from '@/components/Button'
import { useToast } from '@/components/Toast'
import { usePWA } from '@/hooks/usePWA'

interface PWAStatusProps {
  className?: string
  vapidPublicKey?: string
}

export const PWAStatus: React.FC<PWAStatusProps> = ({
  className = '',
  vapidPublicKey
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { showToast } = useToast()
  
  const {
    install,
    serviceWorker,
    notifications,
    network,
    backgroundSync,
    webShare,
    capabilities,
    offlineSync
  } = usePWA(vapidPublicKey)

  const handleInstall = async () => {
    const success = await install.install()
    if (success) {
      showToast('App installed successfully!', 'success')
    } else {
      showToast('Installation failed or was cancelled', 'error')
    }
  }

  const handleUpdate = async () => {
    await serviceWorker.updateApp()
    showToast('App updated! Please refresh the page.', 'success')
  }

  const handleNotificationPermission = async () => {
    const permission = await notifications.requestPermission()
    if (permission === 'granted') {
      showToast('Notification permission granted!', 'success')
    } else {
      showToast('Notification permission denied', 'error')
    }
  }

  const handlePushSubscription = async () => {
    if (notifications.subscription) {
      const success = await notifications.unsubscribe()
      if (success) {
        showToast('Unsubscribed from push notifications', 'success')
      }
    } else {
      const subscription = await notifications.subscribe()
      if (subscription) {
        showToast('Subscribed to push notifications!', 'success')
        // Send subscription to server
        try {
          const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
          })
          if (!response.ok) {
            throw new Error('Failed to save subscription')
          }
        } catch (error) {
          console.error('Failed to save push subscription:', error)
        }
      } else {
        showToast('Failed to subscribe to push notifications', 'error')
      }
    }
  }

  const handleTestNotification = async () => {
    try {
      await notifications.showNotification({
        title: 'Portfolio CMS',
        body: 'This is a test notification!',
        icon: '/icons/icon-192x192.png',
        actions: [
          { action: 'view', title: 'View' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      })
      showToast('Test notification sent!', 'success')
    } catch (error) {
      showToast('Failed to send test notification', 'error')
    }
  }

  const handleShare = async () => {
    const success = await webShare.share({
      title: 'Portfolio CMS',
      text: 'Check out this amazing portfolio management system!',
      url: window.location.origin
    })
    
    if (success) {
      showToast('Shared successfully!', 'success')
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? '✅' : '❌'
  }

  const getNetworkIcon = () => {
    if (!network.isOnline) return '🔴'
    if (network.effectiveType === '4g') return '🟢'
    if (network.effectiveType === '3g') return '🟡'
    return '🟠'
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`} data-testid="pwa-status">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📱</span>
          <div>
            <h3 className="text-lg font-medium text-gray-900">PWA Status</h3>
            <p className="text-sm text-gray-600">Progressive Web App features</p>
          </div>
        </div>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="outline"
          size="sm"
          className="text-gray-600 border-gray-300 hover:bg-gray-50"
          data-testid="toggle-details"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl mb-1">
            {capabilities.isInstalled ? '📱' : capabilities.isInstallable ? '⬇️' : '❌'}
          </div>
          <p className="text-sm font-medium text-gray-900">
            {capabilities.isInstalled ? 'Installed' : capabilities.isInstallable ? 'Installable' : 'Not Available'}
          </p>
          <p className="text-xs text-gray-500">App Status</p>
        </div>

        <div className="text-center">
          <div className="text-2xl mb-1">{getNetworkIcon()}</div>
          <p className="text-sm font-medium text-gray-900">
            {network.isOnline ? 'Online' : 'Offline'}
          </p>
          <p className="text-xs text-gray-500">
            {network.effectiveType ? network.effectiveType.toUpperCase() : 'Network'}
          </p>
        </div>

        <div className="text-center">
          <div className="text-2xl mb-1">
            {notifications.permission === 'granted' ? '🔔' : '🔕'}
          </div>
          <p className="text-sm font-medium text-gray-900">
            {notifications.permission === 'granted' ? 'Enabled' : 'Disabled'}
          </p>
          <p className="text-xs text-gray-500">Notifications</p>
        </div>

        <div className="text-center">
          <div className="text-2xl mb-1">
            {offlineSync.hasPendingSync ? '⏳' : '✅'}
          </div>
          <p className="text-sm font-medium text-gray-900">
            {offlineSync.hasPendingSync ? 'Pending' : 'Synced'}
          </p>
          <p className="text-xs text-gray-500">
            {offlineSync.pendingSync.length} items
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {capabilities.isInstallable && !capabilities.isInstalled && (
          <Button
            onClick={handleInstall}
            loading={install.isInstalling}
            disabled={install.isInstalling}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="install-button"
          >
            📱 Install App
          </Button>
        )}

        {serviceWorker.isUpdateAvailable && (
          <Button
            onClick={handleUpdate}
            loading={serviceWorker.isUpdating}
            disabled={serviceWorker.isUpdating}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="update-button"
          >
            🔄 Update Available
          </Button>
        )}

        {notifications.isSupported && notifications.permission !== 'granted' && (
          <Button
            onClick={handleNotificationPermission}
            variant="outline"
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
            data-testid="enable-notifications"
          >
            🔔 Enable Notifications
          </Button>
        )}

        {notifications.permission === 'granted' && (
          <Button
            onClick={handleTestNotification}
            variant="outline"
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
            data-testid="test-notification"
          >
            🧪 Test Notification
          </Button>
        )}

        {webShare.isSupported && (
          <Button
            onClick={handleShare}
            variant="outline"
            className="text-green-600 border-green-300 hover:bg-green-50"
            data-testid="share-button"
          >
            📤 Share App
          </Button>
        )}
      </div>

      {/* Detailed Status */}
      {isExpanded && (
        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Detailed Status</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PWA Features */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">PWA Features</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Service Worker</span>
                  <span>{getStatusIcon(capabilities.hasServiceWorker)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Installable</span>
                  <span>{getStatusIcon(capabilities.isInstallable)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Standalone Mode</span>
                  <span>{getStatusIcon(capabilities.isStandalone)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Background Sync</span>
                  <span>{getStatusIcon(backgroundSync.isSupported)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Web Share</span>
                  <span>{getStatusIcon(webShare.isSupported)}</span>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Notifications</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Permission</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    notifications.permission === 'granted' 
                      ? 'bg-green-100 text-green-800'
                      : notifications.permission === 'denied'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {notifications.permission}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Push Support</span>
                  <span>{getStatusIcon(capabilities.hasPushSupport)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Push Subscription</span>
                  <span>{getStatusIcon(!!notifications.subscription)}</span>
                </div>
                {notifications.subscription && (
                  <div className="mt-2">
                    <Button
                      onClick={handlePushSubscription}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      data-testid="unsubscribe-push"
                    >
                      Unsubscribe
                    </Button>
                  </div>
                )}
                {!notifications.subscription && notifications.permission === 'granted' && (
                  <div className="mt-2">
                    <Button
                      onClick={handlePushSubscription}
                      loading={notifications.isSubscribing}
                      disabled={notifications.isSubscribing}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      data-testid="subscribe-push"
                    >
                      Subscribe to Push
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Network Information */}
          {network.effectiveType && (
            <div className="mt-6">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Network Information</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 font-medium ${network.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {network.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">{network.effectiveType?.toUpperCase()}</span>
                </div>
                {network.downlink && (
                  <div>
                    <span className="text-gray-600">Speed:</span>
                    <span className="ml-2 font-medium">{network.downlink} Mbps</span>
                  </div>
                )}
                {network.rtt && (
                  <div>
                    <span className="text-gray-600">Latency:</span>
                    <span className="ml-2 font-medium">{network.rtt} ms</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Offline Sync Status */}
          {offlineSync.hasPendingSync && (
            <div className="mt-6">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Pending Sync Items</h5>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  {offlineSync.pendingSync.length} items waiting to sync when online
                </p>
                <div className="mt-2 space-y-1">
                  {offlineSync.pendingSync.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-xs text-yellow-700">
                      • {item}
                    </div>
                  ))}
                  {offlineSync.pendingSync.length > 3 && (
                    <div className="text-xs text-yellow-700">
                      • ... and {offlineSync.pendingSync.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

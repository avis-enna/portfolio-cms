/**
 * PWA React Hooks
 * Custom hooks for Progressive Web App functionality
 */

import { useState, useEffect, useCallback } from 'react'
import {
  registerServiceWorker,
  updateServiceWorker,
  getPWACapabilities,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  registerBackgroundSync,
  checkForUpdates,
  getInstallationStatus,
  shareContent,
  getNetworkStatus,
  promptInstall,
  PWAInstallPrompt,
  PWACapabilities,
  NotificationOptions
} from '@/lib/pwa/pwa-utils'

/**
 * Hook for managing PWA installation
 */
export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    const status = getInstallationStatus()
    setIsInstalled(status === 'installed')
    setIsInstallable(status === 'installable')

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as any)
      setIsInstallable(true)
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!installPrompt) return false

    setIsInstalling(true)
    try {
      const accepted = await promptInstall(installPrompt)
      if (accepted) {
        setIsInstalled(true)
        setIsInstallable(false)
        setInstallPrompt(null)
      }
      return accepted
    } catch (error) {
      console.error('Installation failed:', error)
      return false
    } finally {
      setIsInstalling(false)
    }
  }, [installPrompt])

  return {
    isInstallable,
    isInstalled,
    isInstalling,
    install
  }
}

/**
 * Hook for managing service worker
 */
export const useServiceWorker = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const initServiceWorker = async () => {
      const reg = await registerServiceWorker()
      setRegistration(reg)
    }

    initServiceWorker()

    // Listen for service worker updates
    const handleUpdateAvailable = (event: CustomEvent) => {
      setIsUpdateAvailable(true)
      setRegistration(event.detail.registration)
    }

    window.addEventListener('sw-update-available', handleUpdateAvailable as EventListener)

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable as EventListener)
    }
  }, [])

  const updateApp = useCallback(async () => {
    if (!registration) return

    setIsUpdating(true)
    try {
      updateServiceWorker(registration)
    } finally {
      setIsUpdating(false)
    }
  }, [registration])

  const checkUpdates = useCallback(async () => {
    const hasUpdate = await checkForUpdates()
    setIsUpdateAvailable(hasUpdate)
    return hasUpdate
  }, [])

  return {
    registration,
    isUpdateAvailable,
    isUpdating,
    updateApp,
    checkUpdates
  }
}

/**
 * Hook for managing push notifications
 */
export const usePushNotifications = (vapidPublicKey?: string) => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Check existing subscription
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          const existingSubscription = await registration.pushManager.getSubscription()
          setSubscription(existingSubscription)
        } catch (error) {
          console.error('Failed to check push subscription:', error)
        }
      }
    }

    checkSubscription()
  }, [])

  const requestPermission = useCallback(async () => {
    const newPermission = await requestNotificationPermission()
    setPermission(newPermission)
    return newPermission
  }, [])

  const subscribe = useCallback(async () => {
    if (!vapidPublicKey) {
      console.error('VAPID public key is required for push subscription')
      return null
    }

    setIsSubscribing(true)
    try {
      const newSubscription = await subscribeToPush(vapidPublicKey)
      setSubscription(newSubscription)
      return newSubscription
    } finally {
      setIsSubscribing(false)
    }
  }, [vapidPublicKey])

  const unsubscribe = useCallback(async () => {
    const success = await unsubscribeFromPush()
    if (success) {
      setSubscription(null)
    }
    return success
  }, [])

  const showNotification = useCallback(async (options: NotificationOptions) => {
    if (permission !== 'granted') {
      const newPermission = await requestPermission()
      if (newPermission !== 'granted') {
        throw new Error('Notification permission not granted')
      }
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        vibrate: options.vibrate || [100, 50, 100],
        data: options.data,
        actions: options.actions,
        tag: options.tag
      })
    }
  }, [permission, requestPermission])

  return {
    permission,
    subscription,
    isSubscribing,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  }
}

/**
 * Hook for managing network status
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState(getNetworkStatus())

  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(getNetworkStatus())
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    // Listen for connection changes
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [])

  return networkStatus
}

/**
 * Hook for managing background sync
 */
export const useBackgroundSync = () => {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported(
      'serviceWorker' in navigator && 
      'sync' in window.ServiceWorkerRegistration.prototype
    )
  }, [])

  const registerSync = useCallback(async (tag: string) => {
    if (!isSupported) {
      console.warn('Background sync is not supported')
      return false
    }

    try {
      await registerBackgroundSync(tag)
      return true
    } catch (error) {
      console.error('Failed to register background sync:', error)
      return false
    }
  }, [isSupported])

  return {
    isSupported,
    registerSync
  }
}

/**
 * Hook for Web Share API
 */
export const useWebShare = () => {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported('share' in navigator)
  }, [])

  const share = useCallback(async (data: {
    title?: string
    text?: string
    url?: string
    files?: File[]
  }) => {
    if (!isSupported) {
      console.warn('Web Share API is not supported')
      return false
    }

    return await shareContent(data)
  }, [isSupported])

  return {
    isSupported,
    share
  }
}

/**
 * Hook for PWA capabilities
 */
export const usePWACapabilities = () => {
  const [capabilities, setCapabilities] = useState<PWACapabilities>(getPWACapabilities())

  useEffect(() => {
    const updateCapabilities = () => {
      setCapabilities(getPWACapabilities())
    }

    // Update capabilities when network status changes
    window.addEventListener('online', updateCapabilities)
    window.addEventListener('offline', updateCapabilities)

    // Update when service worker is ready
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(updateCapabilities)
    }

    return () => {
      window.removeEventListener('online', updateCapabilities)
      window.removeEventListener('offline', updateCapabilities)
    }
  }, [])

  return capabilities
}

/**
 * Hook for offline storage and sync
 */
export const useOfflineSync = () => {
  const [pendingSync, setPendingSync] = useState<string[]>([])
  const { registerSync } = useBackgroundSync()
  const { isOnline } = useNetworkStatus()

  const addToSyncQueue = useCallback(async (data: any, type: 'analytics' | 'content') => {
    // Store data for offline sync
    const syncId = `${type}-${Date.now()}`
    
    // In a real implementation, this would store to IndexedDB
    console.log('Adding to sync queue:', syncId, data)
    
    setPendingSync(prev => [...prev, syncId])
    
    if (isOnline) {
      // Try to sync immediately if online
      await registerSync(`background-sync-${type}`)
    }
    
    return syncId
  }, [isOnline, registerSync])

  const removeSyncItem = useCallback((syncId: string) => {
    setPendingSync(prev => prev.filter(id => id !== syncId))
  }, [])

  return {
    pendingSync,
    addToSyncQueue,
    removeSyncItem,
    hasPendingSync: pendingSync.length > 0
  }
}

/**
 * Combined PWA hook with all functionality
 */
export const usePWA = (vapidPublicKey?: string) => {
  const install = usePWAInstall()
  const serviceWorker = useServiceWorker()
  const notifications = usePushNotifications(vapidPublicKey)
  const network = useNetworkStatus()
  const backgroundSync = useBackgroundSync()
  const webShare = useWebShare()
  const capabilities = usePWACapabilities()
  const offlineSync = useOfflineSync()

  return {
    install,
    serviceWorker,
    notifications,
    network,
    backgroundSync,
    webShare,
    capabilities,
    offlineSync
  }
}

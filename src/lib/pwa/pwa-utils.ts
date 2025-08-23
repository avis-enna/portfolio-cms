/**
 * PWA Utilities
 * Helper functions for Progressive Web App functionality
 */

export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  vibrate?: number[]
  silent?: boolean
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  data?: any
  tag?: string
  renotify?: boolean
  timestamp?: number
}

export interface PWACapabilities {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  hasNotificationPermission: boolean
  hasPushSupport: boolean
  hasBackgroundSync: boolean
  hasServiceWorker: boolean
  isStandalone: boolean
}

/**
 * Check if the app is running in standalone mode (installed PWA)
 */
export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Check if the device is mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Check if the browser supports PWA features
 */
export const getPWACapabilities = (): PWACapabilities => {
  if (typeof window === 'undefined') {
    return {
      isInstallable: false,
      isInstalled: false,
      isOnline: false,
      hasNotificationPermission: false,
      hasPushSupport: false,
      hasBackgroundSync: false,
      hasServiceWorker: false,
      isStandalone: false
    }
  }

  return {
    isInstallable: 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window,
    isInstalled: isStandalone(),
    isOnline: navigator.onLine,
    hasNotificationPermission: 'Notification' in window && Notification.permission === 'granted',
    hasPushSupport: 'serviceWorker' in navigator && 'PushManager' in window,
    hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    hasServiceWorker: 'serviceWorker' in navigator,
    isStandalone: isStandalone()
  }
}

/**
 * Register service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('Service Worker registered successfully:', registration)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            window.dispatchEvent(new CustomEvent('sw-update-available', {
              detail: { registration }
            }))
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

/**
 * Update service worker
 */
export const updateServiceWorker = (registration: ServiceWorkerRegistration): void => {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }
}

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Notifications are not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Show local notification
 */
export const showNotification = async (options: NotificationOptions): Promise<void> => {
  const permission = await requestNotificationPermission()
  
  if (permission !== 'granted') {
    console.warn('Notification permission not granted')
    return
  }

  const registration = await navigator.serviceWorker.ready
  
  await registration.showNotification(options.title, {
    body: options.body,
    icon: options.icon || '/icons/icon-192x192.png',
    badge: options.badge || '/icons/badge-72x72.png',
    image: options.image,
    vibrate: options.vibrate || [100, 50, 100],
    silent: options.silent || false,
    requireInteraction: options.requireInteraction || false,
    actions: options.actions || [],
    data: options.data,
    tag: options.tag,
    renotify: options.renotify || false,
    timestamp: options.timestamp || Date.now()
  })
}

/**
 * Subscribe to push notifications
 */
export const subscribeToPush = async (vapidPublicKey: string): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    })

    console.log('Push subscription successful:', subscription)
    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      const successful = await subscription.unsubscribe()
      console.log('Push unsubscription successful:', successful)
      return successful
    }
    
    return true
  } catch (error) {
    console.error('Push unsubscription failed:', error)
    return false
  }
}

/**
 * Register background sync
 */
export const registerBackgroundSync = async (tag: string): Promise<void> => {
  if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
    console.warn('Background sync is not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register(tag)
    console.log('Background sync registered:', tag)
  } catch (error) {
    console.error('Background sync registration failed:', error)
  }
}

/**
 * Cache URLs for offline access
 */
export const cacheUrls = async (urls: string[]): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    if (registration.active) {
      registration.active.postMessage({
        type: 'CACHE_URLS',
        payload: urls
      })
    }
  } catch (error) {
    console.error('Failed to cache URLs:', error)
  }
}

/**
 * Clear cache
 */
export const clearCache = async (cacheName?: string): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    if (registration.active) {
      registration.active.postMessage({
        type: 'CLEAR_CACHE',
        payload: cacheName
      })
    }
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

/**
 * Check if app update is available
 */
export const checkForUpdates = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    
    if (registration) {
      await registration.update()
      return !!registration.waiting
    }
    
    return false
  } catch (error) {
    console.error('Failed to check for updates:', error)
    return false
  }
}

/**
 * Get app installation status
 */
export const getInstallationStatus = (): 'installed' | 'installable' | 'not-installable' => {
  if (isStandalone()) {
    return 'installed'
  }
  
  if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
    return 'installable'
  }
  
  return 'not-installable'
}

/**
 * Share content using Web Share API
 */
export const shareContent = async (data: {
  title?: string
  text?: string
  url?: string
  files?: File[]
}): Promise<boolean> => {
  if (!('share' in navigator)) {
    console.warn('Web Share API is not supported')
    return false
  }

  try {
    await navigator.share(data)
    return true
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error)
    }
    return false
  }
}

/**
 * Detect network status
 */
export const getNetworkStatus = (): {
  isOnline: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
} => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection

  return {
    isOnline: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt
  }
}

/**
 * Add to home screen prompt
 */
export const promptInstall = async (deferredPrompt: PWAInstallPrompt): Promise<boolean> => {
  if (!deferredPrompt) {
    console.warn('No install prompt available')
    return false
  }

  try {
    await deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice
    
    return choiceResult.outcome === 'accepted'
  } catch (error) {
    console.error('Install prompt failed:', error)
    return false
  }
}

/**
 * Utility function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}

/**
 * Store data for offline sync
 */
export const storeForOfflineSync = async (data: any, type: 'analytics' | 'content'): Promise<void> => {
  // Implementation would use IndexedDB to store data for later sync
  console.log('Storing for offline sync:', type, data)
}

/**
 * Get stored offline data
 */
export const getStoredOfflineData = async (type: 'analytics' | 'content'): Promise<any[]> => {
  // Implementation would retrieve data from IndexedDB
  console.log('Getting stored offline data:', type)
  return []
}

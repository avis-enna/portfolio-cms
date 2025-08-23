/**
 * Service Worker for Portfolio CMS PWA
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = 'portfolio-cms-v1.0.0'
const STATIC_CACHE = 'portfolio-static-v1.0.0'
const DYNAMIC_CACHE = 'portfolio-dynamic-v1.0.0'
const API_CACHE = 'portfolio-api-v1.0.0'

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/admin',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical assets
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/portfolio',
  '/api/blog/posts',
  '/api/analytics/dashboard'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(API_CACHE).then((cache) => {
        console.log('Service Worker: Preparing API cache')
        return Promise.resolve()
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete')
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activation complete')
      return self.clients.claim()
    })
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with cache fallback
    event.respondWith(handleAPIRequest(request))
  } else if (isStaticAsset(url.pathname)) {
    // Static assets - Cache First
    event.respondWith(handleStaticAsset(request))
  } else {
    // Pages - Stale While Revalidate
    event.respondWith(handlePageRequest(request))
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync-analytics') {
    event.waitUntil(syncAnalyticsData())
  } else if (event.tag === 'background-sync-content') {
    event.waitUntil(syncContentUpdates())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: 'You have new updates in your portfolio!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Updates',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }

  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.data = { ...options.data, ...data }
  }

  event.waitUntil(
    self.registration.showNotification('Portfolio CMS', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/admin')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
  }
})

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.payload)
    )
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      clearCache(event.data.payload)
    )
  }
})

/**
 * Handle API requests with Network First strategy
 */
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for:', request.url)
    
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for critical API failures
    if (request.url.includes('/api/portfolio') || request.url.includes('/api/blog')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Offline - cached data not available',
          offline: true 
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    throw error
  }
}

/**
 * Handle static assets with Cache First strategy
 */
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset:', request.url)
    throw error
  }
}

/**
 * Handle page requests with Stale While Revalidate strategy
 */
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => {
    // Network failed, return offline page if no cache
    if (!cachedResponse) {
      return caches.match('/offline')
    }
  })
  
  // Return cached version immediately if available
  return cachedResponse || networkResponsePromise
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  return pathname.startsWith('/_next/') ||
         pathname.startsWith('/icons/') ||
         pathname.startsWith('/images/') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.ico')
}

/**
 * Sync analytics data when back online
 */
async function syncAnalyticsData() {
  try {
    console.log('Service Worker: Syncing analytics data...')
    
    // Get stored analytics events from IndexedDB
    const events = await getStoredAnalyticsEvents()
    
    if (events.length > 0) {
      const response = await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      })
      
      if (response.ok) {
        await clearStoredAnalyticsEvents()
        console.log('Service Worker: Analytics data synced successfully')
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync analytics data:', error)
    throw error
  }
}

/**
 * Sync content updates when back online
 */
async function syncContentUpdates() {
  try {
    console.log('Service Worker: Syncing content updates...')
    
    // Get stored content updates from IndexedDB
    const updates = await getStoredContentUpdates()
    
    for (const update of updates) {
      try {
        const response = await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: update.body
        })
        
        if (response.ok) {
          await removeStoredContentUpdate(update.id)
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync content update:', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync content updates:', error)
    throw error
  }
}

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE)
  return Promise.all(
    urls.map(url => 
      fetch(url).then(response => {
        if (response.ok) {
          return cache.put(url, response)
        }
      }).catch(error => {
        console.log('Service Worker: Failed to cache URL:', url, error)
      })
    )
  )
}

/**
 * Clear specific cache
 */
async function clearCache(cacheName) {
  if (cacheName) {
    return caches.delete(cacheName)
  } else {
    // Clear all caches
    const cacheNames = await caches.keys()
    return Promise.all(cacheNames.map(name => caches.delete(name)))
  }
}

/**
 * IndexedDB helpers for offline storage
 */
async function getStoredAnalyticsEvents() {
  // Implementation would use IndexedDB to retrieve stored events
  return []
}

async function clearStoredAnalyticsEvents() {
  // Implementation would clear stored events from IndexedDB
}

async function getStoredContentUpdates() {
  // Implementation would use IndexedDB to retrieve stored updates
  return []
}

async function removeStoredContentUpdate(id) {
  // Implementation would remove specific update from IndexedDB
}

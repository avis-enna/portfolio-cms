/**
 * Jest Environment Setup
 * Sets up environment variables for testing
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://localhost:27017/portfolio-cms-test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.OPENAI_API_KEY = 'sk-test-key'
process.env.NEXT_PUBLIC_APP_NAME = 'Portfolio CMS Test'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_ENABLE_AI = 'true'
process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'true'
process.env.NEXT_PUBLIC_ENABLE_PWA = 'true'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters'

// Mock fetch globally
const fetchMock = require('jest-fetch-mock')
fetchMock.enableMocks()
global.fetch = fetchMock

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock window.location
if (!window.location || typeof window.location.assign !== 'function') {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
    writable: true,
    configurable: true
  })
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock crypto for Node.js environment
const crypto = require('crypto')
Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: arr => crypto.randomBytes(arr.length)
  }
})

// Mock PWA APIs
global.navigator = {
  ...global.navigator,
  serviceWorker: {
    register: jest.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: {
        postMessage: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'https://test-endpoint.com',
          keys: {
            p256dh: 'test-p256dh',
            auth: 'test-auth'
          }
        }),
        getSubscription: jest.fn().mockResolvedValue(null)
      }
    }),
    ready: Promise.resolve({
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'https://test-endpoint.com',
          keys: {
            p256dh: 'test-p256dh',
            auth: 'test-auth'
          }
        }),
        getSubscription: jest.fn().mockResolvedValue(null)
      }
    })
  },
  share: jest.fn().mockResolvedValue(undefined)
}

// Mock ServiceWorkerRegistration
global.ServiceWorkerRegistration = {
  prototype: {
    sync: true
  }
}

// Mock Notification API
global.Notification = {
  permission: 'default',
  requestPermission: jest.fn().mockResolvedValue('granted')
}

// Mock PushManager
global.PushManager = jest.fn()

// Mock window properties for PWA
Object.defineProperty(window, 'navigator', {
  value: global.navigator,
  writable: true,
  configurable: true
})

// Suppress console warnings in tests
const originalWarn = console.warn
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is deprecated')
  ) {
    return
  }
  originalWarn.call(console, ...args)
}

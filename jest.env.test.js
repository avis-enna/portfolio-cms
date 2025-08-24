/**
 * Test Environment Setup
 * Configures environment variables and global mocks specifically for testing
 */

const path = require('path')
const dotenv = require('dotenv')

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

// Ensure we're in test mode
process.env.NODE_ENV = 'test'

// Test Database Configuration
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio-cms-test'
process.env.MONGODB_TEST_DB_NAME = 'portfolio-cms-test'

// Test Authentication Secrets
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-for-testing-only'
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-for-testing-only'
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-characters'

// Test API Keys (Mock values)
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-key-for-testing-only'
process.env.LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || 'test-linkedin-client-id'
process.env.LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || 'test-linkedin-client-secret'

// Test Application Configuration
process.env.NEXT_PUBLIC_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Portfolio CMS Test'
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Test Feature Flags
process.env.NEXT_PUBLIC_ENABLE_AI = process.env.NEXT_PUBLIC_ENABLE_AI || 'true'
process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || 'false'
process.env.NEXT_PUBLIC_ENABLE_PWA = process.env.NEXT_PUBLIC_ENABLE_PWA || 'false'
process.env.NEXT_PUBLIC_ENABLE_LINKEDIN = process.env.NEXT_PUBLIC_ENABLE_LINKEDIN || 'false'
process.env.NEXT_PUBLIC_ENABLE_BLOG = process.env.NEXT_PUBLIC_ENABLE_BLOG || 'true'
process.env.NEXT_PUBLIC_ENABLE_CONTACT = process.env.NEXT_PUBLIC_ENABLE_CONTACT || 'true'

// Test Rate Limiting (More permissive)
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '60000'
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '1000'

// Test Logging Configuration
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error'
process.env.DEBUG_MODE = process.env.DEBUG_MODE || 'true'

// Mock fetch globally with jest-fetch-mock
const fetchMock = require('jest-fetch-mock')
fetchMock.enableMocks()
global.fetch = fetchMock

// Enhanced fetch mock with better error handling
global.fetch.mockResponse = (response, options = {}) => {
  const { status = 200, headers = {}, ok = status >= 200 && status < 300 } = options
  
  return Promise.resolve({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: () => Promise.resolve(typeof response === 'string' ? JSON.parse(response) : response),
    text: () => Promise.resolve(typeof response === 'string' ? response : JSON.stringify(response)),
    blob: () => Promise.resolve(new Blob([typeof response === 'string' ? response : JSON.stringify(response)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })
}

// Mock localStorage with enhanced functionality
const createStorageMock = () => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index) => Object.keys(store)[index] || null),
  }
}

global.localStorage = createStorageMock()
global.sessionStorage = createStorageMock()

// Mock window.location with enhanced functionality
const mockLocation = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  toString: () => 'http://localhost:3000',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
  configurable: true
})

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
  constructor(callback, options) {
    this.callback = callback
    this.options = options
  }
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
  constructor(callback) {
    this.callback = callback
  }
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
if (typeof global.self === 'undefined') {
  global.self = global
}

Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: arr => crypto.randomBytes(arr.length),
    randomUUID: () => crypto.randomUUID(),
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
    }
  }
})

// Mock File and FileReader
global.File = class File {
  constructor(chunks, filename, options = {}) {
    this.chunks = chunks
    this.name = filename
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    this.type = options.type || ''
    this.lastModified = options.lastModified || Date.now()
  }
}

global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0
    this.result = null
    this.error = null
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2
      this.result = `data:${file.type};base64,dGVzdA==`
      if (this.onload) this.onload({ target: this })
    }, 0)
  }
  
  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2
      this.result = 'test content'
      if (this.onload) this.onload({ target: this })
    }, 0)
  }
}

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost:3000/test')
global.URL.revokeObjectURL = jest.fn()

// Mock console methods for cleaner test output
const originalConsole = { ...console }
console.warn = jest.fn()
console.error = jest.fn()
console.info = jest.fn()
console.debug = jest.fn()

// Restore console for specific test debugging
global.restoreConsole = () => {
  Object.assign(console, originalConsole)
}

// Mock timers
jest.useFakeTimers()

// Global test utilities
global.testUtils = {
  mockFetch: fetchMock,
  mockLocation,
  createStorageMock,
  restoreConsole: global.restoreConsole,
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),
  waitFor: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const check = () => {
        if (condition()) {
          resolve()
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'))
        } else {
          setTimeout(check, 10)
        }
      }
      check()
    })
  }
}

// Suppress specific warnings
const originalWarn = console.warn
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
     args[0].includes('Warning: React.createFactory is deprecated') ||
     args[0].includes('Warning: componentWillReceiveProps has been renamed'))
  ) {
    return
  }
  originalWarn.call(console, ...args)
}

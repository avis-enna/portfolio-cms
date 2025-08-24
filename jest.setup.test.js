/**
 * Jest Test Setup
 * Configures testing environment and global test utilities
 */

import '@testing-library/jest-dom'
import 'jest-fetch-mock'

// Configure testing library
import { configure } from '@testing-library/react'
import { configure as configureDOM } from '@testing-library/dom'

// Configure testing library with better defaults for testing
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
})

configureDOM({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
})

// Mock Next.js modules
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: true,
    isReady: true,
    defaultLocale: 'en',
    domainLocales: [],
    isPreview: false,
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/',
  useParams: () => ({}),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }) => {
    return <>{children}</>
  },
}))

// Mock Mongoose with better type support
jest.mock('mongoose', () => {
  const mockModel = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    findOneAndDelete: jest.fn().mockReturnThis(),
    create: jest.fn().mockReturnThis(),
    save: jest.fn().mockReturnThis(),
    updateOne: jest.fn().mockReturnThis(),
    updateMany: jest.fn().mockReturnThis(),
    deleteOne: jest.fn().mockReturnThis(),
    deleteMany: jest.fn().mockReturnThis(),
    countDocuments: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    aggregate: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    then: jest.fn(),
    catch: jest.fn(),
  }

  const mockSchema = jest.fn(() => mockModel)
  mockSchema.Types = {
    ObjectId: jest.fn((id) => id || '507f1f77bcf86cd799439011'),
  }

  return {
    __esModule: true,
    default: {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      connection: {
        readyState: 1,
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn(),
        db: {
          dropDatabase: jest.fn().mockResolvedValue(undefined),
        },
      },
      model: jest.fn(() => mockModel),
      Schema: mockSchema,
      Types: mockSchema.Types,
      set: jest.fn(),
    },
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      db: {
        dropDatabase: jest.fn().mockResolvedValue(undefined),
      },
    },
    model: jest.fn(() => mockModel),
    Schema: mockSchema,
    Types: mockSchema.Types,
    set: jest.fn(),
  }
})

// Mock database models
jest.mock('@/lib/database/models', () => ({
  User: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
  },
  PortfolioContent: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
  },
  BlogPost: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
    distinct: jest.fn(),
  },
  ContactSubmission: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
  },
  RefreshToken: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Test AI response'
              }
            }],
            usage: {
              total_tokens: 100
            }
          })
        }
      }
    }))
  }
})

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
}))

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id', role: 'admin' }),
  decode: jest.fn().mockReturnValue({ userId: 'test-user-id', role: 'admin' }),
}))

// Global test cleanup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
  
  // Reset fetch mock
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear()
  }
  
  // Clear localStorage and sessionStorage
  if (global.localStorage) {
    global.localStorage.clear()
  }
  if (global.sessionStorage) {
    global.sessionStorage.clear()
  }
  
  // Reset location mock
  if (global.testUtils && global.testUtils.mockLocation) {
    Object.assign(global.testUtils.mockLocation, {
      href: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
    })
  }
})

afterEach(() => {
  // Clean up any remaining timers
  jest.runOnlyPendingTimers()
  jest.clearAllTimers()
})

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Increase timeout for async operations
jest.setTimeout(30000)

// Mock console methods to reduce noise in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('React does not recognize') ||
       args[0].includes('validateDOMNesting'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

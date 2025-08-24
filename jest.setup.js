import '@testing-library/jest-dom'
import 'jest-fetch-mock'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
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
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    return <img {...props} />
  },
}))

// Mock MongoDB
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn().mockResolvedValue({
      db: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
          }),
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
          deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        }),
      }),
      close: jest.fn(),
    }),
  },
}))

// Mock Mongoose
const mockSchema = {
  index: jest.fn(),
  pre: jest.fn(),
  post: jest.fn(),
  methods: {},
  statics: {},
  virtual: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn()
  })
}

// Add Types to Schema
mockSchema.Types = {
  ObjectId: jest.fn().mockImplementation((id) => id || 'mock-object-id'),
  String: String,
  Number: Number,
  Date: Date,
  Boolean: Boolean,
  Array: Array
}

// Mock Schema constructor to return mockSchema with Types
const MockSchemaConstructor = jest.fn().mockImplementation(() => mockSchema)
MockSchemaConstructor.Types = {
  ObjectId: jest.fn().mockImplementation((id) => id || 'mock-object-id'),
  String: String,
  Number: Number,
  Date: Date,
  Boolean: Boolean,
  Array: Array
}

const mockModel = {
  find: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue([]),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
  }),
  findOne: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
    populate: jest.fn().mockReturnThis(),
  }),
  findById: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
    populate: jest.fn().mockReturnThis(),
  }),
  create: jest.fn().mockResolvedValue({}),
  findByIdAndUpdate: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue({}),
  }),
  findByIdAndDelete: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue({}),
  }),
  findByUsernameOrEmail: jest.fn().mockResolvedValue(null),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  countDocuments: jest.fn().mockResolvedValue(0),
  aggregate: jest.fn().mockResolvedValue([]),
}

jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  disconnect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 1,
  },
  Schema: MockSchemaConstructor,
  model: jest.fn().mockReturnValue(mockModel),
  models: {
    User: mockModel,
    BlogPost: mockModel,
    Project: mockModel,
  },
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id || 'mock-object-id')
  }
}))

// Mock OpenAI
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Test AI response',
              },
            },
          ],
        }),
      },
    },
  })),
}))

// Mock file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('{}'),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}))

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue(Buffer.from('test')),
  scryptSync: jest.fn().mockReturnValue(Buffer.from('test-key')),
  createCipher: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue('encrypted'),
    final: jest.fn().mockReturnValue('data'),
  }),
  createDecipher: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue('decrypted'),
    final: jest.fn().mockReturnValue('data'),
  }),
}))

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
  }),
  createMockProject: () => ({
    id: 'test-project-id',
    title: 'Test Project',
    description: 'Test project description',
    technologies: ['React', 'Node.js'],
  }),
  createMockBlogPost: () => ({
    id: 'test-post-id',
    title: 'Test Blog Post',
    content: 'Test blog post content',
    status: 'published',
  }),
}

// Polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = class TransformStream {
    constructor() {
      this.readable = {}
      this.writable = {}
    }
  }
}

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor() {}
  }
}

if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = class WritableStream {
    constructor() {}
  }
}

if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      // Use defineProperty to avoid setter conflicts
      Object.defineProperty(this, 'url', {
        value: input,
        writable: false,
        enumerable: true,
        configurable: true
      })

      this.method = init?.method || 'GET'
      this.headers = new Map(Object.entries(init?.headers || {}))
      this.body = init?.body
    }

    async json() {
      return JSON.parse(this.body || '{}')
    }

    async text() {
      return this.body || ''
    }
  }
}

// Mock Response.json for NextResponse
if (typeof global.Response === 'undefined' || !global.Response.json) {
  if (typeof global.Response === 'undefined') {
    global.Response = class Response {
      constructor(body, init = {}) {
        this.body = body
        this.status = init.status || 200
        this.statusText = init.statusText || 'OK'
        this.headers = new Map(Object.entries(init.headers || {}))
      }

      async json() {
        return JSON.parse(this.body)
      }

      async text() {
        return this.body
      }
    }
  }

  global.Response.json = function(data, init = {}) {
    return new global.Response(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init.headers,
      },
    })
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Map(Object.entries(init.headers || {}))
    }

    async json() {
      return JSON.parse(this.body)
    }

    async text() {
      return this.body
    }
  }
}

// Only import MSW for API tests (not database tests)
let server
if (process.env.NODE_ENV === 'test' && !process.env.SKIP_MSW) {
  try {
    const { server: mswServer } = require('./src/__mocks__/server')
    server = mswServer

    // Establish API mocking before all tests
    beforeAll(() => {
      server.listen()
    })

    // Reset any request handlers that we may add during the tests,
    // so they don't affect other tests
    afterEach(() => {
      server.resetHandlers()
    })

    // Clean up after the tests are finished
    afterAll(() => {
      server.close()
    })
  } catch (error) {
    console.warn('MSW server not available:', error.message)
  }
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
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
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.JWT_SECRET = 'test-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret'
process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-client-id'
process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-client-secret'

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

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

// Mock scrollTo
window.scrollTo = jest.fn()

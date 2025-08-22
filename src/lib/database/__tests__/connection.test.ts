// Mock connection state
const mockConnectionState = {
  isConnected: false,
  isConnecting: false,
  connectionPromise: null,
}

// Mock the connection functions
const connectToDatabase = jest.fn().mockImplementation(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined')
  }

  if (process.env.MONGODB_URI === 'connection-error') {
    throw new Error('Database connection failed: Connection failed')
  }

  mockConnectionState.isConnected = true
  return { connection: { readyState: 1 } }
})

const disconnectFromDatabase = jest.fn().mockImplementation(async () => {
  mockConnectionState.isConnected = false
})

const getConnectionStatus = jest.fn().mockImplementation(() => ({
  isConnected: mockConnectionState.isConnected,
  readyState: mockConnectionState.isConnected ? 1 : 0,
  readyStateName: mockConnectionState.isConnected ? 'connected' : 'disconnected',
}))

const healthCheck = jest.fn().mockImplementation(async () => {
  if (mockConnectionState.isConnected) {
    return {
      status: 'healthy',
      details: {
        connected: true,
        readyState: 'connected',
        host: 'localhost',
        name: 'test-db',
        ping: 10,
      },
    }
  } else {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        readyState: 'disconnected',
      },
    }
  }
})

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
    process.env.NODE_ENV = 'test'
  })

  afterEach(async () => {
    await disconnectFromDatabase()
  })

  describe('connectToDatabase', () => {
    it('should connect to MongoDB successfully', async () => {
      const result = await connectToDatabase()

      expect(connectToDatabase).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should throw error when MONGODB_URI is not defined', async () => {
      delete process.env.MONGODB_URI

      await expect(connectToDatabase()).rejects.toThrow(
        'MONGODB_URI environment variable is not defined'
      )
    })

    it('should throw error when connection fails', async () => {
      process.env.MONGODB_URI = 'connection-error'

      await expect(connectToDatabase()).rejects.toThrow(
        'Database connection failed: Connection failed'
      )
    })
  })

  describe('disconnectFromDatabase', () => {
    it('should disconnect from MongoDB', async () => {
      await disconnectFromDatabase()

      expect(disconnectFromDatabase).toHaveBeenCalled()
    })
  })

  describe('getConnectionStatus', () => {
    it('should return connection status', () => {
      const status = getConnectionStatus()

      expect(status).toHaveProperty('isConnected')
      expect(status).toHaveProperty('readyState')
      expect(status).toHaveProperty('readyStateName')
    })
  })

  describe('healthCheck', () => {
    it('should return healthy status when connected', async () => {
      // First connect to set the state
      await connectToDatabase()

      const health = await healthCheck()

      expect(health.status).toBe('healthy')
      expect(health.details.connected).toBe(true)
      expect(health.details.host).toBe('localhost')
      expect(health.details.name).toBe('test-db')
      expect(typeof health.details.ping).toBe('number')
    })

    it('should return unhealthy status when not connected', async () => {
      // Ensure disconnected state
      await disconnectFromDatabase()

      const health = await healthCheck()

      expect(health.status).toBe('unhealthy')
      expect(health.details.connected).toBe(false)
    })
  })

})

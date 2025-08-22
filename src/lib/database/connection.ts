import mongoose from 'mongoose'

interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  connectionPromise: Promise<typeof mongoose> | null
}

const connection: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  connectionPromise: null,
}

/**
 * Connect to MongoDB with connection pooling and error handling
 * Optimized for serverless environments (Vercel Functions)
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // Return existing connection if already connected
  if (connection.isConnected && mongoose.connection.readyState === 1) {
    return mongoose
  }

  // Return existing connection promise if currently connecting
  if (connection.isConnecting && connection.connectionPromise) {
    return connection.connectionPromise
  }

  // Validate MongoDB URI
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not defined')
  }

  try {
    connection.isConnecting = true

    // Configure mongoose for serverless environments
    mongoose.set('strictQuery', true)
    
    // Connection options optimized for serverless
    const options = {
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      retryWrites: true,
      w: 'majority',
    }

    // Create connection promise
    connection.connectionPromise = mongoose.connect(mongoUri, options)

    // Wait for connection
    const mongooseInstance = await connection.connectionPromise

    // Set connection state
    connection.isConnected = true
    connection.isConnecting = false

    // Log successful connection (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Connected to MongoDB')
    }

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error)
      connection.isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected')
      connection.isConnected = false
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('🔌 MongoDB connection closed through app termination')
      process.exit(0)
    })

    return mongooseInstance
  } catch (error) {
    connection.isConnecting = false
    connection.connectionPromise = null
    
    console.error('❌ Failed to connect to MongoDB:', error)
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Disconnect from MongoDB
 * Useful for testing and cleanup
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    connection.isConnected = false
    connection.isConnecting = false
    connection.connectionPromise = null
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Disconnected from MongoDB')
    }
  }
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): {
  isConnected: boolean
  readyState: number
  readyStateName: string
} {
  const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }

  return {
    isConnected: connection.isConnected,
    readyState: mongoose.connection.readyState,
    readyStateName: readyStateMap[mongoose.connection.readyState as keyof typeof readyStateMap] || 'unknown',
  }
}

/**
 * Health check for the database connection
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy'
  details: {
    connected: boolean
    readyState: string
    host?: string
    name?: string
    ping?: number
  }
}> {
  try {
    const connectionStatus = getConnectionStatus()
    
    if (!connectionStatus.isConnected) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          readyState: connectionStatus.readyStateName,
        },
      }
    }

    // Ping the database
    const startTime = Date.now()
    await mongoose.connection.db.admin().ping()
    const pingTime = Date.now() - startTime

    return {
      status: 'healthy',
      details: {
        connected: true,
        readyState: connectionStatus.readyStateName,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        ping: pingTime,
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        readyState: 'error',
      },
    }
  }
}

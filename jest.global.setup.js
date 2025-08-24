/**
 * Jest Global Setup
 * Runs once before all tests
 */

const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

module.exports = async () => {
  // Start in-memory MongoDB instance for testing
  const mongod = new MongoMemoryServer({
    instance: {
      dbName: 'portfolio-cms-test',
      port: 27018, // Different port from dev
    },
  })

  await mongod.start()
  const uri = mongod.getUri()

  // Store the URI and instance for cleanup
  global.__MONGOD__ = mongod
  global.__MONGO_URI__ = uri
  
  // Set the test database URI
  process.env.MONGODB_URI = uri
  process.env.MONGODB_TEST_DB_NAME = 'portfolio-cms-test'

  console.log('🧪 Test MongoDB started at:', uri)

  // Connect to the test database
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('✅ Connected to test database')
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error)
    throw error
  }

  // Create test data directory
  const fs = require('fs')
  const path = require('path')
  
  const testDataDir = path.join(__dirname, 'test-data')
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true })
  }

  // Set up test environment variables
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only'
  process.env.SESSION_SECRET = 'test-session-secret-for-testing-only'
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters'
  process.env.OPENAI_API_KEY = 'sk-test-key-for-testing-only'
  
  console.log('🔧 Test environment configured')
}

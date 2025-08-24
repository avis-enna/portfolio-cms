/**
 * Jest Global Teardown
 * Runs once after all tests
 */

const mongoose = require('mongoose')

module.exports = async () => {
  // Close mongoose connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from test database')
  }

  // Stop the in-memory MongoDB instance
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop()
    console.log('🛑 Test MongoDB stopped')
  }

  // Clean up test data directory
  const fs = require('fs')
  const path = require('path')
  
  const testDataDir = path.join(__dirname, 'test-data')
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true })
    console.log('🧹 Test data directory cleaned up')
  }

  // Clean up test logs
  const testLogFile = path.join(__dirname, 'test.log')
  if (fs.existsSync(testLogFile)) {
    fs.unlinkSync(testLogFile)
  }

  console.log('✅ Test environment cleanup completed')
}

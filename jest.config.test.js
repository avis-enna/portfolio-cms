const nextJest = require('next/jest')
const path = require('path')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Test-specific Jest configuration
const testJestConfig = {
  // Test environment setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.test.js'],
  setupFiles: ['<rootDir>/jest.env.test.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/cypress/',
    '<rootDir>/tests/',
    '<rootDir>/e2e/',
    '<rootDir>/playwright-report/',
    '<rootDir>/coverage/',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,jsx,ts,tsx}',
    '!src/**/*.mock.{js,jsx,ts,tsx}',
  ],
  
  // Coverage thresholds (more realistic for test environment)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Coverage reporting
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: '<rootDir>/coverage/test',
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    // Mock static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  
  // Transform configuration
  transformIgnorePatterns: [
    'node_modules/(?!(bson|mongodb|mongoose|@testing-library|@babel|@jest)/)',
  ],
  
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Test timeout (increased for integration tests)
  testTimeout: 30000,
  
  // Handle ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Verbose output for debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Parallel execution
  maxWorkers: '50%',
  
  // Test result processor
  testResultsProcessor: '<rootDir>/jest.results.processor.js',
  
  // Global setup and teardown
  globalSetup: '<rootDir>/jest.global.setup.js',
  globalTeardown: '<rootDir>/jest.global.teardown.js',
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Snapshot configuration
  // snapshotSerializers: ['@emotion/jest/serializer'],
  
  // Test categories
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-jsdom',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/integration/**/*.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-node',
    },
    {
      displayName: 'api',
      testMatch: ['<rootDir>/src/app/api/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-node',
    },
  ],
  
  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-results',
      outputName: 'junit.xml',
      suiteName: 'Portfolio CMS Tests',
    }],
    ['jest-html-reporters', {
      publicPath: '<rootDir>/test-results',
      filename: 'test-report.html',
      expand: true,
    }],
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(testJestConfig)

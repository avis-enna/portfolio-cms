// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Custom commands for authentication
Cypress.Commands.add('login', (username?: string, password?: string) => {
  const adminUsername = username || Cypress.env('ADMIN_EMAIL') || 'admin'
  const adminPassword = password || Cypress.env('ADMIN_PASSWORD') || 'testpassword123'
  
  cy.session([adminUsername, adminPassword], () => {
    cy.visit('/admin/login')
    cy.get('[data-testid="username-input"]').type(adminUsername)
    cy.get('[data-testid="password-input"]').type(adminPassword)
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('include', '/admin')
  })
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/admin/login')
})

// Custom commands for database seeding
Cypress.Commands.add('seedDatabase', () => {
  cy.task('seedDatabase')
})

Cypress.Commands.add('cleanDatabase', () => {
  cy.task('cleanDatabase')
})

// Custom commands for API testing
Cypress.Commands.add('apiRequest', (method: string, url: string, body?: any, headers?: any) => {
  return cy.request({
    method,
    url,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    failOnStatusCode: false
  })
})

// Global before hook
beforeEach(() => {
  // Reset database state before each test
  cy.cleanDatabase()
  cy.seedDatabase()
})

// Global after hook
afterEach(() => {
  // Clean up after each test
  cy.cleanDatabase()
})

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  return true
})

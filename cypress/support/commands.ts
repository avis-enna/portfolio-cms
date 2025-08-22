/// <reference types="cypress" />

// Custom command type declarations
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in as admin user
       * @example cy.login()
       * @example cy.login('admin', 'password')
       */
      login(username?: string, password?: string): Chainable<void>
      
      /**
       * Custom command to log out
       * @example cy.logout()
       */
      logout(): Chainable<void>
      
      /**
       * Custom command to seed the database with test data
       * @example cy.seedDatabase()
       */
      seedDatabase(): Chainable<void>
      
      /**
       * Custom command to clean the database
       * @example cy.cleanDatabase()
       */
      cleanDatabase(): Chainable<void>
      
      /**
       * Custom command to make API requests
       * @example cy.apiRequest('GET', '/api/portfolio/content')
       */
      apiRequest(method: string, url: string, body?: any, headers?: any): Chainable<Cypress.Response<any>>
    }
  }
}

// Prevent TypeScript from reading file as legacy script
export {}

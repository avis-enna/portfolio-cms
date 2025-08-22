describe('Admin Authentication', () => {
  beforeEach(() => {
    cy.visit('/admin/login')
  })

  it('should display login form', () => {
    cy.get('[data-testid="login-form"]').should('be.visible')
    cy.get('[data-testid="username-input"]').should('be.visible')
    cy.get('[data-testid="password-input"]').should('be.visible')
    cy.get('[data-testid="login-button"]').should('be.visible')
  })

  it('should login with valid credentials', () => {
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="password-input"]').type('testpassword123')
    cy.get('[data-testid="login-button"]').click()

    // Should redirect to admin dashboard
    cy.url().should('include', '/admin')
    cy.get('[data-testid="admin-dashboard"]').should('be.visible')
    
    // Should display user info
    cy.get('[data-testid="user-menu"]').should('contain', 'admin')
  })

  it('should show error with invalid credentials', () => {
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="password-input"]').type('wrongpassword')
    cy.get('[data-testid="login-button"]').click()

    // Should stay on login page
    cy.url().should('include', '/admin/login')
    
    // Should show error message
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid credentials')
  })

  it('should validate required fields', () => {
    cy.get('[data-testid="login-button"]').click()

    // Should show validation errors
    cy.get('[data-testid="username-error"]')
      .should('be.visible')
      .and('contain', 'Username is required')
    
    cy.get('[data-testid="password-error"]')
      .should('be.visible')
      .and('contain', 'Password is required')
  })

  it('should handle logout', () => {
    // First login
    cy.login()
    cy.visit('/admin')

    // Then logout
    cy.get('[data-testid="user-menu"]').click()
    cy.get('[data-testid="logout-button"]').click()

    // Should redirect to login page
    cy.url().should('include', '/admin/login')
    cy.get('[data-testid="login-form"]').should('be.visible')
  })

  it('should redirect to login when accessing protected route', () => {
    cy.visit('/admin/blog')

    // Should redirect to login
    cy.url().should('include', '/admin/login')
    cy.get('[data-testid="login-form"]').should('be.visible')
  })

  it('should persist session after page refresh', () => {
    cy.login()
    cy.visit('/admin')

    // Refresh the page
    cy.reload()

    // Should still be logged in
    cy.url().should('include', '/admin')
    cy.get('[data-testid="admin-dashboard"]').should('be.visible')
  })

  it('should handle session expiration', () => {
    cy.login()
    cy.visit('/admin')

    // Mock expired session by clearing tokens
    cy.window().then((win) => {
      win.localStorage.clear()
      win.sessionStorage.clear()
    })

    // Try to access protected resource
    cy.visit('/admin/blog')

    // Should redirect to login
    cy.url().should('include', '/admin/login')
  })
})

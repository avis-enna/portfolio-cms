# Test-Driven Development (TDD) Guide for Portfolio CMS

## Overview

This project follows a comprehensive Test-Driven Development approach to ensure high code quality, reduce bugs, and facilitate easier maintenance. The TDD workflow is designed to catch errors early and provide confidence in code changes.

## Testing Strategy

### 1. Test Pyramid Structure

```
    /\
   /  \
  /E2E \     <- End-to-End Tests (Cypress)
 /______\
/        \
| Integration|  <- Integration Tests (Jest + MSW)
|____________|
|            |
|    Unit    |  <- Unit Tests (Jest + React Testing Library)
|____________|
```

### 2. Testing Layers

#### Unit Tests (Jest + React Testing Library)
- **Purpose**: Test individual components and functions in isolation
- **Location**: `src/**/*.test.{js,jsx,ts,tsx}`
- **Coverage Target**: 80%+ for functions, lines, branches, statements
- **Focus**: Component behavior, utility functions, hooks

#### Integration Tests (Jest + MSW)
- **Purpose**: Test API endpoints and component interactions
- **Location**: `__tests__/integration/**/*.test.{js,jsx,ts,tsx}`
- **Focus**: API routes, database operations, authentication flows

#### End-to-End Tests (Cypress)
- **Purpose**: Test complete user workflows
- **Location**: `cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`
- **Focus**: User journeys, cross-browser compatibility, real-world scenarios

## TDD Workflow

### Red-Green-Refactor Cycle

1. **RED**: Write a failing test that describes the desired functionality
2. **GREEN**: Write the minimum code necessary to make the test pass
3. **REFACTOR**: Improve the code while keeping tests green

### Example TDD Process

```typescript
// 1. RED: Write failing test
describe('BlogPost component', () => {
  it('should display blog post title and content', () => {
    const mockPost = {
      title: 'Test Post',
      content: 'Test content',
      slug: 'test-post'
    }
    
    render(<BlogPost post={mockPost} />)
    
    expect(screen.getByText('Test Post')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })
})

// 2. GREEN: Implement component
export function BlogPost({ post }: { post: BlogPostType }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  )
}

// 3. REFACTOR: Improve implementation
export function BlogPost({ post }: { post: BlogPostType }) {
  return (
    <article className="prose max-w-none">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}
```

## Testing Commands

### Development
```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- BlogPost.test.tsx

# Run tests with coverage
npm run test:coverage
```

### CI/CD
```bash
# Run all tests for CI
npm run test:ci

# Run E2E tests
npm run test:e2e

# Run complete test suite
npm run test:all
```

## Testing Patterns

### 1. Component Testing Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ContactForm } from './ContactForm'

describe('ContactForm', () => {
  it('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn()
    
    render(<ContactForm onSubmit={mockOnSubmit} />)
    
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Hello world' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello world'
    })
  })
})
```

### 2. API Testing Pattern

```typescript
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/portfolio/contact/route'

describe('/api/portfolio/contact', () => {
  it('should create contact submission', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message'
    }
    
    const request = new NextRequest('http://localhost:3000/api/portfolio/contact', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' }
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
  })
})
```

### 3. E2E Testing Pattern

```typescript
describe('Admin Blog Management', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/admin/blog')
  })

  it('should create, edit, and delete blog post', () => {
    // Create
    cy.get('[data-testid="create-post-button"]').click()
    cy.get('[data-testid="title-input"]').type('New Blog Post')
    cy.get('[data-testid="content-input"]').type('This is the content')
    cy.get('[data-testid="save-button"]').click()
    
    // Verify creation
    cy.contains('New Blog Post').should('be.visible')
    
    // Edit
    cy.get('[data-testid="edit-post-button"]').first().click()
    cy.get('[data-testid="title-input"]').clear().type('Updated Blog Post')
    cy.get('[data-testid="save-button"]').click()
    
    // Verify edit
    cy.contains('Updated Blog Post').should('be.visible')
    
    // Delete
    cy.get('[data-testid="delete-post-button"]').first().click()
    cy.get('[data-testid="confirm-delete"]').click()
    
    // Verify deletion
    cy.contains('Updated Blog Post').should('not.exist')
  })
})
```

## Mock Service Worker (MSW) Setup

MSW is configured to intercept API calls during testing:

```typescript
// src/__mocks__/handlers.ts
export const handlers = [
  http.get('/api/portfolio/content', () => {
    return HttpResponse.json(mockPortfolioContent)
  }),
  
  http.post('/api/auth/login', async ({ request }) => {
    const { username, password } = await request.json()
    
    if (username === 'admin' && password === 'testpassword123') {
      return HttpResponse.json({
        success: true,
        accessToken: 'mock-token'
      })
    }
    
    return HttpResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  })
]
```

## Coverage Requirements

- **Minimum Coverage**: 80% for lines, functions, branches, statements
- **Critical Paths**: 95%+ coverage for authentication, data persistence, API routes
- **UI Components**: Focus on user interactions and edge cases

## Best Practices

### 1. Test Naming
- Use descriptive test names that explain the expected behavior
- Follow the pattern: "should [expected behavior] when [condition]"

### 2. Test Organization
- Group related tests using `describe` blocks
- Use `beforeEach` and `afterEach` for setup and cleanup
- Keep tests independent and isolated

### 3. Assertions
- Use specific assertions that clearly indicate what is being tested
- Prefer semantic queries (`getByRole`, `getByLabelText`) over generic ones

### 4. Test Data
- Use factories or builders for creating test data
- Keep test data minimal and focused on the specific test case

### 5. Async Testing
- Always await async operations
- Use `waitFor` for elements that appear asynchronously
- Handle loading states in tests

## Debugging Tests

### Jest Debugging
```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test with verbose output
npm test -- --verbose BlogPost.test.tsx
```

### Cypress Debugging
```bash
# Open Cypress Test Runner
npm run cypress:open

# Run with debug output
DEBUG=cypress:* npm run cypress:run
```

## Continuous Integration

The project includes GitHub Actions workflow for automated testing:

1. **Unit & Integration Tests**: Run on every push and PR
2. **E2E Tests**: Run on main branch and release branches
3. **Coverage Reports**: Generated and uploaded to coverage services
4. **Quality Gates**: Tests must pass before merging

## Error Reduction Strategies

1. **Type Safety**: Comprehensive TypeScript configuration
2. **Linting**: ESLint with strict rules for code quality
3. **Formatting**: Prettier for consistent code style
4. **Pre-commit Hooks**: Husky + lint-staged for quality checks
5. **API Validation**: Zod schemas for runtime type checking
6. **Database Validation**: Mongoose schemas with strict validation

This TDD approach ensures that the portfolio CMS is robust, maintainable, and reliable while reducing debugging time and production errors.

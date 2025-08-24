# 🧪 Portfolio CMS Testing Guide

Comprehensive testing documentation for the Portfolio CMS project using Playwright, Cucumber, and Selenium.

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Frameworks](#testing-frameworks)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Configuration](#test-configuration)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Our testing strategy covers all aspects of the Portfolio CMS:

- **Unit Tests** - Individual component and function testing
- **E2E Tests** - End-to-end user journey testing with Playwright
- **Cross-Browser Tests** - Selenium WebDriver for browser compatibility
- **BDD Tests** - Cucumber for behavior-driven development
- **Accessibility Tests** - WCAG compliance testing
- **Performance Tests** - Page load and Core Web Vitals
- **Visual Regression Tests** - Screenshot comparison testing

## 🛠️ Testing Frameworks

### Playwright
- **Purpose**: Modern E2E testing with excellent developer experience
- **Features**: Auto-wait, parallel execution, trace viewer, video recording
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: iOS Safari, Android Chrome

### Selenium WebDriver
- **Purpose**: Cross-browser compatibility testing
- **Features**: Real browser automation, grid support
- **Browsers**: Chrome, Firefox, Edge, Safari
- **Use Cases**: Legacy browser support, specific driver features

### Cucumber
- **Purpose**: Behavior-driven development (BDD)
- **Features**: Gherkin syntax, stakeholder-friendly scenarios
- **Integration**: Works with Playwright and Selenium
- **Benefits**: Living documentation, business-readable tests

### Jest
- **Purpose**: Unit and integration testing
- **Features**: Snapshot testing, mocking, coverage reports
- **Integration**: React Testing Library for component tests

## 📁 Test Structure

```
tests/
├── e2e/                          # Playwright E2E tests
│   ├── features/                 # Cucumber feature files
│   │   ├── admin-setup.feature
│   │   ├── api-keys.feature
│   │   └── portfolio.feature
│   ├── pages/                    # Page Object Models
│   │   ├── setup-wizard.page.ts
│   │   ├── api-keys.page.ts
│   │   └── admin-dashboard.page.ts
│   ├── step-definitions/         # Cucumber step definitions
│   │   └── admin-setup.steps.ts
│   ├── support/                  # Test utilities
│   │   ├── world.ts
│   │   ├── database-helper.ts
│   │   ├── auth-helper.ts
│   │   └── test-data-factory.ts
│   └── specs/                    # Playwright test specs
│       ├── setup.spec.ts
│       ├── admin.spec.ts
│       ├── accessibility.spec.ts
│       ├── performance.spec.ts
│       └── visual.spec.ts
├── selenium/                     # Selenium WebDriver tests
│   └── portfolio-cms.selenium.test.ts
├── unit/                         # Jest unit tests
│   ├── components/
│   ├── lib/
│   └── api/
├── auth/                         # Authentication states
│   └── admin.json
├── test-data/                    # Test fixtures
│   ├── users.json
│   ├── projects.json
│   └── portfolio.json
└── test.config.ts               # Central test configuration
```

## 🚀 Running Tests

### Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test:all

# Run specific test suites
npm run test              # Unit tests
npm run test:e2e          # Playwright E2E tests
npm run test:selenium     # Selenium tests
npm run test:cucumber     # Cucumber BDD tests
```

### Detailed Commands

```bash
# Playwright Tests
npm run test:e2e                    # All E2E tests
npm run test:e2e:ui                 # Interactive UI mode
npm run test:e2e:debug              # Debug mode
npm run test:e2e:headed             # Run with browser UI
npm run test:e2e:report             # View HTML report

# Selenium Tests
npm run test:selenium               # All browsers
npm run test:selenium:chrome        # Chrome only
npm run test:selenium:firefox       # Firefox only
npm run test:selenium:edge          # Edge only

# Specialized Tests
npm run test:accessibility          # Accessibility tests
npm run test:performance            # Performance tests
npm run test:visual                 # Visual regression tests
npm run test:mobile                 # Mobile device tests
npm run test:cross-browser          # Cross-browser tests

# Cucumber BDD Tests
npm run test:cucumber               # All feature files
```

### Custom Test Runner

```bash
# Run comprehensive test suite with unified reporting
node scripts/run-tests.js

# Run specific test types
node scripts/run-tests.js --no-selenium --no-visual

# Environment-specific testing
NODE_ENV=staging npm run test:e2e
BASE_URL=https://staging.example.com npm run test:e2e
```

## ⚙️ Test Configuration

### Environment Variables

```bash
# Test Environment
NODE_ENV=test
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api

# Database
TEST_MONGODB_URI=mongodb://localhost:27017/portfolio-cms-test

# Authentication
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=testpassword123
TEST_JWT_SECRET=test-jwt-secret

# Browser Settings
HEADLESS=true                       # Run browsers in headless mode
SLOW_MO=0                          # Slow down actions (ms)
VIEWPORT_WIDTH=1920                # Browser viewport width
VIEWPORT_HEIGHT=1080               # Browser viewport height

# Test Data
USE_REAL_DATA=false                # Use real vs. fake data
SEED_DATABASE=true                 # Seed database before tests
CLEANUP_AFTER_EACH=true            # Clean up after each test

# Visual Testing
UPDATE_SNAPSHOTS=false             # Update visual snapshots
```

### Configuration Files

- `playwright.config.ts` - Playwright configuration
- `tests/test.config.ts` - Central test configuration
- `cucumber.js` - Cucumber configuration
- `jest.config.js` - Jest configuration

## ✍️ Writing Tests

### Playwright E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('should complete setup wizard', async ({ page }) => {
  await page.goto('/admin/setup')
  
  // Fill personal information
  await page.fill('input[name="name"]', 'John Doe')
  await page.fill('input[name="email"]', 'john@example.com')
  
  // Submit and verify
  await page.click('button:has-text("Complete Setup")')
  await expect(page).toHaveURL('/admin')
})
```

### Cucumber Feature Files

```gherkin
Feature: Portfolio Setup
  As a new user
  I want to set up my portfolio
  So that I can showcase my work

  Scenario: Complete setup wizard
    Given I navigate to the setup wizard
    When I fill in my personal information
    And I configure my features
    And I complete the setup
    Then I should see the admin dashboard
    And my portfolio should be configured
```

### Page Object Models

```typescript
export class SetupWizardPage {
  constructor(private page: Page) {}

  async fillPersonalInfo(data: PersonalInfo) {
    await this.page.fill('input[name="name"]', data.name)
    await this.page.fill('input[name="email"]', data.email)
  }

  async completeSetup() {
    await this.page.click('button:has-text("Complete Setup")')
  }
}
```

### Selenium Tests

```typescript
describe('Cross-browser compatibility', () => {
  test('should work in Chrome', async () => {
    const driver = await new Builder().forBrowser('chrome').build()
    await driver.get('http://localhost:3000')
    
    const title = await driver.getTitle()
    expect(title).toContain('Portfolio CMS')
    
    await driver.quit()
  })
})
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install
      
      - name: Run tests
        run: npm run test:all
        env:
          CI: true
          HEADLESS: true
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

### Test Reports

Tests generate multiple report formats:
- **HTML Reports** - Interactive test results with screenshots
- **JSON Reports** - Machine-readable test data
- **JUnit XML** - CI/CD integration format
- **Allure Reports** - Advanced reporting with trends

## 🎯 Test Categories

### Setup and Configuration Tests
- Setup wizard completion
- Form validation
- Step navigation
- Data persistence

### Authentication Tests
- Login/logout functionality
- Access control
- Session management
- Password security

### API Keys Management Tests
- OpenAI configuration
- Connection testing
- Key validation
- Settings persistence

### Admin Dashboard Tests
- Navigation functionality
- Data display
- CRUD operations
- Real-time updates

### Content Management Tests
- Project creation/editing
- Blog post management
- Media uploads
- Content validation

### Accessibility Tests
- WCAG compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast

### Performance Tests
- Page load times
- Core Web Vitals
- API response times
- Resource optimization

### Visual Regression Tests
- UI consistency
- Layout stability
- Cross-browser appearance
- Responsive design

## 🐛 Troubleshooting

### Common Issues

**Tests failing in CI but passing locally**
```bash
# Check environment differences
NODE_ENV=test npm run test:e2e
HEADLESS=true npm run test:e2e
```

**Browser not found errors**
```bash
# Install browsers
npx playwright install
npx playwright install-deps
```

**Database connection issues**
```bash
# Check MongoDB connection
mongosh $TEST_MONGODB_URI
```

**Flaky tests**
```bash
# Run with retries
npm run test:e2e -- --retries=3

# Debug specific test
npm run test:e2e:debug -- --grep "test name"
```

### Debug Mode

```bash
# Playwright debug mode
npm run test:e2e:debug

# Selenium debug mode
HEADLESS=false npm run test:selenium

# Verbose logging
DEBUG=pw:api npm run test:e2e
```

### Test Data Issues

```bash
# Reset test database
npm run test:db:reset

# Seed fresh test data
npm run test:db:seed
```

## 📊 Test Metrics

Our test suite aims for:
- **90%+ code coverage** for unit tests
- **100% critical path coverage** for E2E tests
- **Zero accessibility violations** for WCAG AA compliance
- **<3s page load times** for performance tests
- **Zero visual regressions** for UI consistency

## 🎉 Best Practices

1. **Write tests first** - TDD/BDD approach
2. **Use Page Object Models** - Maintainable test code
3. **Test user journeys** - End-to-end scenarios
4. **Mock external services** - Reliable test execution
5. **Clean test data** - Isolated test runs
6. **Parallel execution** - Faster feedback
7. **Visual testing** - UI regression prevention
8. **Accessibility testing** - Inclusive design
9. **Performance monitoring** - User experience focus
10. **Continuous testing** - CI/CD integration

---

**Happy Testing! 🧪✨**

For more information, check the individual test files and configuration documentation.

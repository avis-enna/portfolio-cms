#!/usr/bin/env node

/**
 * Comprehensive Bug Detection & Testing Script
 * Identifies UI/UX bugs, data inconsistencies, and glitches throughout the application
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = './bug-detection-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class BugDetector {
  constructor() {
    this.browser = null;
    this.page = null;
    this.bugs = [];
    this.screenshotCount = 0;
    this.consoleErrors = [];
    this.networkErrors = [];
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push({
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
        console.log(`🐛 Console Error: ${msg.text()}`);
      }
    });

    // Listen for network errors
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
        console.log(`🌐 Network Error: ${response.status()} ${response.url()}`);
      }
    });

    // Listen for page errors
    this.page.on('pageerror', error => {
      this.bugs.push({
        type: 'PAGE_ERROR',
        severity: 'HIGH',
        description: `JavaScript Error: ${error.message}`,
        location: 'Global',
        timestamp: new Date().toISOString()
      });
    });
  }

  async takeScreenshot(name, description) {
    this.screenshotCount++;
    const filename = `${String(this.screenshotCount).padStart(2, '0')}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 ${filename} - ${description}`);
    return filepath;
  }

  addBug(type, severity, description, location, screenshot = null) {
    this.bugs.push({
      type,
      severity,
      description,
      location,
      screenshot,
      timestamp: new Date().toISOString()
    });
    console.log(`🐛 ${severity} BUG: ${description} (${location})`);
  }

  async login() {
    console.log('\n🔐 === LOGIN & AUTHENTICATION TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/login`);
    await this.takeScreenshot('login_page', 'Login page initial state');
    
    await this.page.fill('input[data-testid="username-input"]', 'admin');
    await this.page.fill('input[data-testid="password-input"]', 'testpassword123');
    await this.page.click('button[data-testid="login-button"]');
    
    try {
      await this.page.waitForURL('**/admin/dashboard', { timeout: 10000 });
      await this.takeScreenshot('dashboard_loaded', 'Dashboard after login');
    } catch (error) {
      this.addBug('LOGIN_ERROR', 'HIGH', 'Login failed or dashboard not loading', 'Authentication');
    }
  }

  async testDashboardDataConsistency() {
    console.log('\n📊 === DASHBOARD DATA CONSISTENCY TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/dashboard`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('dashboard_full', 'Dashboard with all data');

    // Test statistics cards for data consistency
    const statsCards = await this.page.locator('[data-testid^="stat-"]').all();
    for (let i = 0; i < statsCards.length; i++) {
      const card = statsCards[i];
      const cardText = await card.textContent();
      
      // Check for placeholder or inconsistent data
      if (cardText.includes('0') && cardText.includes('Total')) {
        this.addBug('DATA_INCONSISTENCY', 'MEDIUM', 
          `Statistics card shows 0 values: ${cardText}`, 
          'Dashboard Statistics');
      }
    }

    // Test contact count specifically
    const contactCard = await this.page.locator('text=Total Contacts').locator('..').textContent();
    if (contactCard.includes('0 unread')) {
      this.addBug('CONTACT_COUNT_BUG', 'HIGH', 
        'Contact count shows 0 unread but may have unread contacts', 
        'Dashboard Contact Statistics');
    }
  }

  async testContactManagementBugs() {
    console.log('\n📧 === CONTACT MANAGEMENT BUG TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/contact`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('contact_page_initial', 'Contact management page');

    // Check if there are contacts but dashboard shows 0
    const contactRows = await this.page.locator('tr').count();
    if (contactRows > 1) { // More than header row
      this.addBug('CONTACT_COUNT_MISMATCH', 'HIGH', 
        `Found ${contactRows - 1} contacts but dashboard shows 0`, 
        'Contact Management');
      
      // Test marking as read functionality
      const markReadButtons = await this.page.locator('button:has-text("Mark as Read")').all();
      if (markReadButtons.length > 0) {
        await markReadButtons[0].click();
        await this.page.waitForTimeout(1000);
        await this.takeScreenshot('contact_marked_read', 'After marking contact as read');
        
        // Check if dashboard updates
        await this.page.goto(`${BASE_URL}/admin/dashboard`);
        await this.page.waitForLoadState('networkidle');
        const updatedContactCard = await this.page.locator('text=Total Contacts').locator('..').textContent();
        if (updatedContactCard.includes('0 unread')) {
          this.addBug('CONTACT_STATUS_NOT_UPDATING', 'HIGH', 
            'Contact marked as read but dashboard still shows unread count', 
            'Contact Status Update');
        }
      }
    }
  }

  async testFormValidationBugs() {
    console.log('\n📝 === FORM VALIDATION BUG TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/content`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('content_form_initial', 'Content form initial state');

    // Test empty form submission
    await this.page.click('button:has-text("Save Changes")');
    await this.page.waitForTimeout(2000);
    await this.takeScreenshot('empty_form_submission', 'After submitting empty form');

    // Check for proper validation messages
    const errorMessages = await this.page.locator('.text-red-500, .text-red-600, .text-red-700').count();
    if (errorMessages === 0) {
      this.addBug('MISSING_VALIDATION', 'MEDIUM', 
        'No validation messages shown for empty form submission', 
        'Form Validation');
    }

    // Test invalid email format
    await this.page.fill('input[placeholder*="email"]', 'invalid-email');
    await this.page.click('button:has-text("Save Changes")');
    await this.page.waitForTimeout(1000);
    
    const emailValidation = await this.page.locator('text=invalid email').count();
    if (emailValidation === 0) {
      this.addBug('EMAIL_VALIDATION_MISSING', 'MEDIUM', 
        'No validation for invalid email format', 
        'Email Validation');
    }
  }

  async testNavigationBugs() {
    console.log('\n🧭 === NAVIGATION BUG TESTING ===');
    
    const navLinks = [
      { name: 'Dashboard', url: '/admin/dashboard' },
      { name: 'Content', url: '/admin/content' },
      { name: 'Blog', url: '/admin/blog' },
      { name: 'Contact', url: '/admin/contact' },
      { name: 'Settings', url: '/admin/settings' }
    ];

    for (const link of navLinks) {
      try {
        await this.page.click(`a[href="${link.url}"]`);
        await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        await this.takeScreenshot(`nav_${link.name.toLowerCase()}`, `Navigation to ${link.name}`);
        
        // Check for 404 or error pages
        const pageTitle = await this.page.title();
        const pageContent = await this.page.textContent('body');
        
        if (pageContent.includes('404') || pageContent.includes('Not Found')) {
          this.addBug('NAVIGATION_404', 'HIGH', 
            `${link.name} page returns 404`, 
            'Navigation');
        }
        
        if (pageContent.includes('Error') && !pageContent.includes('No ')) {
          this.addBug('PAGE_ERROR', 'HIGH', 
            `${link.name} page shows error content`, 
            'Page Loading');
        }
      } catch (error) {
        this.addBug('NAVIGATION_TIMEOUT', 'HIGH', 
          `${link.name} page failed to load within timeout`, 
          'Navigation');
      }
    }
  }

  async testResponsiveBugs() {
    console.log('\n📱 === RESPONSIVE DESIGN BUG TESTING ===');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.goto(`${BASE_URL}/admin/dashboard`);
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot(`responsive_${viewport.name.toLowerCase()}`, `${viewport.name} view`);

      // Check for horizontal scrollbars
      const hasHorizontalScroll = await this.page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll && viewport.name !== 'Mobile') {
        this.addBug('HORIZONTAL_SCROLL', 'MEDIUM', 
          `Horizontal scrollbar appears on ${viewport.name} view`, 
          'Responsive Design');
      }

      // Check for overlapping elements
      const overlappingElements = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        let overlaps = 0;
        for (let i = 0; i < elements.length; i++) {
          const rect1 = elements[i].getBoundingClientRect();
          for (let j = i + 1; j < elements.length; j++) {
            const rect2 = elements[j].getBoundingClientRect();
            if (rect1.left < rect2.right && rect2.left < rect1.right &&
                rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
              overlaps++;
            }
          }
        }
        return overlaps;
      });

      if (overlappingElements > 10) { // Some overlap is normal
        this.addBug('ELEMENT_OVERLAP', 'MEDIUM', 
          `Excessive element overlap detected on ${viewport.name} view`, 
          'Layout');
      }
    }

    // Reset to desktop
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async testAccessibilityBugs() {
    console.log('\n♿ === ACCESSIBILITY BUG TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/content`);
    await this.page.waitForLoadState('networkidle');

    // Check for missing alt text on images
    const imagesWithoutAlt = await this.page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      this.addBug('MISSING_ALT_TEXT', 'MEDIUM', 
        `${imagesWithoutAlt} images missing alt text`, 
        'Accessibility');
    }

    // Check for form labels
    const inputsWithoutLabels = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      return inputs.filter(input => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
        return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
      }).length;
    });

    if (inputsWithoutLabels > 0) {
      this.addBug('MISSING_FORM_LABELS', 'HIGH', 
        `${inputsWithoutLabels} form inputs missing proper labels`, 
        'Accessibility');
    }
  }

  async testDataPersistenceBugs() {
    console.log('\n💾 === DATA PERSISTENCE BUG TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/content`);
    await this.page.waitForLoadState('networkidle');

    // Fill form with test data
    await this.page.fill('input[placeholder="Your full name"]', 'Test User');
    await this.page.fill('input[placeholder="Software Developer"]', 'Test Developer');
    
    // Navigate away and back
    await this.page.click('a[href="/admin/dashboard"]');
    await this.page.waitForLoadState('networkidle');
    await this.page.click('a[href="/admin/content"]');
    await this.page.waitForLoadState('networkidle');

    // Check if data persisted
    const nameValue = await this.page.inputValue('input[placeholder="Your full name"]');
    const titleValue = await this.page.inputValue('input[placeholder="Software Developer"]');

    if (nameValue !== 'Test User' || titleValue !== 'Test Developer') {
      this.addBug('DATA_NOT_PERSISTING', 'HIGH', 
        'Form data not persisting between page navigations', 
        'Data Persistence');
    }
  }

  async generateBugReport() {
    console.log('\n📋 === GENERATING COMPREHENSIVE BUG REPORT ===');
    
    const report = {
      timestamp: new Date().toISOString(),
      branch: 'feature/enhanced-ui-improvements',
      testSummary: {
        totalBugsFound: this.bugs.length,
        highSeverityBugs: this.bugs.filter(b => b.severity === 'HIGH').length,
        mediumSeverityBugs: this.bugs.filter(b => b.severity === 'MEDIUM').length,
        lowSeverityBugs: this.bugs.filter(b => b.severity === 'LOW').length,
        consoleErrors: this.consoleErrors.length,
        networkErrors: this.networkErrors.length,
        screenshotsCaptured: this.screenshotCount
      },
      bugs: this.bugs,
      consoleErrors: this.consoleErrors,
      networkErrors: this.networkErrors,
      recommendations: [
        'Fix contact count synchronization between dashboard and contact page',
        'Implement proper form validation with user-friendly messages',
        'Add accessibility labels to all form inputs',
        'Fix data persistence issues between page navigations',
        'Resolve responsive design overlapping elements',
        'Add proper error handling for network failures'
      ]
    };

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'comprehensive-bug-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`\n🐛 Bug Detection Complete!`);
    console.log(`📸 Screenshots: ${this.screenshotCount}`);
    console.log(`🔴 High Severity Bugs: ${report.testSummary.highSeverityBugs}`);
    console.log(`🟡 Medium Severity Bugs: ${report.testSummary.mediumSeverityBugs}`);
    console.log(`🟢 Low Severity Bugs: ${report.testSummary.lowSeverityBugs}`);
    console.log(`💥 Console Errors: ${this.consoleErrors.length}`);
    console.log(`🌐 Network Errors: ${this.networkErrors.length}`);

    if (this.bugs.length > 0) {
      console.log('\n🚨 BUGS FOUND:');
      this.bugs.forEach((bug, index) => {
        console.log(`${index + 1}. [${bug.severity}] ${bug.description} (${bug.location})`);
      });
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runComprehensiveBugDetection() {
    try {
      await this.init();
      await this.login();
      await this.testDashboardDataConsistency();
      await this.testContactManagementBugs();
      await this.testFormValidationBugs();
      await this.testNavigationBugs();
      await this.testResponsiveBugs();
      await this.testAccessibilityBugs();
      await this.testDataPersistenceBugs();
      await this.generateBugReport();
    } catch (error) {
      console.error('❌ Bug detection failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the comprehensive bug detection
const detector = new BugDetector();
detector.runComprehensiveBugDetection().catch(console.error);

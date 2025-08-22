#!/usr/bin/env node

/**
 * Comprehensive UI Testing Script
 * Tests every page, button, form, and interaction for inconsistencies
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = './test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class UITester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.issues = [];
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async takeScreenshot(name, description) {
    const filename = `${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot: ${filename} - ${description}`);
    return filepath;
  }

  async checkConsoleErrors() {
    const errors = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  async login() {
    console.log('🔐 Logging in...');
    await this.page.goto(`${BASE_URL}/admin/login`);
    await this.takeScreenshot('01_login_page', 'Login page initial state');
    
    await this.page.fill('[data-testid="username-input"]', 'admin');
    await this.page.fill('[data-testid="password-input"]', 'testpassword123');
    await this.takeScreenshot('02_login_filled', 'Login form filled');
    
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('**/admin/dashboard');
    await this.takeScreenshot('03_login_success', 'Login successful - redirected to dashboard');
  }

  async testDashboard() {
    console.log('📊 Testing Dashboard...');
    await this.page.goto(`${BASE_URL}/admin/dashboard`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('04_dashboard_main', 'Dashboard main view');

    // Test statistics cards
    const statsCards = await this.page.locator('[data-testid*="stats-"]').count();
    console.log(`Found ${statsCards} statistics cards`);

    // Test quick action buttons
    const quickActions = [
      'action-new-post',
      'action-edit-content',
      'action-view-contacts',
      'action-site-settings'
    ];

    for (const action of quickActions) {
      try {
        await this.page.locator(`[data-testid="${action}"]`).hover();
        await this.takeScreenshot(`05_dashboard_${action}_hover`, `Dashboard ${action} button hover state`);
      } catch (error) {
        this.issues.push(`Dashboard: ${action} button not found or not hoverable`);
      }
    }

    // Test user menu
    await this.page.click('[data-testid="user-menu"]');
    await this.takeScreenshot('06_dashboard_user_menu', 'Dashboard user menu opened');
    await this.page.click('[data-testid="user-menu"]'); // Close menu
  }

  async testContentManagement() {
    console.log('📝 Testing Content Management...');
    await this.page.goto(`${BASE_URL}/admin/content`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('07_content_main', 'Content management main view');

    // Test personal info form
    await this.page.fill('input[placeholder="Your full name"]', 'John Doe');
    await this.page.fill('input[placeholder="Software Developer"]', 'Full Stack Developer');
    await this.takeScreenshot('08_content_personal_filled', 'Personal info form filled');

    // Test skills section
    await this.page.fill('input[placeholder="Add technical skill"]', 'React');
    const addButton = this.page.locator('button:has-text("+")').first();
    await addButton.click();
    await this.takeScreenshot('09_content_skill_added', 'Technical skill added');

    // Test experience section
    try {
      await this.page.click('button:has-text("Add Experience")');
      await this.takeScreenshot('10_content_add_experience', 'Add experience modal/form');
    } catch (error) {
      this.issues.push('Content: Add Experience button not working');
    }

    // Test save functionality
    await this.page.click('button:has-text("Save Changes")');
    await this.page.waitForTimeout(2000);
    await this.takeScreenshot('11_content_save_attempt', 'Content save attempt');
  }

  async testBlogManagement() {
    console.log('📰 Testing Blog Management...');
    await this.page.goto(`${BASE_URL}/admin/blog`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('12_blog_main', 'Blog management main view');

    // Test create new post button
    try {
      await this.page.click('button:has-text("New Post")');
      await this.takeScreenshot('13_blog_new_post', 'Blog new post form');
    } catch (error) {
      this.issues.push('Blog: New Post button not found');
    }
  }

  async testContactManagement() {
    console.log('📧 Testing Contact Management...');
    await this.page.goto(`${BASE_URL}/admin/contact`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('14_contact_main', 'Contact management main view');
  }

  async testSettings() {
    console.log('⚙️ Testing Settings...');
    await this.page.goto(`${BASE_URL}/admin/settings`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('15_settings_main', 'Settings main view');
  }

  async testPublicPortfolio() {
    console.log('🌐 Testing Public Portfolio...');
    await this.page.goto(`${BASE_URL}/`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('16_portfolio_main', 'Public portfolio main view');

    // Test navigation
    const navLinks = await this.page.locator('nav a').count();
    console.log(`Found ${navLinks} navigation links`);

    // Test blog page
    await this.page.goto(`${BASE_URL}/blog`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('17_portfolio_blog', 'Public portfolio blog page');
  }

  async testResponsiveDesign() {
    console.log('📱 Testing Responsive Design...');
    
    // Test mobile view
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.goto(`${BASE_URL}/admin/dashboard`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('18_mobile_dashboard', 'Mobile dashboard view');

    // Test tablet view
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.goto(`${BASE_URL}/admin/dashboard`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('19_tablet_dashboard', 'Tablet dashboard view');

    // Reset to desktop
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async generateReport() {
    console.log('\n📋 Generating Test Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      issues: this.issues,
      screenshotCount: fs.readdirSync(SCREENSHOT_DIR).length,
      recommendations: [
        'Review all screenshots for visual inconsistencies',
        'Fix any console errors found during testing',
        'Ensure all buttons and forms are functional',
        'Verify responsive design across all breakpoints',
        'Test all navigation flows work correctly'
      ]
    };

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`\n✅ Test Complete!`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log(`🐛 Issues found: ${this.issues.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n🚨 Issues to fix:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runFullTest() {
    try {
      await this.init();
      await this.login();
      await this.testDashboard();
      await this.testContentManagement();
      await this.testBlogManagement();
      await this.testContactManagement();
      await this.testSettings();
      await this.testPublicPortfolio();
      await this.testResponsiveDesign();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Test failed:', error);
      this.issues.push(`Critical error: ${error.message}`);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the comprehensive test
const tester = new UITester();
tester.runFullTest().catch(console.error);

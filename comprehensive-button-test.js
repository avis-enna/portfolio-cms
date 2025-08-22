#!/usr/bin/env node

/**
 * Comprehensive Button & Interaction Testing Script
 * Tests EVERY button, form element, link, and interaction for issues
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = './button-test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class ButtonTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.issues = [];
    this.testResults = [];
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.issues.push(`Console Error: ${msg.text()}`);
      }
    });

    // Listen for page errors
    this.page.on('pageerror', error => {
      this.issues.push(`Page Error: ${error.message}`);
    });
  }

  async takeScreenshot(name, description) {
    const filename = `${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 ${filename} - ${description}`);
    return filepath;
  }

  async testButton(selector, description, expectedAction = 'click') {
    try {
      console.log(`🔘 Testing: ${description}`);
      
      // Check if button exists
      const button = this.page.locator(selector);
      const count = await button.count();
      
      if (count === 0) {
        this.issues.push(`❌ Button not found: ${description} (${selector})`);
        this.testResults.push({ description, status: 'NOT_FOUND', selector });
        return false;
      }

      if (count > 1) {
        this.issues.push(`⚠️ Multiple buttons found: ${description} (${selector}) - found ${count}`);
      }

      // Check if button is visible
      const isVisible = await button.first().isVisible();
      if (!isVisible) {
        this.issues.push(`❌ Button not visible: ${description} (${selector})`);
        this.testResults.push({ description, status: 'NOT_VISIBLE', selector });
        return false;
      }

      // Check if button is enabled
      const isEnabled = await button.first().isEnabled();
      if (!isEnabled) {
        this.issues.push(`⚠️ Button disabled: ${description} (${selector})`);
        this.testResults.push({ description, status: 'DISABLED', selector });
        return false;
      }

      // Take screenshot before action
      await this.takeScreenshot(`before_${description}`, `Before clicking ${description}`);

      // Perform action based on type
      if (expectedAction === 'hover') {
        await button.first().hover();
        await this.page.waitForTimeout(500);
      } else {
        await button.first().click();
        await this.page.waitForTimeout(1000);
      }

      // Take screenshot after action
      await this.takeScreenshot(`after_${description}`, `After clicking ${description}`);

      this.testResults.push({ description, status: 'SUCCESS', selector });
      console.log(`✅ ${description} - SUCCESS`);
      return true;

    } catch (error) {
      this.issues.push(`❌ Error testing ${description}: ${error.message}`);
      this.testResults.push({ description, status: 'ERROR', selector, error: error.message });
      console.log(`❌ ${description} - ERROR: ${error.message}`);
      return false;
    }
  }

  async login() {
    console.log('\n🔐 === LOGIN TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/login`);
    await this.takeScreenshot('00_login_initial', 'Login page initial state');
    
    // Test login form elements
    await this.testButton('input[data-testid="username-input"]', 'Username Input Field', 'focus');
    await this.page.fill('input[data-testid="username-input"]', 'admin');
    
    await this.testButton('input[data-testid="password-input"]', 'Password Input Field', 'focus');
    await this.page.fill('input[data-testid="password-input"]', 'testpassword123');
    
    await this.testButton('button[data-testid="login-button"]', 'Login Submit Button');
    
    // Wait for redirect
    await this.page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  }

  async testDashboardButtons() {
    console.log('\n📊 === DASHBOARD BUTTON TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/dashboard`);
    await this.page.waitForLoadState('networkidle');
    
    // Test navigation buttons
    await this.testButton('a[data-testid="nav-dashboard"]', 'Dashboard Nav Link', 'hover');
    await this.testButton('a[data-testid="nav-content"]', 'Content Nav Link', 'hover');
    await this.testButton('a[data-testid="nav-blog"]', 'Blog Nav Link', 'hover');
    await this.testButton('a[data-testid="nav-contact"]', 'Contact Nav Link', 'hover');
    await this.testButton('a[data-testid="nav-settings"]', 'Settings Nav Link', 'hover');

    // Test user menu
    await this.testButton('button[data-testid="user-menu"]', 'User Menu Button');
    await this.testButton('button[data-testid="user-profile"]', 'User Profile Button');
    await this.testButton('button[data-testid="user-menu"]', 'Close User Menu'); // Close menu

    // Test quick action buttons
    await this.testButton('button[data-testid="action-new-post"]', 'New Post Quick Action');
    await this.page.goBack(); // Return to dashboard
    
    await this.testButton('button[data-testid="action-edit-content"]', 'Edit Content Quick Action');
    await this.page.goBack(); // Return to dashboard
    
    await this.testButton('button[data-testid="action-view-contacts"]', 'View Contacts Quick Action');
    await this.page.goBack(); // Return to dashboard
    
    await this.testButton('button[data-testid="action-site-settings"]', 'Site Settings Quick Action');
    await this.page.goBack(); // Return to dashboard

    // Test mobile menu button (if visible)
    await this.testButton('button[data-testid="mobile-menu-button"]', 'Mobile Menu Button', 'hover');
    
    // Test notifications button
    await this.testButton('button[data-testid="notifications-button"]', 'Notifications Button', 'hover');
  }

  async testContentManagementButtons() {
    console.log('\n📝 === CONTENT MANAGEMENT BUTTON TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/content`);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000); // Wait for any async loading

    // Test save button
    await this.testButton('button:has-text("Save Changes")', 'Save Changes Button');

    // Test add buttons for different sections
    await this.testButton('button:has-text("Add Experience")', 'Add Experience Button');
    await this.testButton('button:has-text("Add Education")', 'Add Education Button');
    await this.testButton('button:has-text("Add Project")', 'Add Project Button');
    await this.testButton('button:has-text("Add Certification")', 'Add Certification Button');

    // Test skill add buttons
    await this.testButton('button:has-text("+")', 'Add Skill Button (first)');

    // Test any remove/delete buttons that might be present
    const removeButtons = await this.page.locator('button:has-text("×")').count();
    if (removeButtons > 0) {
      await this.testButton('button:has-text("×")', 'Remove Item Button (first)', 'hover');
    }
  }

  async testBlogManagementButtons() {
    console.log('\n📰 === BLOG MANAGEMENT BUTTON TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/blog`);
    await this.page.waitForLoadState('networkidle');

    // Test create new post button
    await this.testButton('button:has-text("New Post")', 'New Blog Post Button');
    
    // Test any edit/delete buttons for existing posts
    const editButtons = await this.page.locator('button:has-text("Edit")').count();
    if (editButtons > 0) {
      await this.testButton('button:has-text("Edit")', 'Edit Post Button (first)', 'hover');
    }

    const deleteButtons = await this.page.locator('button:has-text("Delete")').count();
    if (deleteButtons > 0) {
      await this.testButton('button:has-text("Delete")', 'Delete Post Button (first)', 'hover');
    }

    // Test publish/unpublish buttons
    const publishButtons = await this.page.locator('button:has-text("Publish")').count();
    if (publishButtons > 0) {
      await this.testButton('button:has-text("Publish")', 'Publish Post Button (first)', 'hover');
    }
  }

  async testContactManagementButtons() {
    console.log('\n📧 === CONTACT MANAGEMENT BUTTON TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/contact`);
    await this.page.waitForLoadState('networkidle');

    // Test any action buttons for contacts
    const markReadButtons = await this.page.locator('button:has-text("Mark as Read")').count();
    if (markReadButtons > 0) {
      await this.testButton('button:has-text("Mark as Read")', 'Mark as Read Button (first)', 'hover');
    }

    const replyButtons = await this.page.locator('button:has-text("Reply")').count();
    if (replyButtons > 0) {
      await this.testButton('button:has-text("Reply")', 'Reply Button (first)', 'hover');
    }

    const deleteContactButtons = await this.page.locator('button:has-text("Delete")').count();
    if (deleteContactButtons > 0) {
      await this.testButton('button:has-text("Delete")', 'Delete Contact Button (first)', 'hover');
    }
  }

  async testSettingsButtons() {
    console.log('\n⚙️ === SETTINGS BUTTON TESTING ===');
    await this.page.goto(`${BASE_URL}/admin/settings`);
    await this.page.waitForLoadState('networkidle');

    // Test save settings button
    await this.testButton('button:has-text("Save Settings")', 'Save Settings Button');

    // Test feature toggle buttons
    const toggleButtons = await this.page.locator('button[role="switch"]').count();
    console.log(`Found ${toggleButtons} toggle buttons`);
    
    for (let i = 0; i < Math.min(toggleButtons, 4); i++) {
      await this.testButton(`button[role="switch"]:nth-child(${i + 1})`, `Feature Toggle Button ${i + 1}`, 'hover');
    }

    // Test security buttons
    await this.testButton('button:has-text("Change Password")', 'Change Password Button', 'hover');
    await this.testButton('button:has-text("Enable 2FA")', 'Enable 2FA Button', 'hover');
    await this.testButton('button:has-text("Logout All Sessions")', 'Logout All Sessions Button', 'hover');

    // Test backup buttons
    await this.testButton('button:has-text("Export Data")', 'Export Data Button', 'hover');
    await this.testButton('button:has-text("Choose File")', 'Choose File Button', 'hover');
  }

  async testPublicPortfolioButtons() {
    console.log('\n🌐 === PUBLIC PORTFOLIO BUTTON TESTING ===');
    await this.page.goto(`${BASE_URL}/`);
    await this.page.waitForLoadState('networkidle');

    // Test navigation links
    const navLinks = await this.page.locator('nav a').count();
    console.log(`Found ${navLinks} navigation links`);
    
    for (let i = 0; i < navLinks; i++) {
      const link = this.page.locator('nav a').nth(i);
      const text = await link.textContent();
      await this.testButton(`nav a:nth-child(${i + 1})`, `Portfolio Nav Link: ${text}`, 'hover');
    }

    // Test any CTA buttons
    const ctaButtons = await this.page.locator('button, a[href*="contact"]').count();
    if (ctaButtons > 0) {
      await this.testButton('button, a[href*="contact"]', 'Contact/CTA Button (first)', 'hover');
    }

    // Test blog page
    await this.page.goto(`${BASE_URL}/blog`);
    await this.page.waitForLoadState('networkidle');
    
    const blogButtons = await this.page.locator('button, a[href*="/blog/"]').count();
    if (blogButtons > 0) {
      await this.testButton('button, a[href*="/blog/"]', 'Blog Post Link (first)', 'hover');
    }
  }

  async generateDetailedReport() {
    console.log('\n📋 === GENERATING DETAILED REPORT ===');
    
    const successCount = this.testResults.filter(r => r.status === 'SUCCESS').length;
    const errorCount = this.testResults.filter(r => r.status === 'ERROR').length;
    const notFoundCount = this.testResults.filter(r => r.status === 'NOT_FOUND').length;
    const disabledCount = this.testResults.filter(r => r.status === 'DISABLED').length;
    const notVisibleCount = this.testResults.filter(r => r.status === 'NOT_VISIBLE').length;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        successful: successCount,
        errors: errorCount,
        notFound: notFoundCount,
        disabled: disabledCount,
        notVisible: notVisibleCount,
        totalIssues: this.issues.length
      },
      testResults: this.testResults,
      issues: this.issues,
      recommendations: [
        'Fix all buttons marked as NOT_FOUND - these are missing from the UI',
        'Investigate ERROR status buttons - these have JavaScript errors',
        'Review DISABLED buttons to ensure they should be disabled',
        'Check NOT_VISIBLE buttons for CSS/layout issues',
        'Test all successful buttons for proper functionality',
        'Verify all form submissions work correctly',
        'Check responsive behavior on mobile devices'
      ]
    };

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'button-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`\n✅ Button Testing Complete!`);
    console.log(`📸 Screenshots: ${fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).length}`);
    console.log(`🔘 Total Buttons Tested: ${this.testResults.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`🚫 Not Found: ${notFoundCount}`);
    console.log(`⏸️ Disabled: ${disabledCount}`);
    console.log(`👻 Not Visible: ${notVisibleCount}`);
    console.log(`🐛 Total Issues: ${this.issues.length}`);

    if (this.issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
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

  async runFullButtonTest() {
    try {
      await this.init();
      await this.login();
      await this.testDashboardButtons();
      await this.testContentManagementButtons();
      await this.testBlogManagementButtons();
      await this.testContactManagementButtons();
      await this.testSettingsButtons();
      await this.testPublicPortfolioButtons();
      await this.generateDetailedReport();
    } catch (error) {
      console.error('❌ Button test failed:', error);
      this.issues.push(`Critical test failure: ${error.message}`);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the comprehensive button test
const tester = new ButtonTester();
tester.runFullButtonTest().catch(console.error);

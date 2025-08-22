const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

class ResponsiveDesignTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.issues = [];
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async login() {
    console.log('🔐 Logging in...');
    await this.page.goto(`${BASE_URL}/admin/login`);
    await this.page.waitForLoadState('networkidle');
    
    await this.page.fill('input[type="text"]', 'admin');
    await this.page.fill('input[type="password"]', 'admin123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('**/admin/dashboard');
    console.log('✅ Login successful');
  }

  async testViewport(width, height, deviceName) {
    console.log(`📱 Testing ${deviceName} (${width}x${height})`);
    await this.page.setViewportSize({ width, height });
    
    const issues = [];
    
    // Test dashboard
    await this.page.goto(`${BASE_URL}/admin/dashboard`);
    await this.page.waitForLoadState('networkidle');
    
    // Check for horizontal scrollbars
    const hasHorizontalScroll = await this.page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    if (hasHorizontalScroll) {
      issues.push(`${deviceName}: Dashboard has horizontal scrollbar`);
    }
    
    // Check if mobile menu button is visible on mobile
    if (width < 1024) {
      const mobileMenuVisible = await this.page.locator('[data-testid="mobile-menu-button"]').isVisible();
      if (!mobileMenuVisible) {
        issues.push(`${deviceName}: Mobile menu button not visible`);
      }
    }
    
    // Check if sidebar is properly hidden on mobile
    if (width < 1024) {
      const sidebar = this.page.locator('[data-testid="admin-sidebar"]');
      const sidebarClasses = await sidebar.getAttribute('class');
      if (!sidebarClasses.includes('-translate-x-full')) {
        issues.push(`${deviceName}: Sidebar not properly hidden on mobile`);
      }
    }
    
    // Test content page
    await this.page.goto(`${BASE_URL}/admin/content`);
    await this.page.waitForLoadState('networkidle');
    
    // Check for form overflow
    const formSections = await this.page.locator('.bg-gray-900').count();
    console.log(`📋 Found ${formSections} form sections`);
    
    // Check if form inputs are properly sized
    const inputOverflow = await this.page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, select');
      let overflowCount = 0;
      inputs.forEach(input => {
        if (input.scrollWidth > input.clientWidth) {
          overflowCount++;
        }
      });
      return overflowCount;
    });
    
    if (inputOverflow > 0) {
      issues.push(`${deviceName}: ${inputOverflow} form inputs have overflow`);
    }
    
    // Check grid responsiveness
    const gridIssues = await this.page.evaluate(() => {
      const grids = document.querySelectorAll('.grid');
      const issues = [];
      grids.forEach((grid, index) => {
        const computedStyle = window.getComputedStyle(grid);
        const gridCols = computedStyle.gridTemplateColumns;
        if (gridCols === 'none' || gridCols === '') {
          issues.push(`Grid ${index} has no columns defined`);
        }
      });
      return issues;
    });
    
    issues.push(...gridIssues.map(issue => `${deviceName}: ${issue}`));
    
    // Take screenshot
    await this.page.screenshot({ 
      path: `bug-detection-screenshots/responsive_${deviceName.toLowerCase().replace(' ', '_')}_${width}x${height}.png`,
      fullPage: true 
    });
    
    return issues;
  }

  async testAllViewports() {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile Portrait' },
      { width: 667, height: 375, name: 'Mobile Landscape' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 1280, height: 720, name: 'Desktop Small' },
      { width: 1920, height: 1080, name: 'Desktop Large' }
    ];
    
    for (const viewport of viewports) {
      const issues = await this.testViewport(viewport.width, viewport.height, viewport.name);
      this.issues.push(...issues);
      
      // Wait a bit between tests
      await this.page.waitForTimeout(1000);
    }
  }

  async generateReport() {
    console.log('\n📊 RESPONSIVE DESIGN TEST RESULTS');
    console.log('=====================================');
    
    if (this.issues.length === 0) {
      console.log('✅ No responsive design issues found!');
    } else {
      console.log(`❌ Found ${this.issues.length} responsive design issues:`);
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    // Group issues by type
    const issueTypes = {};
    this.issues.forEach(issue => {
      const type = issue.split(':')[1]?.trim().split(' ')[0] || 'Other';
      if (!issueTypes[type]) issueTypes[type] = 0;
      issueTypes[type]++;
    });
    
    console.log('\n📈 Issue Summary:');
    Object.entries(issueTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} issues`);
    });
  }
}

async function main() {
  const tester = new ResponsiveDesignTester();
  
  try {
    await tester.init();
    await tester.login();
    await tester.testAllViewports();
    await tester.generateReport();
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await tester.close();
  }
}

main().catch(console.error);

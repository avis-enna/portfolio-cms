/**
 * UI Screenshot Testing Script
 * Captures comprehensive screenshots of all Portfolio CMS pages
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = './ui-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true }); // Use headless to avoid dev overlay
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Disable Next.js dev overlay
  await page.addInitScript(() => {
    window.__NEXT_DATA__ = { ...window.__NEXT_DATA__, dev: false };
  });

  try {
    console.log('🚀 Starting UI Screenshot Capture...');

    // 1. Homepage
    console.log('📸 Capturing Homepage...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '01-homepage-desktop.png'),
      fullPage: true 
    });

    // Test responsive design
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '01-homepage-tablet.png'),
      fullPage: true 
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '01-homepage-mobile.png'),
      fullPage: true 
    });

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 2. Admin Setup Page
    console.log('📸 Capturing Admin Setup...');
    await page.goto(`${BASE_URL}/admin/setup`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '02-admin-setup-step1.png'),
      fullPage: true 
    });

    // Test form validation by trying to click Next without filling fields
    try {
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.isVisible()) {
        await nextButton.click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '02-admin-setup-validation.png'),
          fullPage: true
        });
      }
    } catch (error) {
      console.log('⚠️  Could not test form validation');
    }

    // Fill form and capture filled state
    try {
      await page.fill('input[id="name"]', 'John Doe');
      await page.fill('input[id="title"]', 'Full Stack Developer');
      await page.fill('input[id="email"]', 'john@example.com');
      await page.fill('textarea[placeholder*="brief description"]', 'Passionate developer with 5+ years of experience building web applications.');

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '02-admin-setup-filled.png'),
        fullPage: true
      });
    } catch (error) {
      console.log('⚠️  Could not fill form fields');
    }

    // 3. Admin Dashboard (if accessible)
    console.log('📸 Capturing Admin Dashboard...');
    try {
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, '03-admin-dashboard.png'),
        fullPage: true 
      });
    } catch (error) {
      console.log('⚠️  Admin dashboard not accessible (expected if not set up)');
    }

    // 4. Portfolio Content Page
    console.log('📸 Capturing Portfolio Content...');
    try {
      await page.goto(`${BASE_URL}/admin/content`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, '04-portfolio-content.png'),
        fullPage: true 
      });
    } catch (error) {
      console.log('⚠️  Portfolio content page not accessible');
    }

    // 5. Blog Management
    console.log('📸 Capturing Blog Management...');
    try {
      await page.goto(`${BASE_URL}/admin/blog`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, '05-blog-management.png'),
        fullPage: true 
      });
    } catch (error) {
      console.log('⚠️  Blog management page not accessible');
    }

    // 6. Settings Pages
    console.log('📸 Capturing Settings...');
    try {
      await page.goto(`${BASE_URL}/admin/settings`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, '06-settings-main.png'),
        fullPage: true 
      });

      // API Keys Settings
      await page.goto(`${BASE_URL}/admin/settings/api-keys`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, '06-settings-api-keys.png'),
        fullPage: true 
      });
    } catch (error) {
      console.log('⚠️  Settings pages not accessible');
    }

    // 7. Error States
    console.log('📸 Capturing Error States...');
    await page.goto(`${BASE_URL}/non-existent-page`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '07-404-error.png'),
      fullPage: true 
    });

    console.log('✅ Screenshot capture completed!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

// Run the screenshot capture
captureScreenshots().catch(console.error);

#!/usr/bin/env node

/**
 * Test script to verify the contact synchronization bug fix
 * Tests that dashboard and contact management show consistent data
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

class ContactSyncTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async login() {
    console.log('🔐 Logging in...');
    await this.page.goto(`${BASE_URL}/admin/login`);
    await this.page.fill('input[data-testid="username-input"]', 'admin');
    await this.page.fill('input[data-testid="password-input"]', 'testpassword123');
    await this.page.click('button[data-testid="login-button"]');
    await this.page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  }

  async testDashboardContactCount() {
    console.log('\n📊 Testing dashboard contact count...');
    await this.page.goto(`${BASE_URL}/admin/dashboard`);
    await this.page.waitForLoadState('networkidle');
    
    // Wait for dashboard data to load
    await this.page.waitForTimeout(2000);
    
    try {
      // Get contact statistics from dashboard
      const contactCard = await this.page.locator('[data-testid="stats-total-contacts"]').textContent();
      console.log('📋 Dashboard contact card content:', contactCard);
      
      // Extract numbers from the card
      const totalMatch = contactCard.match(/(\d+)/);
      const unreadMatch = contactCard.match(/(\d+)\s+unread/);
      
      const totalContacts = totalMatch ? parseInt(totalMatch[1]) : 0;
      const unreadContacts = unreadMatch ? parseInt(unreadMatch[1]) : 0;
      
      console.log(`📊 Dashboard shows: ${totalContacts} total, ${unreadContacts} unread`);
      
      return { totalContacts, unreadContacts };
    } catch (error) {
      console.error('❌ Error reading dashboard contact count:', error);
      return { totalContacts: 0, unreadContacts: 0 };
    }
  }

  async testContactManagementPage() {
    console.log('\n📧 Testing contact management page...');
    await this.page.goto(`${BASE_URL}/admin/contact`);
    await this.page.waitForLoadState('networkidle');
    
    // Wait for contacts to load
    await this.page.waitForTimeout(2000);
    
    try {
      // Count contact rows (excluding header)
      const contactRows = await this.page.locator('tbody tr').count();
      console.log(`📋 Contact management shows: ${contactRows} contacts`);

      // Count unread contacts more specifically
      const newStatusBadges = await this.page.locator('.bg-blue-100:has-text("new")').count();
      const allBlueBadges = await this.page.locator('.bg-blue-100').count();
      console.log(`📬 Unread contacts (new badges): ${newStatusBadges}`);
      console.log(`📬 All blue badges: ${allBlueBadges}`);

      // Check what the blue badges actually contain
      const blueBadgeTexts = await this.page.locator('.bg-blue-100').allTextContents();
      console.log(`📬 Blue badge texts: ${JSON.stringify(blueBadgeTexts)}`);

      return { totalContacts: contactRows, unreadContacts: newStatusBadges };
    } catch (error) {
      console.error('❌ Error reading contact management data:', error);
      return { totalContacts: 0, unreadContacts: 0 };
    }
  }

  async testMarkAsRead() {
    console.log('\n✅ Testing mark as read functionality...');
    
    try {
      // Find first "Mark Read" button and click it
      const markReadButton = this.page.locator('button:has-text("Mark Read")').first();
      const isVisible = await markReadButton.isVisible();
      
      if (isVisible) {
        console.log('🔘 Clicking "Mark Read" button...');
        await markReadButton.click();
        
        // Wait for the update to complete
        await this.page.waitForTimeout(2000);
        
        console.log('✅ Contact marked as read');
        return true;
      } else {
        console.log('ℹ️ No unread contacts to mark as read');
        return false;
      }
    } catch (error) {
      console.error('❌ Error marking contact as read:', error);
      return false;
    }
  }

  async testSynchronization() {
    console.log('\n🔄 Testing contact count synchronization...');
    
    // Get initial counts
    const dashboardBefore = await this.testDashboardContactCount();
    const contactPageBefore = await this.testContactManagementPage();
    
    console.log('\n📊 BEFORE marking as read:');
    console.log(`   Dashboard: ${dashboardBefore.totalContacts} total, ${dashboardBefore.unreadContacts} unread`);
    console.log(`   Contact Page: ${contactPageBefore.totalContacts} total, ${contactPageBefore.unreadContacts} unread`);
    
    // Check if counts match
    const beforeMatch = (
      dashboardBefore.totalContacts === contactPageBefore.totalContacts &&
      dashboardBefore.unreadContacts === contactPageBefore.unreadContacts
    );
    
    if (beforeMatch) {
      console.log('✅ Dashboard and contact page counts MATCH before update');
    } else {
      console.log('❌ Dashboard and contact page counts DO NOT MATCH before update');
    }
    
    // Mark a contact as read
    const markedAsRead = await this.testMarkAsRead();
    
    if (markedAsRead) {
      // Get counts after marking as read
      const dashboardAfter = await this.testDashboardContactCount();
      
      console.log('\n📊 AFTER marking as read:');
      console.log(`   Dashboard: ${dashboardAfter.totalContacts} total, ${dashboardAfter.unreadContacts} unread`);
      
      // Check if unread count decreased
      const unreadDecreased = dashboardAfter.unreadContacts === (dashboardBefore.unreadContacts - 1);
      
      if (unreadDecreased) {
        console.log('✅ Dashboard unread count CORRECTLY DECREASED by 1');
      } else {
        console.log('❌ Dashboard unread count DID NOT DECREASE correctly');
      }
      
      return { beforeMatch, unreadDecreased };
    }
    
    return { beforeMatch, unreadDecreased: false };
  }

  async generateReport(results) {
    console.log('\n📋 === CONTACT SYNCHRONIZATION TEST REPORT ===');
    console.log(`🕐 Test completed at: ${new Date().toISOString()}`);
    console.log(`🔧 Bug fix status: ${results.beforeMatch && results.unreadDecreased ? 'FIXED ✅' : 'NEEDS WORK ❌'}`);
    
    if (results.beforeMatch) {
      console.log('✅ Dashboard and contact page show consistent data');
    } else {
      console.log('❌ Dashboard and contact page show inconsistent data');
    }
    
    if (results.unreadDecreased) {
      console.log('✅ Marking contact as read updates dashboard count');
    } else {
      console.log('❌ Marking contact as read does not update dashboard count');
    }
    
    console.log('\n🎯 Next steps:');
    if (!results.beforeMatch) {
      console.log('   - Fix data synchronization between dashboard and contact page');
    }
    if (!results.unreadDecreased) {
      console.log('   - Fix real-time updates when contact status changes');
    }
    if (results.beforeMatch && results.unreadDecreased) {
      console.log('   - Contact synchronization bug is FIXED! 🎉');
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest() {
    try {
      await this.init();
      await this.login();
      const results = await this.testSynchronization();
      await this.generateReport(results);
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
const tester = new ContactSyncTester();
tester.runTest().catch(console.error);

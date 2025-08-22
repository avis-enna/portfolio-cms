#!/usr/bin/env node

/**
 * Debug script to test the contact API directly
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

async function debugContactAPI() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login to get access token
    console.log('🔐 Logging in to get access token...');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[data-testid="username-input"]', 'admin');
    await page.fill('input[data-testid="password-input"]', 'testpassword123');
    await page.click('button[data-testid="login-button"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    
    // Get access token from localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    console.log('🔑 Access token obtained:', accessToken ? 'Yes' : 'No');
    
    if (!accessToken) {
      console.error('❌ No access token found');
      return;
    }
    
    // Test dashboard API
    console.log('\n📊 Testing dashboard API...');
    const dashboardResponse = await page.evaluate(async (token) => {
      try {
        const response = await fetch('/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    }, accessToken);
    
    console.log('📋 Dashboard API response:', JSON.stringify(dashboardResponse, null, 2));
    
    // Test contacts API
    console.log('\n📧 Testing contacts API...');
    const contactsResponse = await page.evaluate(async (token) => {
      try {
        const response = await fetch('/api/admin/contacts?filter=all', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    }, accessToken);
    
    console.log('📋 Contacts API response:', JSON.stringify(contactsResponse, null, 2));
    
    // Test contact page loading
    console.log('\n📄 Testing contact page...');
    await page.goto(`${BASE_URL}/admin/contact`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for API calls
    
    // Check console errors
    const consoleMessages = await page.evaluate(() => {
      return window.console._messages || [];
    });
    
    console.log('\n🐛 Console messages on contact page:');
    // Get console messages from the page
    page.on('console', msg => {
      console.log(`   ${msg.type()}: ${msg.text()}`);
    });
    
    // Check what's actually displayed
    const contactCount = await page.locator('tbody tr').count();
    const unreadBadges = await page.locator('.bg-blue-100').count();
    
    console.log(`\n📊 Contact page shows:`);
    console.log(`   Contact rows: ${contactCount}`);
    console.log(`   Unread badges: ${unreadBadges}`);
    
    // Check if there are any error messages
    const errorMessages = await page.locator('.text-red-500, .text-red-600').count();
    console.log(`   Error messages: ${errorMessages}`);
    
    if (errorMessages > 0) {
      const errorText = await page.locator('.text-red-500, .text-red-600').first().textContent();
      console.log(`   Error text: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugContactAPI().catch(console.error);

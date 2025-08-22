#!/usr/bin/env node

/**
 * Test the API route directly by simulating the exact environment
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

async function testAPIRouteDirect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login to get access token
    console.log('🔐 Logging in...');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[data-testid="username-input"]', 'admin');
    await page.fill('input[data-testid="password-input"]', 'testpassword123');
    await page.click('button[data-testid="login-button"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    console.log('🔑 Access token obtained:', accessToken ? 'Yes' : 'No');
    
    if (!accessToken) {
      console.error('❌ No access token found');
      return;
    }
    
    // Test the contacts API with detailed logging
    console.log('\n📧 Testing contacts API with detailed logging...');
    
    const result = await page.evaluate(async (token) => {
      try {
        console.log('🔍 Making API request to /api/admin/contacts');
        
        const response = await fetch('/api/admin/contacts?filter=all', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📡 Raw response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError.message);
          return { 
            error: 'JSON parse failed', 
            status: response.status, 
            responseText: responseText.substring(0, 500) 
          };
        }
        
        return { 
          status: response.status, 
          data,
          success: true
        };
      } catch (error) {
        console.error('❌ API request failed:', error.message);
        return { error: error.message };
      }
    }, accessToken);
    
    console.log('\n📋 API Response Analysis:');
    console.log('Status:', result.status);
    
    if (result.error) {
      console.log('❌ Error:', result.error);
      if (result.responseText) {
        console.log('📄 Response text:', result.responseText);
      }
    } else if (result.data) {
      console.log('✅ Success:', result.data.success);
      if (result.data.success) {
        console.log('📊 Contacts returned:', result.data.data?.contacts?.length || 0);
        console.log('📄 Pagination:', result.data.data?.pagination);
        
        if (result.data.data?.contacts?.length > 0) {
          console.log('📝 Sample contact:', result.data.data.contacts[0]);
        }
      } else {
        console.log('❌ API Error:', result.data.error);
      }
    }
    
    // Also test the dashboard API for comparison
    console.log('\n📊 Testing dashboard API for comparison...');
    
    const dashboardResult = await page.evaluate(async (token) => {
      try {
        const response = await fetch('/api/admin/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    }, accessToken);
    
    console.log('📋 Dashboard API Response:');
    if (dashboardResult.data?.success) {
      const stats = dashboardResult.data.data.stats;
      console.log(`   Total contacts: ${stats.totalContacts}`);
      console.log(`   Unread contacts: ${stats.unreadContacts}`);
    } else {
      console.log('❌ Dashboard error:', dashboardResult.error || dashboardResult.data?.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testAPIRouteDirect().catch(console.error);

#!/usr/bin/env python3
"""
Quick test script to verify admin portal button functionality
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def test_admin_buttons():
    """Quick test of admin portal buttons"""
    
    # Setup Chrome driver
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    wait = WebDriverWait(driver, 10)
    
    try:
        print("🧪 Testing Admin Portal Buttons...")
        
        # Login
        print("🔐 Logging in...")
        driver.get("http://localhost:3001/admin/login")
        
        username_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="username-input"]')))
        username_input.send_keys("admin")
        
        password_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="password-input"]')
        password_input.send_keys("testpassword123")
        
        login_button = driver.find_element(By.CSS_SELECTOR, '[data-testid="login-button"]')
        login_button.click()
        
        # Wait for dashboard
        wait.until(EC.url_contains("/admin/dashboard"))
        print("✅ Login successful")
        
        # Test content management
        print("📝 Testing content management...")
        driver.get("http://localhost:3001/admin/content")
        
        # Wait for content page to load
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="content-management"]')))
        print("✅ Content management page loaded")
        
        # Test Add Experience button
        try:
            add_exp_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Add Experience')]")
            add_exp_button.click()
            time.sleep(1)
            
            # Check if experience form appeared
            exp_forms = driver.find_elements(By.XPATH, "//h3[contains(text(), 'Experience #')]")
            if exp_forms:
                print("✅ Add Experience button working")
            else:
                print("❌ Add Experience button not working")
        except Exception as e:
            print(f"❌ Add Experience test failed: {e}")
        
        # Test skills functionality
        try:
            # Find technical skills input
            tech_input = driver.find_element(By.XPATH, "//input[@placeholder='Add technical skill']")
            tech_input.send_keys("React")
            
            # Find and click the add button
            add_button = tech_input.find_element(By.XPATH, "../button")
            add_button.click()
            time.sleep(1)
            
            # Check if skill was added
            react_skills = driver.find_elements(By.XPATH, "//span[text()='React']")
            if react_skills:
                print("✅ Add Technical Skill button working")
            else:
                print("❌ Add Technical Skill button not working")
        except Exception as e:
            print(f"❌ Skills test failed: {e}")
        
        # Test Save Changes button
        try:
            save_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Save Changes')]")
            save_button.click()
            time.sleep(3)
            
            # Look for success message
            success_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'successfully') or contains(text(), 'saved') or contains(text(), 'updated')]")
            if success_elements:
                print("✅ Save Changes button working - success message found")
            else:
                print("❌ Save Changes button - no success message found")
        except Exception as e:
            print(f"❌ Save Changes test failed: {e}")
        
        print("\n🎉 Button tests completed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
    
    finally:
        input("\nPress Enter to close browser...")
        driver.quit()

if __name__ == "__main__":
    test_admin_buttons()

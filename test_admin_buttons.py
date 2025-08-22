#!/usr/bin/env python3
"""
Selenium test script to verify admin portal button functionality
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class AdminPortalTester:
    def __init__(self):
        self.setup_driver()
        self.base_url = "http://localhost:3001"
        self.wait = WebDriverWait(self.driver, 10)
        
    def setup_driver(self):
        """Setup Chrome driver with options"""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        # chrome_options.add_argument("--headless")  # Uncomment for headless mode
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
    def login(self):
        """Login to admin portal"""
        print("🔐 Testing login...")
        self.driver.get(f"{self.base_url}/admin/login")
        
        # Wait for login form
        username_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="username-input"]'))
        )
        
        # Fill login form
        username_input.send_keys("admin")
        
        password_input = self.driver.find_element(By.CSS_SELECTOR, '[data-testid="password-input"]')
        password_input.send_keys("testpassword123")
        
        # Click login button
        login_button = self.driver.find_element(By.CSS_SELECTOR, '[data-testid="login-button"]')
        login_button.click()
        
        # Wait for redirect to dashboard
        try:
            self.wait.until(EC.url_contains("/admin/dashboard"))
            print("✅ Login successful")
            return True
        except TimeoutException:
            print("❌ Login failed - timeout waiting for dashboard")
            return False
    
    def test_navigation_buttons(self):
        """Test sidebar navigation buttons"""
        print("\n🧭 Testing navigation buttons...")
        
        navigation_tests = [
            ("nav-content", "/admin/content", "Content Management"),
            ("nav-blog", "/admin/blog", "Blog Management"),
            ("nav-contact", "/admin/contact", "Contact Management"),
            ("nav-settings", "/admin/settings", "Settings"),
            ("nav-dashboard", "/admin/dashboard", "Dashboard")
        ]
        
        for nav_id, expected_url, page_name in navigation_tests:
            try:
                nav_button = self.wait.until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, f'[data-testid="{nav_id}"]'))
                )
                nav_button.click()
                
                # Wait for URL change
                self.wait.until(EC.url_contains(expected_url))
                current_url = self.driver.current_url
                
                if expected_url in current_url:
                    print(f"✅ {page_name} navigation working")
                else:
                    print(f"❌ {page_name} navigation failed - URL: {current_url}")
                    
                time.sleep(1)  # Brief pause between navigations
                
            except (TimeoutException, NoSuchElementException) as e:
                print(f"❌ {page_name} navigation failed - {str(e)}")
    
    def test_content_management_buttons(self):
        """Test content management page buttons"""
        print("\n📝 Testing content management buttons...")
        
        # Navigate to content page
        self.driver.get(f"{self.base_url}/admin/content")
        
        # Wait for page to load
        try:
            self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="content-management"]'))
            )
            print("✅ Content management page loaded")
        except TimeoutException:
            print("❌ Content management page failed to load")
            return
        
        # Test Add Experience button
        try:
            add_exp_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Add Experience')]")
            initial_exp_count = len(self.driver.find_elements(By.XPATH, "//h3[contains(text(), 'Experience #')]"))
            
            add_exp_button.click()
            time.sleep(1)
            
            new_exp_count = len(self.driver.find_elements(By.XPATH, "//h3[contains(text(), 'Experience #')]"))
            
            if new_exp_count > initial_exp_count:
                print("✅ Add Experience button working")
            else:
                print("❌ Add Experience button not working")
                
        except NoSuchElementException:
            print("❌ Add Experience button not found")
        
        # Test Add Education button
        try:
            add_edu_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Add Education')]")
            initial_edu_count = len(self.driver.find_elements(By.XPATH, "//h3[contains(text(), 'Education #')]"))
            
            add_edu_button.click()
            time.sleep(1)
            
            new_edu_count = len(self.driver.find_elements(By.XPATH, "//h3[contains(text(), 'Education #')]"))
            
            if new_edu_count > initial_edu_count:
                print("✅ Add Education button working")
            else:
                print("❌ Add Education button not working")
                
        except NoSuchElementException:
            print("❌ Add Education button not found")
        
        # Test Add Project button
        try:
            add_project_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Add Project')]")
            initial_project_count = len(self.driver.find_elements(By.XPATH, "//h3[contains(text(), 'Project #')]"))
            
            add_project_button.click()
            time.sleep(1)
            
            new_project_count = len(self.driver.find_elements(By.XPATH, "//h3[contains(text(), 'Project #')]"))
            
            if new_project_count > initial_project_count:
                print("✅ Add Project button working")
            else:
                print("❌ Add Project button not working")
                
        except NoSuchElementException:
            print("❌ Add Project button not found")
        
        # Test Add Certification button
        try:
            add_cert_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Add Certification')]")
            initial_cert_count = len(self.driver.find_elements(By.XPATH, "//h3[contains(text(), 'Certification #')]"))
            
            add_cert_button.click()
            time.sleep(1)
            
            new_cert_count = len(self.driver.find_elements(By.XPATH, "//h3[contains(text(), 'Certification #')]"))
            
            if new_cert_count > initial_cert_count:
                print("✅ Add Certification button working")
            else:
                print("❌ Add Certification button not working")
                
        except NoSuchElementException:
            print("❌ Add Certification button not found")
        
        # Test Skills add buttons
        try:
            # Test technical skills
            tech_input = self.driver.find_element(By.XPATH, "//input[@placeholder='Add technical skill']")
            tech_add_button = tech_input.find_element(By.XPATH, "../button")
            
            tech_input.send_keys("React")
            tech_add_button.click()
            time.sleep(1)
            
            # Check if skill was added
            react_skill = self.driver.find_elements(By.XPATH, "//span[text()='React']")
            if react_skill:
                print("✅ Add Technical Skill button working")
            else:
                print("❌ Add Technical Skill button not working")
                
        except NoSuchElementException:
            print("❌ Technical skills section not found")
        
        # Test Save Changes button
        try:
            save_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Save Changes')]")
            save_button.click()
            time.sleep(2)
            
            # Look for success message
            success_messages = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'successfully') or contains(text(), 'saved')]")
            if success_messages:
                print("✅ Save Changes button working")
            else:
                print("❌ Save Changes button not working - no success message")
                
        except NoSuchElementException:
            print("❌ Save Changes button not found")
    
    def test_dashboard_buttons(self):
        """Test dashboard quick action buttons"""
        print("\n📊 Testing dashboard buttons...")
        
        # Navigate to dashboard
        self.driver.get(f"{self.base_url}/admin/dashboard")
        
        # Wait for dashboard to load
        try:
            self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="quick-actions"]'))
            )
            print("✅ Dashboard loaded")
        except TimeoutException:
            print("❌ Dashboard failed to load")
            return
        
        # Test quick action buttons
        quick_actions = [
            ("action-new-post", "/admin/blog/new"),
            ("action-edit-content", "/admin/content"),
            ("action-view-contacts", "/admin/contact"),
            ("action-site-settings", "/admin/settings")
        ]
        
        for action_id, expected_url in quick_actions:
            try:
                # Go back to dashboard first
                self.driver.get(f"{self.base_url}/admin/dashboard")
                time.sleep(1)
                
                action_button = self.wait.until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, f'[data-testid="{action_id}"]'))
                )
                action_button.click()
                
                # Wait for URL change
                self.wait.until(EC.url_contains(expected_url))
                current_url = self.driver.current_url
                
                if expected_url in current_url:
                    print(f"✅ {action_id} button working")
                else:
                    print(f"❌ {action_id} button failed - URL: {current_url}")
                    
            except (TimeoutException, NoSuchElementException) as e:
                print(f"❌ {action_id} button failed - {str(e)}")
    
    def test_user_menu_buttons(self):
        """Test user menu buttons"""
        print("\n👤 Testing user menu buttons...")
        
        try:
            # Click user menu
            user_menu = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="user-menu"]'))
            )
            user_menu.click()
            time.sleep(1)
            
            # Check if menu opened
            logout_button = self.driver.find_element(By.CSS_SELECTOR, '[data-testid="logout-button"]')
            if logout_button.is_displayed():
                print("✅ User menu opens correctly")
            else:
                print("❌ User menu not opening")
                
        except (TimeoutException, NoSuchElementException) as e:
            print(f"❌ User menu test failed - {str(e)}")
    
    def run_all_tests(self):
        """Run all button tests"""
        print("🧪 Starting Admin Portal Button Tests")
        print("=" * 50)
        
        try:
            # Login first
            if not self.login():
                print("❌ Cannot proceed - login failed")
                return
            
            # Run all tests
            self.test_navigation_buttons()
            self.test_dashboard_buttons()
            self.test_content_management_buttons()
            self.test_user_menu_buttons()
            
            print("\n" + "=" * 50)
            print("🏁 All tests completed!")
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {str(e)}")
        
        finally:
            # Keep browser open for manual inspection
            input("\nPress Enter to close browser...")
            self.driver.quit()

if __name__ == "__main__":
    tester = AdminPortalTester()
    tester.run_all_tests()

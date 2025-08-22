import { test, expect } from '@playwright/test'

test.describe('Public Portfolio', () => {
  test.describe('Homepage', () => {
    test('should display portfolio homepage correctly', async ({ page }) => {
      await page.goto('/')
      
      // Check main sections
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="about-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="skills-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="experience-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="projects-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="contact-section"]')).toBeVisible()
      
      // Check navigation
      await expect(page.locator('[data-testid="main-nav"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-about"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-experience"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-projects"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-blog"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-contact"]')).toBeVisible()
    })

    test('should have proper SEO meta tags', async ({ page }) => {
      await page.goto('/')
      
      // Check title
      const title = await page.title()
      expect(title).toContain('Portfolio')
      expect(title.length).toBeGreaterThan(10)
      expect(title.length).toBeLessThan(60)
      
      // Check meta description
      const description = await page.locator('meta[name="description"]').getAttribute('content')
      expect(description).toBeTruthy()
      expect(description!.length).toBeGreaterThan(50)
      expect(description!.length).toBeLessThan(160)
      
      // Check Open Graph tags
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/)
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /.+/)
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
      
      // Check Twitter Card tags
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', /.+/)
    })

    test('should be accessible', async ({ page }) => {
      await page.goto('/')
      
      // Check for proper heading hierarchy
      const h1 = page.locator('h1')
      await expect(h1).toHaveCount(1)
      
      // Check for alt text on images
      const images = page.locator('img')
      const imageCount = await images.count()
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const alt = await img.getAttribute('alt')
        expect(alt).toBeTruthy()
      }
      
      // Check for proper link text
      const links = page.locator('a')
      const linkCount = await links.count()
      
      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i)
        const text = await link.textContent()
        const ariaLabel = await link.getAttribute('aria-label')
        
        // Link should have either text content or aria-label
        expect(text || ariaLabel).toBeTruthy()
      }
    })

    test('should have working navigation', async ({ page }) => {
      await page.goto('/')
      
      // Test smooth scrolling navigation
      await page.click('[data-testid="nav-about"]')
      await page.waitForTimeout(1000) // Wait for smooth scroll
      
      // Check if about section is in view
      const aboutSection = page.locator('[data-testid="about-section"]')
      await expect(aboutSection).toBeInViewport()
      
      // Test other navigation items
      await page.click('[data-testid="nav-projects"]')
      await page.waitForTimeout(1000)
      
      const projectsSection = page.locator('[data-testid="projects-section"]')
      await expect(projectsSection).toBeInViewport()
    })

    test('should display contact form', async ({ page }) => {
      await page.goto('/')
      
      // Scroll to contact section
      await page.click('[data-testid="nav-contact"]')
      await page.waitForTimeout(1000)
      
      // Check contact form elements
      await expect(page.locator('[data-testid="contact-form"]')).toBeVisible()
      await expect(page.locator('[data-testid="contact-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="contact-email"]')).toBeVisible()
      await expect(page.locator('[data-testid="contact-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="contact-submit"]')).toBeVisible()
    })
  })

  test.describe('Contact Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.click('[data-testid="nav-contact"]')
      await page.waitForTimeout(1000)
    })

    test('should submit contact form successfully', async ({ page }) => {
      // Fill out the form
      await page.fill('[data-testid="contact-name"]', 'John Doe')
      await page.fill('[data-testid="contact-email"]', 'john@example.com')
      await page.fill('[data-testid="contact-message"]', 'This is a test message from the e2e tests.')
      
      // Submit the form
      await page.click('[data-testid="contact-submit"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Thank you for your message')
      
      // Form should be reset
      await expect(page.locator('[data-testid="contact-name"]')).toHaveValue('')
      await expect(page.locator('[data-testid="contact-email"]')).toHaveValue('')
      await expect(page.locator('[data-testid="contact-message"]')).toHaveValue('')
    })

    test('should validate required fields', async ({ page }) => {
      // Try to submit empty form
      await page.click('[data-testid="contact-submit"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="message-error"]')).toBeVisible()
      
      // Should not show success message
      await expect(page.locator('[data-testid="success-message"]')).not.toBeVisible()
    })

    test('should validate email format', async ({ page }) => {
      // Fill form with invalid email
      await page.fill('[data-testid="contact-name"]', 'John Doe')
      await page.fill('[data-testid="contact-email"]', 'invalid-email')
      await page.fill('[data-testid="contact-message"]', 'Test message')
      
      await page.click('[data-testid="contact-submit"]')
      
      // Should show email validation error
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email')
    })

    test('should handle form submission errors', async ({ page }) => {
      // Mock API to return error
      await page.route('/api/portfolio/contact', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Server error' })
        })
      })
      
      // Fill and submit form
      await page.fill('[data-testid="contact-name"]', 'John Doe')
      await page.fill('[data-testid="contact-email"]', 'john@example.com')
      await page.fill('[data-testid="contact-message"]', 'Test message')
      await page.click('[data-testid="contact-submit"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('error')
    })

    test('should show loading state during submission', async ({ page }) => {
      // Slow down the API response
      await page.route('/api/portfolio/contact', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          })
        }, 2000)
      })
      
      // Fill and submit form
      await page.fill('[data-testid="contact-name"]', 'John Doe')
      await page.fill('[data-testid="contact-email"]', 'john@example.com')
      await page.fill('[data-testid="contact-message"]', 'Test message')
      await page.click('[data-testid="contact-submit"]')
      
      // Should show loading state
      await expect(page.locator('[data-testid="contact-submit"]')).toBeDisabled()
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    })
  })

  test.describe('Blog Section', () => {
    test('should navigate to blog page', async ({ page }) => {
      await page.goto('/')
      
      await page.click('[data-testid="nav-blog"]')
      await page.waitForURL('/blog')
      
      // Should display blog page
      await expect(page.locator('[data-testid="blog-page"]')).toBeVisible()
      await expect(page.locator('h1')).toContainText('Blog')
    })

    test('should display blog posts', async ({ page }) => {
      await page.goto('/blog')
      
      // Should show blog posts or empty state
      const blogPosts = page.locator('[data-testid="blog-post-card"]')
      const emptyState = page.locator('[data-testid="no-posts"]')
      
      const hasPosts = await blogPosts.count() > 0
      const hasEmptyState = await emptyState.isVisible()
      
      expect(hasPosts || hasEmptyState).toBe(true)
      
      if (hasPosts) {
        // Check first post has required elements
        const firstPost = blogPosts.first()
        await expect(firstPost.locator('[data-testid="post-title"]')).toBeVisible()
        await expect(firstPost.locator('[data-testid="post-excerpt"]')).toBeVisible()
        await expect(firstPost.locator('[data-testid="post-date"]')).toBeVisible()
        await expect(firstPost.locator('[data-testid="post-read-more"]')).toBeVisible()
      }
    })

    test('should navigate to individual blog post', async ({ page }) => {
      await page.goto('/blog')
      
      const blogPosts = page.locator('[data-testid="blog-post-card"]')
      const postCount = await blogPosts.count()
      
      if (postCount > 0) {
        // Click on first post
        await blogPosts.first().locator('[data-testid="post-read-more"]').click()
        
        // Should navigate to post page
        await expect(page).toHaveURL(/\/blog\/[^\/]+/)
        
        // Should display post content
        await expect(page.locator('[data-testid="blog-post"]')).toBeVisible()
        await expect(page.locator('[data-testid="post-title"]')).toBeVisible()
        await expect(page.locator('[data-testid="post-content"]')).toBeVisible()
        await expect(page.locator('[data-testid="post-meta"]')).toBeVisible()
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      
      // Should show mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      
      // Desktop navigation should be hidden
      const desktopNav = page.locator('[data-testid="desktop-nav"]')
      await expect(desktopNav).toHaveClass(/hidden|md:block/)
      
      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
      
      // Test mobile navigation
      await page.click('[data-testid="mobile-nav-about"]')
      await page.waitForTimeout(1000)
      await expect(page.locator('[data-testid="about-section"]')).toBeInViewport()
    })

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/')
      
      // Should show appropriate layout for tablet
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="main-nav"]')).toBeVisible()
      
      // Content should be properly sized
      const heroSection = page.locator('[data-testid="hero-section"]')
      const boundingBox = await heroSection.boundingBox()
      expect(boundingBox?.width).toBeLessThanOrEqual(768)
    })
  })

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should have good Core Web Vitals', async ({ page }) => {
      await page.goto('/')
      
      // Measure Largest Contentful Paint (LCP)
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            resolve(lastEntry.startTime)
          }).observe({ entryTypes: ['largest-contentful-paint'] })
          
          // Fallback timeout
          setTimeout(() => resolve(0), 5000)
        })
      })
      
      // LCP should be under 2.5 seconds
      expect(lcp).toBeLessThan(2500)
    })
  })
})

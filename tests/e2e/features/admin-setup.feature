# Admin Setup and Configuration Features
Feature: Portfolio CMS Admin Setup and Configuration
  As a new user of the Portfolio CMS
  I want to easily set up and configure my portfolio
  So that I can have a professional portfolio without technical knowledge

  Background:
    Given I have a fresh Portfolio CMS installation
    And the database is clean
    And no configuration exists

  @setup @critical
  Scenario: Complete portfolio setup wizard
    Given I navigate to the portfolio homepage
    When I am redirected to the setup wizard
    And I complete the personal information step with:
      | field    | value                           |
      | name     | John Developer                  |
      | title    | Full Stack Developer            |
      | tagline  | Building amazing web solutions  |
      | email    | john@example.com               |
      | location | San Francisco, CA              |
      | bio      | Passionate developer with 5+ years experience |
    And I complete the social links step with:
      | platform | url                              |
      | github   | https://github.com/johndev      |
      | linkedin | https://linkedin.com/in/johndev |
      | twitter  | https://twitter.com/johndev     |
    And I configure features:
      | feature   | enabled |
      | ai        | true    |
      | analytics | true    |
      | pwa       | true    |
      | blog      | true    |
      | contact   | true    |
    And I select theme configuration:
      | setting      | value   |
      | theme        | default |
      | primaryColor | #2563eb |
      | mode         | system  |
    And I complete the setup wizard
    Then I should see a success message
    And I should be redirected to the admin dashboard
    And the portfolio should be marked as configured

  @setup @validation
  Scenario: Setup wizard validation
    Given I navigate to the setup wizard
    When I try to proceed without entering required information
    Then I should see validation errors for:
      | field | error                    |
      | name  | Name is required         |
      | title | Professional title is required |
      | email | Valid email is required  |
    And the next button should be disabled
    When I enter valid information
    Then the validation errors should disappear
    And the next button should be enabled

  @setup @navigation
  Scenario: Setup wizard navigation
    Given I am on the setup wizard
    When I complete the first step
    And I click next
    Then I should be on step 2
    When I click previous
    Then I should be on step 1
    And my entered data should be preserved

  @admin @authentication
  Scenario: Admin dashboard access control
    Given the portfolio is configured
    When I navigate to "/admin" without authentication
    Then I should be redirected to the login page
    When I login with valid credentials
    Then I should access the admin dashboard
    And I should see all navigation items:
      | item         |
      | Dashboard    |
      | Content      |
      | Blog         |
      | Contact      |
      | Media        |
      | Analytics    |
      | Settings     |
      | API Keys     |

  @admin @dashboard
  Scenario: Admin dashboard functionality
    Given I am logged into the admin dashboard
    Then I should see dashboard statistics:
      | metric           | type    |
      | Total Posts      | number  |
      | Published Posts  | number  |
      | Total Views      | number  |
      | Total Contacts   | number  |
      | Unread Contacts  | number  |
    And I should see recent activity feed
    And I should see quick action buttons
    And all dashboard widgets should load without errors

  @admin @responsive
  Scenario: Admin dashboard responsive design
    Given I am logged into the admin dashboard
    When I resize the browser to mobile size
    Then the navigation should collapse to a hamburger menu
    And all dashboard content should be mobile-friendly
    When I resize to tablet size
    Then the layout should adapt appropriately
    When I resize to desktop size
    Then the full navigation should be visible

  @api-keys @configuration
  Scenario: OpenAI API key configuration
    Given I am logged into the admin dashboard
    When I navigate to "Settings > API Keys"
    Then I should see the API keys configuration page
    And I should see OpenAI integration section with "Not Connected" status
    When I enter a valid OpenAI API key "sk-test-key-123"
    And I click "Test Connection"
    Then I should see a loading indicator
    And I should see "OpenAI connection successful!" message
    And the status should change to "Connected"
    When I save the settings
    Then I should see "API key settings saved successfully!" message

  @api-keys @validation
  Scenario: API key validation and error handling
    Given I am on the API keys configuration page
    When I enter an invalid OpenAI API key "invalid-key"
    And I click "Test Connection"
    Then I should see "OpenAI connection failed. Please check your API key." error
    And the status should remain "Not Connected"
    When I leave the API key field empty
    And I click "Test Connection"
    Then I should see "Please enter an OpenAI API key first" error

  @ai @content-generation
  Scenario: AI content generation with configured API key
    Given I have configured a valid OpenAI API key
    And I am on the content management page
    When I click on "Generate with AI" for portfolio summary
    Then I should see the AI content generator modal
    When I select tone "professional" and length "medium"
    And I click "Generate Content"
    Then I should see a loading indicator
    And I should see generated content variations
    When I select a variation and click "Use This Content"
    Then the content should be inserted into the form
    And the modal should close

  @ai @no-api-key
  Scenario: AI content generation without API key
    Given I have not configured an OpenAI API key
    And I am on the content management page
    When I see the AI content generator section
    Then I should see a helpful message about configuring OpenAI
    And I should see a "Configure OpenAI API Key" button
    When I click the configure button
    Then I should be taken to the API keys settings page

  @pwa @installation
  Scenario: Progressive Web App functionality
    Given I am on the portfolio homepage
    And the PWA is enabled
    When the page loads completely
    Then I should see an install prompt after a few seconds
    When I click "Install App"
    Then the portfolio should install as a PWA
    And I should be able to access it offline

  @analytics @tracking
  Scenario: Analytics data collection
    Given analytics are enabled
    And I am on the portfolio homepage
    When I navigate through different pages
    Then page views should be tracked
    And session data should be recorded
    When I visit the admin analytics dashboard
    Then I should see visitor statistics
    And I should see page performance metrics

  @blog @management
  Scenario: Blog post management
    Given I am logged into the admin dashboard
    When I navigate to "Blog Posts"
    Then I should see the blog management interface
    When I click "Create New Post"
    And I fill in the blog post form:
      | field   | value                    |
      | title   | My First Blog Post       |
      | content | This is my first post... |
      | status  | published                |
    And I save the post
    Then I should see "Post saved successfully!" message
    And the post should appear in the blog list

  @contact @form
  Scenario: Contact form functionality
    Given I am on the portfolio contact page
    When I fill in the contact form:
      | field   | value                |
      | name    | Jane Visitor         |
      | email   | jane@example.com     |
      | subject | Project Inquiry      |
      | message | I'd like to discuss... |
    And I submit the form
    Then I should see "Message sent successfully!" confirmation
    When I check the admin contact messages
    Then I should see the new message in the inbox

  @media @upload
  Scenario: Media library management
    Given I am logged into the admin dashboard
    When I navigate to "Media Library"
    Then I should see the media management interface
    When I upload an image file "test-image.jpg"
    Then I should see an upload progress indicator
    And the image should appear in the media library
    When I click on the uploaded image
    Then I should see image details and options
    And I should be able to copy the image URL

  @settings @theme
  Scenario: Theme customization
    Given I am logged into the admin dashboard
    When I navigate to "Settings"
    Then I should see theme customization options
    When I change the primary color to "#ff6b6b"
    And I change the theme to "dark"
    And I save the settings
    Then I should see "Settings saved successfully!" message
    When I visit the portfolio homepage
    Then the new theme should be applied
    And the primary color should be updated

  @performance @loading
  Scenario: Page loading performance
    Given I am on the portfolio homepage
    When the page loads
    Then the page should load within 3 seconds
    And the Largest Contentful Paint should be under 2.5 seconds
    And the First Input Delay should be under 100ms
    And the Cumulative Layout Shift should be under 0.1

  @accessibility @compliance
  Scenario: Accessibility compliance
    Given I am on any portfolio page
    Then the page should have proper heading hierarchy
    And all images should have alt text
    And all form inputs should have labels
    And the color contrast should meet WCAG AA standards
    And the page should be navigable with keyboard only
    And screen reader announcements should be appropriate

  @security @authentication
  Scenario: Security and authentication
    Given I have admin credentials
    When I login with correct credentials
    Then I should be authenticated successfully
    When I try to access admin pages without authentication
    Then I should be redirected to login
    When I try to login with incorrect credentials
    Then I should see "Invalid credentials" error
    And I should remain on the login page

  @mobile @responsive
  Scenario: Mobile responsiveness
    Given I am using a mobile device
    When I visit the portfolio homepage
    Then the layout should be mobile-optimized
    And all content should be readable without zooming
    And navigation should work with touch gestures
    And forms should be easy to fill on mobile
    When I rotate the device
    Then the layout should adapt to the new orientation

  @seo @optimization
  Scenario: SEO optimization
    Given I am on the portfolio homepage
    Then the page should have proper meta tags
    And the title should be descriptive
    And the meta description should be present
    And Open Graph tags should be configured
    And the page should have structured data
    And the sitemap should be accessible at "/sitemap.xml"

  @error @handling
  Scenario: Error handling and recovery
    Given I am using the portfolio
    When a network error occurs
    Then I should see a user-friendly error message
    And the application should attempt to recover
    When I encounter a 404 page
    Then I should see a custom 404 page
    And I should have navigation options to return to the site
    When JavaScript fails to load
    Then the basic functionality should still work

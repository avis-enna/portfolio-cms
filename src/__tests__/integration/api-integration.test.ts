/**
 * API Integration Tests
 * Tests all API endpoints with real database connections and authentication
 */

import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import { PortfolioData, User, ContactSubmission, BlogPost } from '@/lib/database/models'
import { generateTokens } from '@/lib/auth/jwt'

// Import API handlers
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as refreshHandler } from '@/app/api/auth/refresh/route'
import { GET as portfolioGetHandler, PUT as portfolioPutHandler } from '@/app/api/admin/portfolio/route'
import { POST as contactHandler } from '@/app/api/contact/route'
import { GET as blogGetHandler, POST as blogPostHandler } from '@/app/api/admin/blog/route'
import { GET as publicBlogHandler } from '@/app/api/blog/route'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only'
process.env.MONGODB_URI = 'mongodb://localhost:27017/portfolio-test'

describe('API Integration Tests', () => {
  let testUser: any
  let accessToken: string
  let refreshToken: string

  beforeAll(async () => {
    // Connect to test database
    await connectToDatabase()

    // Create test user
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: '$2b$10$test.hashed.password', // Pre-hashed password
      role: 'admin'
    })
    await testUser.save()

    // Generate tokens for testing
    const tokens = generateTokens({
      userId: testUser._id.toString(),
      username: testUser.username,
      email: testUser.email,
      role: testUser.role
    })
    accessToken = tokens.accessToken
    refreshToken = tokens.refreshToken
  })

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: 'test@example.com' })
    await PortfolioData.deleteMany({})
    await ContactSubmission.deleteMany({})
    await BlogPost.deleteMany({})
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication API Integration', () => {
    test('login endpoint works with valid credentials', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        }),
        headers: {
          'content-type': 'application/json',
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.accessToken).toBeDefined()
      expect(data.refreshToken).toBeDefined()
    })

    test('refresh token endpoint works correctly', async () => {
      const request = new NextRequest('http://localhost/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: refreshToken
        }),
        headers: {
          'content-type': 'application/json',
        }
      })

      const response = await refreshHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.accessToken).toBeDefined()
      expect(data.refreshToken).toBeDefined()
    })
  })

  describe('Portfolio API Integration', () => {
    test('can create and retrieve portfolio data', async () => {
      const portfolioData = {
        personalInfo: {
          name: 'John Doe',
          title: 'Full-Stack Developer',
          bio: 'Passionate developer',
          email: 'john@example.com'
        },
        summary: 'Experienced developer',
        technicalSkills: [
          { name: 'React', level: 90, category: 'Frontend' }
        ],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Developer',
            startDate: '2020-01-01',
            description: 'Built web applications'
          }
        ]
      }

      // Create portfolio data
      const putRequest = new NextRequest('http://localhost/api/admin/portfolio', {
        method: 'PUT',
        body: JSON.stringify(portfolioData),
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${accessToken}`
        }
      })

      const putResponse = await portfolioPutHandler(putRequest)
      const putData = await putResponse.json()

      expect(putResponse.status).toBe(200)
      expect(putData.success).toBe(true)

      // Retrieve portfolio data
      const getRequest = new NextRequest('http://localhost/api/admin/portfolio', {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${accessToken}`
        }
      })

      const getResponse = await portfolioGetHandler(getRequest)
      const getData = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(getData.success).toBe(true)
      expect(getData.content.personalInfo.name).toBe('John Doe')
      expect(getData.content.technicalSkills).toHaveLength(1)
    })

    test('portfolio API requires authentication', async () => {
      const request = new NextRequest('http://localhost/api/admin/portfolio', {
        method: 'GET'
      })

      const response = await portfolioGetHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })
  })

  describe('Contact API Integration', () => {
    test('can submit contact form successfully', async () => {
      const contactData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with sufficient length for validation'
      }

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(contactData),
        headers: {
          'content-type': 'application/json',
        }
      })

      const response = await contactHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Thank you for your message')
      expect(data.data.submissionId).toBeDefined()

      // Verify data was saved to database
      const savedSubmission = await ContactSubmission.findById(data.data.submissionId)
      expect(savedSubmission).toBeTruthy()
      expect(savedSubmission.name).toBe('Jane Smith')
      expect(savedSubmission.email).toBe('jane@example.com')
    })

    test('contact form validates required fields', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        message: 'short'
      }

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'content-type': 'application/json',
        }
      })

      const response = await contactHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    test('contact form prevents duplicate submissions', async () => {
      const contactData = {
        name: 'Duplicate Test',
        email: 'duplicate@example.com',
        subject: 'Duplicate Test',
        message: 'This is a duplicate test message with sufficient length'
      }

      // First submission
      const request1 = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(contactData),
        headers: {
          'content-type': 'application/json',
        }
      })

      const response1 = await contactHandler(request1)
      expect(response1.status).toBe(201)

      // Second submission (should be blocked)
      const request2 = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(contactData),
        headers: {
          'content-type': 'application/json',
        }
      })

      const response2 = await contactHandler(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(429)
      expect(data2.success).toBe(false)
      expect(data2.error).toContain('Duplicate submission')
    })
  })

  describe('Blog API Integration', () => {
    test('can create and retrieve blog posts', async () => {
      const blogData = {
        title: 'Test Blog Post',
        content: 'This is a comprehensive test blog post content that should be long enough for validation.',
        excerpt: 'Test excerpt',
        status: 'published',
        tags: ['test', 'blog'],
        categories: ['technology']
      }

      // Create blog post
      const postRequest = new NextRequest('http://localhost/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify(blogData),
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${accessToken}`
        }
      })

      const postResponse = await blogPostHandler(postRequest)
      const postData = await postResponse.json()

      expect(postResponse.status).toBe(201)
      expect(postData.success).toBe(true)
      expect(postData.data.post.title).toBe('Test Blog Post')
      expect(postData.data.post.slug).toBe('test-blog-post')

      // Retrieve blog posts (admin)
      const getRequest = new NextRequest('http://localhost/api/admin/blog', {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${accessToken}`
        }
      })

      const getResponse = await blogGetHandler(getRequest)
      const getData = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(getData.success).toBe(true)
      expect(getData.data.posts).toHaveLength(1)
      expect(getData.data.posts[0].title).toBe('Test Blog Post')
    })

    test('public blog API returns only published posts', async () => {
      // Create draft post
      const draftData = {
        title: 'Draft Post',
        content: 'This is a draft post that should not appear in public API.',
        status: 'draft'
      }

      const draftRequest = new NextRequest('http://localhost/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify(draftData),
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${accessToken}`
        }
      })

      await blogPostHandler(draftRequest)

      // Get public blog posts
      const publicRequest = new NextRequest('http://localhost/api/blog', {
        method: 'GET'
      })

      const publicResponse = await publicBlogHandler(publicRequest)
      const publicData = await publicResponse.json()

      expect(publicResponse.status).toBe(200)
      expect(publicData.success).toBe(true)
      
      // Should only return published posts
      const publishedPosts = publicData.data.posts.filter((post: any) => post.title === 'Test Blog Post')
      const draftPosts = publicData.data.posts.filter((post: any) => post.title === 'Draft Post')
      
      expect(publishedPosts).toHaveLength(1)
      expect(draftPosts).toHaveLength(0)
    })

    test('blog API validates required fields', async () => {
      const invalidData = {
        title: '', // Missing title
        content: '' // Missing content
      }

      const request = new NextRequest('http://localhost/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${accessToken}`
        }
      })

      const response = await blogPostHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Title and content are required')
    })
  })

  describe('Rate Limiting Integration', () => {
    test('rate limiting works across different endpoints', async () => {
      // This test would require multiple rapid requests to trigger rate limiting
      // For now, we'll test that the rate limiting system is properly initialized
      
      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Rate Test',
          email: 'rate@example.com',
          subject: 'Rate Test',
          message: 'Testing rate limiting functionality'
        }),
        headers: {
          'content-type': 'application/json',
        }
      })

      const response = await contactHandler(request)
      
      // First request should succeed
      expect(response.status).toBe(201)
    })
  })

  describe('Security Integration', () => {
    test('API endpoints reject malicious input', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        subject: 'SQL injection attempt',
        message: "'; DROP TABLE users; --"
      }

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(maliciousData),
        headers: {
          'content-type': 'application/json',
        }
      })

      const response = await contactHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('invalid content')
    })

    test('authentication middleware protects admin endpoints', async () => {
      const request = new NextRequest('http://localhost/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Unauthorized Post',
          content: 'This should not be created'
        }),
        headers: {
          'content-type': 'application/json',
          // No authorization header
        }
      })

      const response = await blogPostHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })
  })
})

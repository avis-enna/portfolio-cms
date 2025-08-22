/**
 * Blog API endpoint tests
 */

import { NextRequest } from 'next/server'
import { GET as getBlogPosts, POST as createBlogPost } from '../admin/blog/route'
import { GET as getBlogPost, PUT as updateBlogPost, DELETE as deleteBlogPost } from '../admin/blog/[id]/route'
import { GET as getPublicBlogPosts } from '../blog/route'
import { GET as getPublicBlogPost } from '../blog/[slug]/route'

// Mock dependencies
jest.mock('@/lib/database/connection')
jest.mock('@/lib/database/models')
jest.mock('@/lib/auth/middleware')
jest.mock('@/lib/auth/rateLimiter')
jest.mock('@/lib/auth/securityAudit')

const mockBlogPost = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  content: 'This is a test blog post content.',
  excerpt: 'This is a test excerpt.',
  status: 'published',
  author: {
    _id: '507f1f77bcf86cd799439012',
    username: 'testuser',
    email: 'test@example.com'
  },
  publishedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  tags: ['test', 'blog'],
  categories: ['technology'],
  featuredImage: '/uploads/image/test.jpg',
  readingTime: 5,
  viewCount: 100,
  displayOrder: 1,
  seoMetadata: {
    title: 'Test Blog Post',
    description: 'This is a test excerpt.',
    keywords: ['test', 'blog']
  }
}

describe('Admin Blog API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock auth middleware
    const { requireAuth } = require('@/lib/auth/middleware')
    requireAuth.mockResolvedValue({
      success: true,
      user: { userId: '507f1f77bcf86cd799439012', username: 'testuser' }
    })

    // Mock rate limiter
    const { apiRateLimiter, getClientIdentifier } = require('@/lib/auth/rateLimiter')
    apiRateLimiter.isRateLimited.mockReturnValue(false)
    getClientIdentifier.mockReturnValue('test-client')

    // Mock database connection
    const { connectToDatabase } = require('@/lib/database/connection')
    connectToDatabase.mockResolvedValue(true)
  })

  describe('GET /api/admin/blog', () => {
    test('should return paginated blog posts', async () => {
      const { BlogPost } = require('@/lib/database/models')
      BlogPost.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([mockBlogPost])
              })
            })
          })
        })
      })
      BlogPost.countDocuments.mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/admin/blog?page=1&limit=10')
      const response = await getBlogPosts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.posts).toHaveLength(1)
      expect(data.data.pagination.totalCount).toBe(1)
    })

    test('should handle search queries', async () => {
      const { BlogPost } = require('@/lib/database/models')
      BlogPost.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      })
      BlogPost.countDocuments.mockResolvedValue(0)

      const request = new NextRequest('http://localhost/api/admin/blog?search=test&status=published')
      const response = await getBlogPosts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(BlogPost.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          $or: expect.any(Array)
        })
      )
    })

    test('should handle rate limiting', async () => {
      const { apiRateLimiter } = require('@/lib/auth/rateLimiter')
      apiRateLimiter.isRateLimited.mockReturnValue(true)
      apiRateLimiter.getStatus.mockReturnValue({
        timeUntilUnblocked: 30000,
        remainingAttempts: 0
      })

      const request = new NextRequest('http://localhost/api/admin/blog')
      const response = await getBlogPosts(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Too many requests')
    })

    test('should handle authentication failure', async () => {
      const { requireAuth } = require('@/lib/auth/middleware')
      requireAuth.mockResolvedValue({
        success: false,
        error: 'Invalid token'
      })

      const request = new NextRequest('http://localhost/api/admin/blog')
      const response = await getBlogPosts(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid token')
    })
  })

  describe('POST /api/admin/blog', () => {
    test('should create a new blog post', async () => {
      const { BlogPost } = require('@/lib/database/models')
      
      const mockSave = jest.fn().mockResolvedValue(mockBlogPost)
      const mockPopulate = jest.fn().mockResolvedValue(mockBlogPost)
      
      BlogPost.mockImplementation(() => ({
        save: mockSave,
        populate: mockPopulate,
        ...mockBlogPost
      }))
      
      BlogPost.findOne.mockResolvedValue(null) // No existing slug
      BlogPost.findOne.mockResolvedValueOnce(null) // For slug uniqueness check

      const requestBody = {
        title: 'New Blog Post',
        content: 'This is the content of the new blog post.',
        excerpt: 'This is the excerpt.',
        status: 'draft',
        tags: ['new', 'test'],
        categories: ['technology']
      }

      const request = new NextRequest('http://localhost/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createBlogPost(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.post.title).toBe('New Blog Post')
    })

    test('should validate required fields', async () => {
      const requestBody = {
        title: '', // Missing title
        content: 'This is the content.'
      }

      const request = new NextRequest('http://localhost/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createBlogPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Title and content are required')
    })

    test('should validate field lengths', async () => {
      const requestBody = {
        title: 'a'.repeat(201), // Too long
        content: 'This is the content.'
      }

      const request = new NextRequest('http://localhost/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createBlogPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Title must be 200 characters or less')
    })

    test('should generate unique slug', async () => {
      const { BlogPost } = require('@/lib/database/models')
      
      // Mock existing slug
      BlogPost.findOne
        .mockResolvedValueOnce({ slug: 'test-title' }) // First check finds existing
        .mockResolvedValueOnce(null) // Second check with counter is unique

      const mockSave = jest.fn().mockResolvedValue({
        ...mockBlogPost,
        slug: 'test-title-1'
      })
      const mockPopulate = jest.fn().mockResolvedValue({
        ...mockBlogPost,
        slug: 'test-title-1'
      })
      
      BlogPost.mockImplementation(() => ({
        save: mockSave,
        populate: mockPopulate,
        ...mockBlogPost,
        slug: 'test-title-1'
      }))

      const requestBody = {
        title: 'Test Title',
        content: 'This is the content.'
      }

      const request = new NextRequest('http://localhost/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createBlogPost(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })
  })

  describe('GET /api/admin/blog/[id]', () => {
    test('should return specific blog post', async () => {
      const { BlogPost } = require('@/lib/database/models')
      BlogPost.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockBlogPost)
        })
      })

      const response = await getBlogPost(
        new NextRequest('http://localhost/api/admin/blog/507f1f77bcf86cd799439011'),
        { params: { id: '507f1f77bcf86cd799439011' } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.post.id).toBe('507f1f77bcf86cd799439011')
    })

    test('should validate ID format', async () => {
      const response = await getBlogPost(
        new NextRequest('http://localhost/api/admin/blog/invalid-id'),
        { params: { id: 'invalid-id' } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid blog post ID format')
    })

    test('should handle not found', async () => {
      const { BlogPost } = require('@/lib/database/models')
      BlogPost.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null)
        })
      })

      const response = await getBlogPost(
        new NextRequest('http://localhost/api/admin/blog/507f1f77bcf86cd799439011'),
        { params: { id: '507f1f77bcf86cd799439011' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Blog post not found')
    })
  })
})

describe('Public Blog API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock rate limiter
    const { apiRateLimiter, getClientIdentifier } = require('@/lib/auth/rateLimiter')
    apiRateLimiter.isRateLimited.mockReturnValue(false)
    getClientIdentifier.mockReturnValue('test-client')

    // Mock database connection
    const { connectToDatabase } = require('@/lib/database/connection')
    connectToDatabase.mockResolvedValue(true)
  })

  describe('GET /api/blog', () => {
    test('should return published blog posts only', async () => {
      const { BlogPost } = require('@/lib/database/models')
      BlogPost.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([mockBlogPost])
                })
              })
            })
          })
        })
      })
      BlogPost.countDocuments.mockResolvedValue(1)
      BlogPost.distinct.mockResolvedValue(['technology'])

      const request = new NextRequest('http://localhost/api/blog')
      const response = await getPublicBlogPosts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.posts).toHaveLength(1)
      expect(BlogPost.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published' })
      )
    })

    test('should handle search and filtering', async () => {
      const { BlogPost } = require('@/lib/database/models')
      BlogPost.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([])
                })
              })
            })
          })
        })
      })
      BlogPost.countDocuments.mockResolvedValue(0)
      BlogPost.distinct.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/blog?search=test&category=technology&tag=javascript')
      const response = await getPublicBlogPosts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(BlogPost.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          $or: expect.any(Array),
          categories: { $in: ['technology'] },
          tags: { $in: ['javascript'] }
        })
      )
    })
  })

  describe('GET /api/blog/[slug]', () => {
    test('should return published blog post by slug', async () => {
      const { BlogPost } = require('@/lib/database/models')
      BlogPost.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockBlogPost)
        })
      })
      BlogPost.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([])
            })
          })
        })
      })
      BlogPost.findByIdAndUpdate.mockResolvedValue(true)

      const response = await getPublicBlogPost(
        new NextRequest('http://localhost/api/blog/test-blog-post'),
        { params: { slug: 'test-blog-post' } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.post.slug).toBe('test-blog-post')
      expect(BlogPost.findOne).toHaveBeenCalledWith({
        slug: 'test-blog-post',
        status: 'published'
      })
    })

    test('should validate slug format', async () => {
      const response = await getPublicBlogPost(
        new NextRequest('http://localhost/api/blog/invalid-slug!'),
        { params: { slug: 'invalid-slug!' } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid slug format')
    })

    test('should increment view count', async () => {
      const { BlogPost } = require('@/lib/database/models')
      BlogPost.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockBlogPost)
        })
      })
      BlogPost.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([])
            })
          })
        })
      })
      BlogPost.findByIdAndUpdate.mockResolvedValue(true)

      await getPublicBlogPost(
        new NextRequest('http://localhost/api/blog/test-blog-post'),
        { params: { slug: 'test-blog-post' } }
      )

      expect(BlogPost.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBlogPost._id,
        { $inc: { viewCount: 1 } },
        { new: false }
      )
    })
  })
})

import { NextRequest } from 'next/server'
import { GET, PUT } from '../route'
import { connectToDatabase } from '@/lib/database/connection'
import { requireAuth } from '@/lib/auth/middleware'

// Mock dependencies
jest.mock('@/lib/database/connection')
jest.mock('@/lib/auth/middleware')

// Mock PortfolioContent model
jest.mock('@/lib/database/models/PortfolioContent', () => ({
  PortfolioContent: {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}))

// Mock mongoose to avoid BSON issues
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    readyState: 1,
  },
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    methods: {},
    statics: {},
    index: jest.fn(),
    set: jest.fn(),
  })),
  model: jest.fn(),
  models: {},
  Types: {
    ObjectId: jest.fn(),
  },
}))

const mockConnect = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>

// Get the mocked PortfolioContent
const { PortfolioContent: mockPortfolioContent } = jest.requireMock('@/lib/database/models/PortfolioContent')

describe('/api/admin/content', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnect.mockResolvedValue({} as any)
  })

  describe('GET', () => {
    it('should return portfolio content for authenticated user', async () => {
      const mockContent = {
        _id: 'content123',
        personalInfo: {
          name: 'John Doe',
          title: 'Software Developer',
          email: 'john@example.com',
          phone: '+1234567890',
          location: 'New York, NY',
          bio: 'Experienced software developer...',
        },
        skills: {
          technical: ['JavaScript', 'TypeScript', 'React'],
          soft: ['Communication', 'Leadership'],
          tools: ['Git', 'Docker', 'AWS'],
        },
        experience: [{
          company: 'Tech Corp',
          position: 'Senior Developer',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-01-01'),
          description: 'Led development team...',
          achievements: ['Increased performance by 50%'],
        }],
        education: [{
          institution: 'University of Tech',
          degree: 'Bachelor of Computer Science',
          startDate: new Date('2016-09-01'),
          endDate: new Date('2020-05-01'),
          gpa: 3.8,
        }],
        projects: [{
          name: 'Portfolio CMS',
          description: 'A content management system...',
          technologies: ['Next.js', 'MongoDB'],
          githubUrl: 'https://github.com/user/portfolio-cms',
          liveUrl: 'https://portfolio.example.com',
          status: 'completed',
        }],
        certifications: [{
          name: 'AWS Certified Developer',
          issuer: 'Amazon Web Services',
          issueDate: new Date('2022-01-01'),
          expiryDate: new Date('2025-01-01'),
          credentialId: 'AWS123456',
        }],
        seo: {
          title: 'John Doe - Software Developer',
          description: 'Experienced software developer specializing in...',
          keywords: ['software developer', 'javascript', 'react'],
        },
        toJSON: jest.fn().mockReturnValue({
          _id: 'content123',
          personalInfo: {
            name: 'John Doe',
            title: 'Software Developer',
          },
        }),
      }

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: { userId: 'user123', username: 'admin', email: 'admin@test.com' },
      })
      mockPortfolioContent.findOne.mockResolvedValue(mockContent)

      const request = new NextRequest('http://localhost/api/admin/content', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.content).toBeDefined()
      expect(mockPortfolioContent.findOne).toHaveBeenCalled()
    })

    it('should reject unauthenticated requests', async () => {
      mockRequireAuth.mockResolvedValue({
        success: false,
        error: 'Authentication required',
      })

      const request = new NextRequest('http://localhost/api/admin/content', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should create default content if none exists', async () => {
      const mockDefaultContent = {
        _id: 'new-content',
        personalInfo: { name: '', title: '', email: '', bio: '' },
        toJSON: jest.fn().mockReturnValue({ _id: 'new-content' }),
      }

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: { userId: 'user123', username: 'admin', email: 'admin@test.com' },
      })
      mockPortfolioContent.findOne.mockResolvedValue(null)
      mockPortfolioContent.create.mockResolvedValue(mockDefaultContent)

      const request = new NextRequest('http://localhost/api/admin/content', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.content).toBeDefined()
      expect(mockPortfolioContent.create).toHaveBeenCalled()
    })

    it('should handle database connection errors', async () => {
      mockRequireAuth.mockResolvedValue({
        success: true,
        user: { userId: 'user123', username: 'admin', email: 'admin@test.com' },
      })
      mockConnect.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost/api/admin/content', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('PUT', () => {
    it('should update portfolio content for authenticated user', async () => {
      const updateData = {
        personalInfo: {
          name: 'Jane Doe',
          title: 'Senior Software Developer',
          email: 'jane@example.com',
          bio: 'Updated bio...',
        },
        skills: {
          technical: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
        },
      }

      const mockUpdatedContent = {
        _id: 'content123',
        ...updateData,
        toJSON: jest.fn().mockReturnValue({ _id: 'content123', ...updateData }),
      }

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: { userId: 'user123', username: 'admin', email: 'admin@test.com' },
      })
      mockPortfolioContent.findOneAndUpdate.mockResolvedValue(mockUpdatedContent)

      const request = new NextRequest('http://localhost/api/admin/content', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.content).toBeDefined()
      expect(mockPortfolioContent.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        updateData,
        { new: true, upsert: true, runValidators: true }
      )
    })

    it('should reject unauthenticated requests', async () => {
      mockRequireAuth.mockResolvedValue({
        success: false,
        error: 'Authentication required',
      })

      const request = new NextRequest('http://localhost/api/admin/content', {
        method: 'PUT',
        body: JSON.stringify({ personalInfo: { name: 'Test' } }),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should validate content type', async () => {
      mockRequireAuth.mockResolvedValue({
        success: true,
        user: { userId: 'user123', username: 'admin', email: 'admin@test.com' },
      })

      const request = new NextRequest('http://localhost/api/admin/content', {
        method: 'PUT',
        body: 'name=test',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/x-www-form-urlencoded',
        },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Content-Type must be application/json')
    })

    it('should handle invalid JSON', async () => {
      mockRequireAuth.mockResolvedValue({
        success: true,
        user: { userId: 'user123', username: 'admin', email: 'admin@test.com' },
      })

      const request = new NextRequest('http://localhost/api/admin/content', {
        method: 'PUT',
        body: '{"name": "test",}',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid JSON in request body')
    })

    it('should handle database update errors', async () => {
      mockRequireAuth.mockResolvedValue({
        success: true,
        user: { userId: 'user123', username: 'admin', email: 'admin@test.com' },
      })
      mockPortfolioContent.findOneAndUpdate.mockRejectedValue(new Error('Update failed'))

      const request = new NextRequest('http://localhost/api/admin/content', {
        method: 'PUT',
        body: JSON.stringify({ personalInfo: { name: 'Test' } }),
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })
})

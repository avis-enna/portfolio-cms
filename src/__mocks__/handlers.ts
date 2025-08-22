import { http, HttpResponse } from 'msw'

// Mock data
const mockPortfolioContent = {
  _id: '507f1f77bcf86cd799439011',
  summary: 'Experienced Software Engineer specializing in scalable systems',
  technical_skills: [
    {
      category: 'AI & Machine Learning',
      skills: ['TensorFlow', 'PyTorch', 'Scikit-learn']
    },
    {
      category: 'Cloud & DevOps',
      skills: ['AWS', 'Docker', 'Kubernetes']
    }
  ],
  soft_skills: ['Leadership', 'Problem Solving', 'Communication'],
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'Cisco',
      startDate: '2022-01-01',
      endDate: null,
      responsibilities: ['Led development of microservices architecture']
    }
  ],
  education: [
    {
      degree: 'Master of Science in Computer Science',
      institution: 'University of Technology',
      year: '2020'
    }
  ],
  projects: [
    {
      title: 'AI-Powered Analytics Platform',
      description: 'Built scalable analytics platform using machine learning',
      technologies: ['Python', 'TensorFlow', 'AWS'],
      link: 'https://github.com/example/project'
    }
  ],
  certifications: [
    {
      name: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2023-01-01'
    }
  ]
}

const mockBlogPosts = [
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'Building Scalable Microservices',
    slug: 'building-scalable-microservices',
    content: '# Building Scalable Microservices\n\nThis is a comprehensive guide...',
    status: 'published',
    displayOrder: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: 'Machine Learning in Production',
    slug: 'machine-learning-in-production',
    content: '# Machine Learning in Production\n\nDeploying ML models...',
    status: 'draft',
    displayOrder: 2,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  }
]

const mockContactSubmissions = [
  {
    _id: '507f1f77bcf86cd799439014',
    name: 'John Doe',
    email: 'john@example.com',
    message: 'I would like to discuss a project opportunity.',
    isRead: false,
    submittedAt: '2024-01-01T00:00:00.000Z'
  }
]

const mockUser = {
  _id: '507f1f77bcf86cd799439015',
  username: 'admin',
  email: 'admin@portfolio.com'
}

export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { username, password } = await request.json() as any
    
    if (username === 'admin' && password === 'testpassword123') {
      return HttpResponse.json({
        success: true,
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      })
    }
    
    return HttpResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      success: true,
      accessToken: 'new-mock-access-token'
    })
  }),

  // Public portfolio endpoints
  http.get('/api/portfolio/content', () => {
    return HttpResponse.json(mockPortfolioContent)
  }),

  http.get('/api/portfolio/blog', () => {
    const publishedPosts = mockBlogPosts.filter(post => post.status === 'published')
    return HttpResponse.json(publishedPosts)
  }),

  http.get('/api/portfolio/blog/:slug', ({ params }) => {
    const post = mockBlogPosts.find(p => p.slug === params.slug)
    if (!post || post.status !== 'published') {
      return HttpResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json(post)
  }),

  http.post('/api/portfolio/contact', async ({ request }) => {
    const contactData = await request.json() as any
    return HttpResponse.json({
      success: true,
      message: 'Message sent successfully'
    })
  }),

  // Admin endpoints
  http.get('/api/admin/content', () => {
    return HttpResponse.json(mockPortfolioContent)
  }),

  http.put('/api/admin/content', async ({ request }) => {
    const updatedContent = await request.json() as any
    return HttpResponse.json({
      success: true,
      data: { ...mockPortfolioContent, ...updatedContent }
    })
  }),

  http.get('/api/admin/blog', () => {
    return HttpResponse.json(mockBlogPosts)
  }),

  http.post('/api/admin/blog', async ({ request }) => {
    const newPost = await request.json() as any
    const post = {
      _id: '507f1f77bcf86cd799439999',
      ...newPost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return HttpResponse.json(post)
  }),

  http.put('/api/admin/blog/:id', async ({ params, request }) => {
    const updatedPost = await request.json() as any
    const post = mockBlogPosts.find(p => p._id === params.id)
    if (!post) {
      return HttpResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({
      ...post,
      ...updatedPost,
      updatedAt: new Date().toISOString()
    })
  }),

  http.delete('/api/admin/blog/:id', ({ params }) => {
    const postIndex = mockBlogPosts.findIndex(p => p._id === params.id)
    if (postIndex === -1) {
      return HttpResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({ success: true })
  }),

  http.get('/api/admin/contact', () => {
    return HttpResponse.json(mockContactSubmissions)
  }),

  http.put('/api/admin/contact/:id', async ({ params, request }) => {
    const updates = await request.json() as any
    const submission = mockContactSubmissions.find(s => s._id === params.id)
    if (!submission) {
      return HttpResponse.json(
        { message: 'Submission not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({
      ...submission,
      ...updates
    })
  }),

  http.delete('/api/admin/contact/:id', ({ params }) => {
    const submissionIndex = mockContactSubmissions.findIndex(s => s._id === params.id)
    if (submissionIndex === -1) {
      return HttpResponse.json(
        { message: 'Submission not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({ success: true })
  }),

  http.get('/api/admin/logs', () => {
    return HttpResponse.json([
      {
        _id: '507f1f77bcf86cd799439016',
        user: 'admin',
        action: 'UPDATE',
        collectionName: 'blog_posts',
        documentId: '507f1f77bcf86cd799439012',
        timestamp: new Date().toISOString()
      }
    ])
  })
]

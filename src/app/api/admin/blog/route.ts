import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { connectToDatabase } from '@/lib/database/connection'
import { BlogPost } from '@/lib/database/models'
import { apiRateLimiter, getClientIdentifier } from '@/lib/auth/rateLimiter'
import { securityAuditor } from '@/lib/auth/securityAudit'

/**
 * GET /api/admin/blog
 * Get all blog posts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  
  try {
    // Check rate limiting
    if (apiRateLimiter.isRateLimited(clientId)) {
      const status = apiRateLimiter.getStatus(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(status.timeUntilUnblocked / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(status.timeUntilUnblocked / 1000).toString(),
          }
        }
      )
    }

    // Authenticate user
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: 401 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const skip = (page - 1) * limit

    // Build filter query
    let filterQuery: any = {}
    
    if (status !== 'all') {
      filterQuery.status = status
    }

    if (search) {
      filterQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { categories: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Build sort object
    const sortObject: any = {}
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Get blog posts with pagination
    const [posts, totalCount] = await Promise.all([
      BlogPost.find(filterQuery)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .populate('author', 'username email')
        .lean(),
      BlogPost.countDocuments(filterQuery)
    ])

    // Transform posts for frontend
    const transformedPosts = posts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      status: post.status,
      author: post.author,
      publishedAt: post.publishedAt?.toISOString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      tags: post.tags,
      categories: post.categories,
      featuredImage: post.featuredImage,
      readingTime: post.readingTime,
      viewCount: post.viewCount,
      displayOrder: post.displayOrder,
      seoMetadata: post.seoMetadata
    }))

    return NextResponse.json(
      {
        success: true,
        data: {
          posts: transformedPosts,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            hasNextPage: page < Math.ceil(totalCount / limit),
            hasPrevPage: page > 1
          },
          filters: {
            status,
            search,
            sortBy,
            sortOrder
          }
        }
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache',
        }
      }
    )
  } catch (error) {
    console.error('Blog API error:', error)
    apiRateLimiter.recordFailedAttempt(clientId)
    securityAuditor.logSuspiciousActivity(clientId, 'api_error', {
      endpoint: '/api/admin/blog',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/blog
 * Create a new blog post
 */
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  
  try {
    // Check rate limiting
    if (apiRateLimiter.isRateLimited(clientId)) {
      const status = apiRateLimiter.getStatus(clientId)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(status.timeUntilUnblocked / 1000),
        },
        { status: 429 }
      )
    }

    // Authenticate user
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      apiRateLimiter.recordFailedAttempt(clientId)
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      title,
      content,
      excerpt,
      status = 'draft',
      tags = [],
      categories = [],
      featuredImage,
      seoMetadata = {}
    } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and content are required',
          details: {
            title: !title ? 'Title is required' : null,
            content: !content ? 'Content is required' : null
          }
        },
        { status: 400 }
      )
    }

    // Validate field lengths
    if (title.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title must be 200 characters or less',
        },
        { status: 400 }
      )
    }

    if (content.length > 50000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content must be 50,000 characters or less',
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Ensure slug is unique
    let slug = baseSlug
    let counter = 1
    while (await BlogPost.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Calculate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    // Get highest display order for new posts
    const lastPost = await BlogPost.findOne().sort({ displayOrder: -1 })
    const displayOrder = (lastPost?.displayOrder || 0) + 1

    // Create new blog post
    const newPost = new BlogPost({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      status,
      author: authResult.user!.userId,
      tags: Array.isArray(tags) ? tags : [],
      categories: Array.isArray(categories) ? categories : [],
      featuredImage: featuredImage || null,
      readingTime,
      displayOrder,
      seoMetadata: {
        title: seoMetadata.title || title,
        description: seoMetadata.description || excerpt || content.substring(0, 160),
        keywords: seoMetadata.keywords || tags
      },
      publishedAt: status === 'published' ? new Date() : null
    })

    await newPost.save()

    // Populate author for response
    await newPost.populate('author', 'username email')

    return NextResponse.json(
      {
        success: true,
        data: {
          post: {
            id: newPost._id.toString(),
            title: newPost.title,
            slug: newPost.slug,
            excerpt: newPost.excerpt,
            content: newPost.content,
            status: newPost.status,
            author: newPost.author,
            publishedAt: newPost.publishedAt?.toISOString(),
            createdAt: newPost.createdAt.toISOString(),
            updatedAt: newPost.updatedAt.toISOString(),
            tags: newPost.tags,
            categories: newPost.categories,
            featuredImage: newPost.featuredImage,
            readingTime: newPost.readingTime,
            viewCount: newPost.viewCount,
            displayOrder: newPost.displayOrder,
            seoMetadata: newPost.seoMetadata
          }
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Blog creation error:', error)
    apiRateLimiter.recordFailedAttempt(clientId)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

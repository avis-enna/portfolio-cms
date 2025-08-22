import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import { BlogPost } from '@/lib/database/models'
import { apiRateLimiter, getClientIdentifier } from '@/lib/auth/rateLimiter'

/**
 * GET /api/blog
 * Get published blog posts for public consumption
 */
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  
  try {
    // Check rate limiting (more lenient for public API)
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

    // Connect to database
    await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 posts per page
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const tag = searchParams.get('tag') || ''
    const sortBy = searchParams.get('sortBy') || 'publishedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const skip = (page - 1) * limit

    // Build filter query - only published posts
    let filterQuery: any = { status: 'published' }

    if (search) {
      filterQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { categories: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    if (category) {
      filterQuery.categories = { $in: [category] }
    }

    if (tag) {
      filterQuery.tags = { $in: [tag] }
    }

    // Build sort object
    const sortObject: any = {}
    const allowedSortFields = ['publishedAt', 'createdAt', 'title', 'viewCount', 'displayOrder']
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'publishedAt'
    sortObject[safeSortBy] = sortOrder === 'desc' ? -1 : 1

    // Get blog posts with pagination
    const [posts, totalCount] = await Promise.all([
      BlogPost.find(filterQuery)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .select('title slug excerpt publishedAt tags categories featuredImage readingTime viewCount seoMetadata')
        .populate('author', 'username')
        .lean(),
      BlogPost.countDocuments(filterQuery)
    ])

    // Transform posts for public consumption (exclude sensitive data)
    const transformedPosts = posts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      author: {
        username: post.author?.username || 'Anonymous'
      },
      publishedAt: post.publishedAt?.toISOString(),
      tags: post.tags || [],
      categories: post.categories || [],
      featuredImage: post.featuredImage,
      readingTime: post.readingTime || 1,
      viewCount: post.viewCount || 0,
      seoMetadata: {
        title: post.seoMetadata?.title || post.title,
        description: post.seoMetadata?.description || post.excerpt,
        keywords: post.seoMetadata?.keywords || post.tags || []
      }
    }))

    // Get additional metadata for the response
    const [categories, tags] = await Promise.all([
      BlogPost.distinct('categories', { status: 'published' }),
      BlogPost.distinct('tags', { status: 'published' })
    ])

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
            search,
            category,
            tag,
            sortBy: safeSortBy,
            sortOrder
          },
          metadata: {
            availableCategories: categories.filter(Boolean),
            availableTags: tags.filter(Boolean)
          }
        }
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error) {
    console.error('Public blog API error:', error)
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

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
    },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
    },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
    },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
    },
    { status: 405 }
  )
}

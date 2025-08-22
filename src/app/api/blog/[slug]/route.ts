import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import { BlogPost } from '@/lib/database/models'
import { apiRateLimiter, getClientIdentifier } from '@/lib/auth/rateLimiter'

/**
 * GET /api/blog/[slug]
 * Get a specific published blog post by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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

    // Validate slug format
    if (!params.slug || typeof params.slug !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid blog post slug',
        },
        { status: 400 }
      )
    }

    // Sanitize slug
    const slug = params.slug.toLowerCase().trim()
    
    // Basic slug validation
    if (!/^[a-z0-9-]+$/.test(slug) || slug.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid slug format',
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Find the published blog post by slug
    const post = await BlogPost.findOne({ 
      slug, 
      status: 'published' 
    })
    .populate('author', 'username')
    .lean()

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found',
        },
        { status: 404 }
      )
    }

    // Increment view count (fire and forget)
    BlogPost.findByIdAndUpdate(
      post._id,
      { $inc: { viewCount: 1 } },
      { new: false }
    ).catch(error => {
      console.error('Failed to increment view count:', error)
    })

    // Get related posts (same categories or tags, excluding current post)
    const relatedPosts = await BlogPost.find({
      _id: { $ne: post._id },
      status: 'published',
      $or: [
        { categories: { $in: post.categories || [] } },
        { tags: { $in: post.tags || [] } }
      ]
    })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select('title slug excerpt publishedAt featuredImage readingTime')
    .lean()

    // Transform post for public consumption
    const transformedPost = {
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      author: {
        username: post.author?.username || 'Anonymous'
      },
      publishedAt: post.publishedAt?.toISOString(),
      tags: post.tags || [],
      categories: post.categories || [],
      featuredImage: post.featuredImage,
      readingTime: post.readingTime || 1,
      viewCount: (post.viewCount || 0) + 1, // Include the incremented view
      seoMetadata: {
        title: post.seoMetadata?.title || post.title,
        description: post.seoMetadata?.description || post.excerpt,
        keywords: post.seoMetadata?.keywords || post.tags || []
      }
    }

    // Transform related posts
    const transformedRelatedPosts = relatedPosts.map(relatedPost => ({
      id: relatedPost._id.toString(),
      title: relatedPost.title,
      slug: relatedPost.slug,
      excerpt: relatedPost.excerpt,
      publishedAt: relatedPost.publishedAt?.toISOString(),
      featuredImage: relatedPost.featuredImage,
      readingTime: relatedPost.readingTime || 1
    }))

    return NextResponse.json(
      {
        success: true,
        data: {
          post: transformedPost,
          relatedPosts: transformedRelatedPosts
        }
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200', // 10 min cache, 20 min stale
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error) {
    console.error('Blog post API error:', error)
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

/**
 * POST /api/blog/[slug]
 * Handle blog post interactions (like, share, etc.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const clientId = getClientIdentifier(request)
  
  try {
    // Check rate limiting (stricter for POST)
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

    // Validate slug format
    if (!params.slug || typeof params.slug !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid blog post slug',
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { action } = body

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Action is required',
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Find the blog post
    const post = await BlogPost.findOne({ 
      slug: params.slug.toLowerCase().trim(), 
      status: 'published' 
    })

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found',
        },
        { status: 404 }
      )
    }

    // Handle different actions
    switch (action) {
      case 'view':
        // Increment view count
        await BlogPost.findByIdAndUpdate(
          post._id,
          { $inc: { viewCount: 1 } }
        )
        
        return NextResponse.json(
          {
            success: true,
            message: 'View recorded',
            data: {
              viewCount: (post.viewCount || 0) + 1
            }
          },
          { status: 200 }
        )

      case 'share':
        // Could track share analytics here
        return NextResponse.json(
          {
            success: true,
            message: 'Share recorded',
            data: {
              shareUrl: `${request.nextUrl.origin}/blog/${post.slug}`
            }
          },
          { status: 200 }
        )

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Blog post interaction error:', error)
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

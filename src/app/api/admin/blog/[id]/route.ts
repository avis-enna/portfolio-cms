import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { connectToDatabase } from '@/lib/database/connection'
import { BlogPost } from '@/lib/database/models'
import { apiRateLimiter, getClientIdentifier } from '@/lib/auth/rateLimiter'
import { securityAuditor } from '@/lib/auth/securityAudit'

/**
 * GET /api/admin/blog/[id]
 * Get a specific blog post by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate ID format
    if (!params.id || !/^[0-9a-fA-F]{24}$/.test(params.id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid blog post ID format',
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Find blog post
    const post = await BlogPost.findById(params.id)
      .populate('author', 'username email')
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

    // Transform post for frontend
    const transformedPost = {
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
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          post: transformedPost
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
    console.error('Blog get error:', error)
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
 * PUT /api/admin/blog/[id]
 * Update a specific blog post
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate ID format
    if (!params.id || !/^[0-9a-fA-F]{24}$/.test(params.id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid blog post ID format',
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      title,
      content,
      excerpt,
      status,
      tags,
      categories,
      featuredImage,
      seoMetadata,
      displayOrder
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

    // Find existing post
    const existingPost = await BlogPost.findById(params.id)
    if (!existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found',
        },
        { status: 404 }
      )
    }

    // Generate new slug if title changed
    let slug = existingPost.slug
    if (title !== existingPost.title) {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      // Ensure slug is unique (excluding current post)
      slug = baseSlug
      let counter = 1
      while (await BlogPost.findOne({ slug, _id: { $ne: params.id } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
    }

    // Calculate reading time
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    // Prepare update data
    const updateData: any = {
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      tags: Array.isArray(tags) ? tags : existingPost.tags,
      categories: Array.isArray(categories) ? categories : existingPost.categories,
      featuredImage: featuredImage !== undefined ? featuredImage : existingPost.featuredImage,
      readingTime,
      seoMetadata: {
        title: seoMetadata?.title || title,
        description: seoMetadata?.description || excerpt || content.substring(0, 160),
        keywords: seoMetadata?.keywords || (Array.isArray(tags) ? tags : existingPost.tags)
      }
    }

    // Handle status change
    if (status && status !== existingPost.status) {
      updateData.status = status
      
      // Set publishedAt when publishing for the first time
      if (status === 'published' && !existingPost.publishedAt) {
        updateData.publishedAt = new Date()
      }
      
      // Clear publishedAt when unpublishing
      if (status === 'draft' && existingPost.publishedAt) {
        updateData.publishedAt = null
      }
    }

    // Handle display order change
    if (displayOrder !== undefined && displayOrder !== existingPost.displayOrder) {
      updateData.displayOrder = displayOrder
    }

    // Update the post
    const updatedPost = await BlogPost.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'username email')

    if (!updatedPost) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update blog post',
        },
        { status: 500 }
      )
    }

    // Transform post for response
    const transformedPost = {
      id: updatedPost._id.toString(),
      title: updatedPost.title,
      slug: updatedPost.slug,
      excerpt: updatedPost.excerpt,
      content: updatedPost.content,
      status: updatedPost.status,
      author: updatedPost.author,
      publishedAt: updatedPost.publishedAt?.toISOString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
      tags: updatedPost.tags,
      categories: updatedPost.categories,
      featuredImage: updatedPost.featuredImage,
      readingTime: updatedPost.readingTime,
      viewCount: updatedPost.viewCount,
      displayOrder: updatedPost.displayOrder,
      seoMetadata: updatedPost.seoMetadata
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          post: transformedPost
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Blog update error:', error)
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
 * DELETE /api/admin/blog/[id]
 * Delete a specific blog post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate ID format
    if (!params.id || !/^[0-9a-fA-F]{24}$/.test(params.id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid blog post ID format',
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Find and delete the post
    const deletedPost = await BlogPost.findByIdAndDelete(params.id)

    if (!deletedPost) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found',
        },
        { status: 404 }
      )
    }

    // Log the deletion for audit purposes
    securityAuditor.logEvent({
      type: 'suspicious_activity',
      clientId,
      userId: authResult.user!.userId,
      details: {
        action: 'blog_post_deleted',
        postId: params.id,
        postTitle: deletedPost.title,
        timestamp: new Date().toISOString(),
      },
      severity: 'low'
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Blog post deleted successfully',
        data: {
          deletedId: params.id
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Blog deletion error:', error)
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

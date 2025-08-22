import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { connectToDatabase } from '@/lib/database/connection'
import { BlogPost, ContactSubmission, PortfolioContent } from '@/lib/database/models'

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics and recent activity
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request)
    if (!authResult.success) {
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

    // Get statistics
    const [
      totalPosts,
      publishedPosts,
      totalContacts,
      unreadContacts,
      portfolioContent,
      recentPosts,
      recentContacts
    ] = await Promise.all([
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ status: 'published' }),
      ContactSubmission.countDocuments(),
      ContactSubmission.countDocuments({ isRead: false }),
      PortfolioContent.findOne().sort({ updatedAt: -1 }),
      BlogPost.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt status')
        .lean(),
      ContactSubmission.find()
        .sort({ submittedAt: -1 })
        .limit(5)
        .select('name email submittedAt isRead')
        .lean()
    ])

    // Calculate total views from all published blog posts
    const publishedPostsWithViews = await BlogPost.find({ status: 'published' })
      .select('viewCount')
      .lean()
    
    const totalViews = publishedPostsWithViews.reduce((sum, post) => sum + (post.viewCount || 0), 0)

    // Prepare recent activity
    const recentActivity = []

    // Add recent blog posts to activity
    recentPosts.forEach(post => {
      recentActivity.push({
        id: `post-${post._id}`,
        type: 'post' as const,
        title: `Blog post: "${post.title}"`,
        timestamp: post.createdAt.toISOString(),
        status: post.status
      })
    })

    // Add recent contacts to activity
    recentContacts.forEach(contact => {
      recentActivity.push({
        id: `contact-${contact._id}`,
        type: 'contact' as const,
        title: `New contact from ${contact.name}`,
        timestamp: contact.submittedAt.toISOString(),
        isRead: contact.isRead
      })
    })

    // Add portfolio content update if exists
    if (portfolioContent) {
      recentActivity.push({
        id: `content-${portfolioContent._id}`,
        type: 'content' as const,
        title: 'Portfolio content updated',
        timestamp: portfolioContent.updatedAt.toISOString()
      })
    }

    // Sort activity by timestamp (most recent first)
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Return dashboard data
    return NextResponse.json(
      {
        success: true,
        data: {
          stats: {
            totalPosts,
            publishedPosts,
            totalViews,
            totalContacts,
            unreadContacts,
            lastUpdated: portfolioContent?.updatedAt?.toISOString() || new Date().toISOString()
          },
          recentActivity: recentActivity.slice(0, 10) // Limit to 10 most recent items
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Dashboard API error:', error)

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

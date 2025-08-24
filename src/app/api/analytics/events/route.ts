/**
 * Analytics Events API Route
 * Handles analytics event tracking and retrieval
 */

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import { AnalyticsEvent, AnalyticsSession } from '@/lib/database/models'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { rateLimit } from '@/lib/middleware/rateLimit'

// Rate limiting for analytics events (more permissive for tracking)
const analyticsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 events per minute
  message: 'Too many analytics events. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await analyticsRateLimit(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Connect to database
    await connectToDatabase()

    // Parse request body
    const eventData = await request.json()

    // Validate required fields
    if (!eventData.type || !eventData.sessionId || !eventData.page) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, sessionId, page' },
        { status: 400 }
      )
    }

    // Create analytics event
    const analyticsEvent = new AnalyticsEvent({
      eventId: eventData.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventData.type,
      timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
      sessionId: eventData.sessionId,
      userId: eventData.userId,
      page: eventData.page,
      url: eventData.url,
      referrer: eventData.referrer,
      userAgent: eventData.userAgent,
      device: eventData.device,
      location: eventData.location,
      metadata: eventData.metadata,
      duration: eventData.duration,
      scrollDepth: eventData.scrollDepth,
      exitPage: eventData.exitPage
    })

    await analyticsEvent.save()

    // Update or create session
    await updateSession(eventData)

    return NextResponse.json({
      success: true,
      data: {
        eventId: analyticsEvent.eventId,
        timestamp: analyticsEvent.timestamp
      }
    })

  } catch (error) {
    console.error('Analytics event error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record analytics event' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = searchParams.get('page')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    const query: any = {}
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    if (page) {
      query.page = page
    }
    
    if (type) {
      query.type = type
    }

    // Get events with pagination
    const events = await AnalyticsEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean()

    // Get total count
    const totalCount = await AnalyticsEvent.countDocuments(query)

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    })

  } catch (error) {
    console.error('Analytics events retrieval error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve analytics events' },
      { status: 500 }
    )
  }
}

/**
 * Update or create analytics session
 */
async function updateSession(eventData: any) {
  try {
    const session = await AnalyticsSession.findOne({ sessionId: eventData.sessionId })

    if (session) {
      // Update existing session
      session.endTime = new Date()
      session.duration = session.endTime.getTime() - session.startTime.getTime()
      session.events += 1
      
      if (eventData.type === 'page_view') {
        session.pageViews += 1
        session.bounceRate = session.pageViews <= 1
        
        if (!session.exitPage || eventData.exitPage) {
          session.exitPage = eventData.page
        }
      }
      
      // Update scroll depth
      if (eventData.scrollDepth !== undefined) {
        session.maxScrollDepth = Math.max(session.maxScrollDepth, eventData.scrollDepth)
        session.avgScrollDepth = (session.avgScrollDepth + eventData.scrollDepth) / 2
      }
      
      // Track interactions
      if (['click', 'form_submit'].includes(eventData.type)) {
        session.totalInteractions += 1
      }
      
      // Track conversions
      if (eventData.metadata?.eventType === 'conversion') {
        session.conversionEvents.push(eventData.metadata.goal)
      }
      
      await session.save()
    } else {
      // Create new session
      const newSession = new AnalyticsSession({
        sessionId: eventData.sessionId,
        startTime: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
        pageViews: eventData.type === 'page_view' ? 1 : 0,
        events: 1,
        bounceRate: true,
        conversionEvents: eventData.metadata?.eventType === 'conversion' ? [eventData.metadata.goal] : [],
        device: eventData.device,
        location: eventData.location,
        referrer: eventData.referrer,
        landingPage: eventData.page,
        userId: eventData.userId,
        isReturningVisitor: await checkReturningVisitor(eventData),
        avgScrollDepth: eventData.scrollDepth || 0,
        maxScrollDepth: eventData.scrollDepth || 0,
        totalInteractions: ['click', 'form_submit'].includes(eventData.type) ? 1 : 0
      })
      
      await newSession.save()
    }
  } catch (error) {
    console.error('Session update error:', error)
  }
}

/**
 * Check if visitor is returning based on previous sessions
 */
async function checkReturningVisitor(eventData: any): Promise<boolean> {
  try {
    // Check for previous sessions from same device/browser
    const existingSession = await AnalyticsSession.findOne({
      sessionId: { $ne: eventData.sessionId },
      'device.type': eventData.device?.type,
      'device.browser': eventData.device?.browser,
      'device.os': eventData.device?.os,
      startTime: { $lt: new Date(Date.now() - 30 * 60 * 1000) } // At least 30 minutes ago
    })
    
    return !!existingSession
  } catch (error) {
    console.error('Returning visitor check error:', error)
    return false
  }
}

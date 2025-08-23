/**
 * Analytics Dashboard API Route
 * Provides comprehensive analytics data for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import { AnalyticsEvent, AnalyticsSession, PerformanceMetric } from '@/lib/database/models'
import { verifyJWT } from '@/lib/auth/jwt'

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
    const payload = verifyJWT(token)
    
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
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y
    const timezone = searchParams.get('timezone') || 'UTC'

    // Calculate date range
    const { startDate, endDate } = getDateRange(period)

    // Fetch all analytics data in parallel
    const [
      overviewStats,
      pageViews,
      uniqueVisitors,
      topPages,
      deviceStats,
      referrerStats,
      sessionStats,
      performanceOverview,
      conversionEvents,
      realTimeStats
    ] = await Promise.all([
      getOverviewStats(startDate, endDate),
      getPageViewsOverTime(startDate, endDate),
      getUniqueVisitorsOverTime(startDate, endDate),
      getTopPages(startDate, endDate),
      getDeviceStats(startDate, endDate),
      getReferrerStats(startDate, endDate),
      getSessionStats(startDate, endDate),
      getPerformanceOverview(startDate, endDate),
      getConversionEvents(startDate, endDate),
      getRealTimeStats()
    ])

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        overview: overviewStats,
        pageViews,
        uniqueVisitors,
        topPages,
        deviceStats,
        referrerStats,
        sessionStats,
        performance: performanceOverview,
        conversions: conversionEvents,
        realTime: realTimeStats,
        lastUpdated: new Date()
      }
    })

  } catch (error) {
    console.error('Analytics dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load analytics dashboard' },
      { status: 500 }
    )
  }
}

/**
 * Get date range based on period
 */
function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()

  switch (period) {
    case '24h':
      startDate.setHours(startDate.getHours() - 24)
      break
    case '7d':
      startDate.setDate(startDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(startDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(startDate.getDate() - 90)
      break
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    default:
      startDate.setDate(startDate.getDate() - 7)
  }

  return { startDate, endDate }
}

/**
 * Get overview statistics
 */
async function getOverviewStats(startDate: Date, endDate: Date) {
  const [currentStats, previousStats] = await Promise.all([
    AnalyticsSession.getSessionStats(startDate, endDate),
    AnalyticsSession.getSessionStats(
      new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
      startDate
    )
  ])

  const current = currentStats[0] || {}
  const previous = previousStats[0] || {}

  return {
    totalSessions: current.totalSessions || 0,
    uniqueVisitors: current.uniqueVisitors || 0,
    pageViews: current.totalPageViews || 0,
    bounceRate: current.bounceRate || 0,
    avgSessionDuration: current.avgDuration || 0,
    conversions: current.conversions || 0,
    conversionRate: current.conversionRate || 0,
    
    // Growth compared to previous period
    growth: {
      sessions: calculateGrowth(current.totalSessions, previous.totalSessions),
      visitors: calculateGrowth(current.uniqueVisitors, previous.uniqueVisitors),
      pageViews: calculateGrowth(current.totalPageViews, previous.totalPageViews),
      conversions: calculateGrowth(current.conversions, previous.conversions)
    }
  }
}

/**
 * Get page views over time
 */
async function getPageViewsOverTime(startDate: Date, endDate: Date) {
  const pageViews = await AnalyticsEvent.aggregate([
    {
      $match: {
        type: 'page_view',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        },
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        date: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' }
      }
    },
    {
      $sort: { date: 1 }
    }
  ])

  return pageViews
}

/**
 * Get unique visitors over time
 */
async function getUniqueVisitorsOverTime(startDate: Date, endDate: Date) {
  const visitors = await AnalyticsSession.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$startTime' }
        },
        newVisitors: { $sum: { $cond: ['$isReturningVisitor', 0, 1] } },
        returningVisitors: { $sum: { $cond: ['$isReturningVisitor', 1, 0] } },
        totalVisitors: { $sum: 1 }
      }
    },
    {
      $project: {
        date: '$_id',
        newVisitors: 1,
        returningVisitors: 1,
        totalVisitors: 1
      }
    },
    {
      $sort: { date: 1 }
    }
  ])

  return visitors
}

/**
 * Get top pages
 */
async function getTopPages(startDate: Date, endDate: Date) {
  return await AnalyticsEvent.getTopPages(startDate, endDate, 10)
}

/**
 * Get device statistics
 */
async function getDeviceStats(startDate: Date, endDate: Date) {
  return await AnalyticsSession.getDeviceBreakdown(startDate, endDate)
}

/**
 * Get referrer statistics
 */
async function getReferrerStats(startDate: Date, endDate: Date) {
  return await AnalyticsEvent.getReferrerStats(startDate, endDate)
}

/**
 * Get session statistics
 */
async function getSessionStats(startDate: Date, endDate: Date) {
  const [sessionBreakdown, hourlyDistribution, retentionAnalysis] = await Promise.all([
    AnalyticsSession.getSessionStats(startDate, endDate),
    AnalyticsSession.getHourlyDistribution(startDate, endDate),
    AnalyticsSession.getRetentionAnalysis(startDate, endDate)
  ])

  return {
    breakdown: sessionBreakdown[0] || {},
    hourlyDistribution,
    retention: retentionAnalysis
  }
}

/**
 * Get performance overview
 */
async function getPerformanceOverview(startDate: Date, endDate: Date) {
  const [overview, byPage, byDevice, trends] = await Promise.all([
    PerformanceMetric.getPerformanceOverview(startDate, endDate),
    PerformanceMetric.getPerformanceByPage(startDate, endDate),
    PerformanceMetric.getPerformanceByDevice(startDate, endDate),
    PerformanceMetric.getPerformanceTrends(startDate, endDate)
  ])

  return {
    overview: overview[0] || {},
    byPage: byPage.slice(0, 10),
    byDevice,
    trends
  }
}

/**
 * Get conversion events
 */
async function getConversionEvents(startDate: Date, endDate: Date) {
  const conversions = await AnalyticsEvent.aggregate([
    {
      $match: {
        type: 'custom',
        'metadata.eventType': 'conversion',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$metadata.goal',
        count: { $sum: 1 },
        totalValue: { $sum: '$metadata.value' },
        avgValue: { $avg: '$metadata.value' },
        dates: { $push: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } }
      }
    },
    {
      $project: {
        goal: '$_id',
        count: 1,
        totalValue: { $round: ['$totalValue', 2] },
        avgValue: { $round: ['$avgValue', 2] },
        trend: {
          $map: {
            input: { $setUnion: ['$dates', []] },
            as: 'date',
            in: {
              date: '$$date',
              count: {
                $size: {
                  $filter: {
                    input: '$dates',
                    cond: { $eq: ['$$this', '$$date'] }
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ])

  return conversions
}

/**
 * Get real-time statistics (last 30 minutes)
 */
async function getRealTimeStats() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
  
  const [activeVisitors, recentEvents, topPagesNow] = await Promise.all([
    AnalyticsSession.countDocuments({
      endTime: { $gte: thirtyMinutesAgo }
    }),
    AnalyticsEvent.find({
      timestamp: { $gte: thirtyMinutesAgo }
    }).sort({ timestamp: -1 }).limit(10).lean(),
    AnalyticsEvent.aggregate([
      {
        $match: {
          type: 'page_view',
          timestamp: { $gte: thirtyMinutesAgo }
        }
      },
      {
        $group: {
          _id: '$page',
          views: { $sum: 1 }
        }
      },
      {
        $project: {
          page: '$_id',
          views: 1
        }
      },
      {
        $sort: { views: -1 }
      },
      {
        $limit: 5
      }
    ])
  ])

  return {
    activeVisitors,
    recentEvents,
    topPages: topPagesNow
  }
}

/**
 * Calculate growth percentage
 */
function calculateGrowth(current: number = 0, previous: number = 0): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

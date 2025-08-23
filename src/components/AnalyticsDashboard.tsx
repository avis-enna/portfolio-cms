'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { useToast } from '@/components/Toast'

interface AnalyticsData {
  overview: {
    totalSessions: number
    uniqueVisitors: number
    pageViews: number
    bounceRate: number
    avgSessionDuration: number
    conversions: number
    conversionRate: number
    growth: {
      sessions: number
      visitors: number
      pageViews: number
      conversions: number
    }
  }
  pageViews: Array<{
    date: string
    views: number
    uniqueVisitors: number
  }>
  topPages: Array<{
    page: string
    views: number
    uniqueVisitors: number
    avgScrollDepth: number
    avgDuration: number
  }>
  deviceStats: Array<{
    deviceType: string
    sessions: number
    avgDuration: number
    avgPageViews: number
    bounceRate: number
  }>
  performance: {
    overview: {
      avgPerformanceScore: number
      avgWebVitalsScore: number
      avgLCP: number
      avgFID: number
      avgCLS: number
      totalMeasurements: number
    }
  }
  realTime: {
    activeVisitors: number
    recentEvents: Array<any>
    topPages: Array<{
      page: string
      views: number
    }>
  }
}

interface AnalyticsDashboardProps {
  className?: string
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadAnalyticsData()
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadAnalyticsData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [period])

  const loadAnalyticsData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) return

      const response = await fetch(`/api/analytics/dashboard?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setData(result.data)
          setLastUpdated(new Date(result.data.lastUpdated))
        } else {
          showToast(result.error || 'Failed to load analytics', 'error')
        }
      } else {
        showToast('Failed to load analytics data', 'error')
      }
    } catch (error) {
      console.error('Analytics loading error:', error)
      showToast('Failed to load analytics data', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getGrowthColor = (growth: number): string => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (growth: number): string => {
    if (growth > 0) return '↗️'
    if (growth < 0) return '↘️'
    return '➡️'
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="analytics-dashboard">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 text-lg">No analytics data available</div>
        <Button onClick={loadAnalyticsData} className="mt-4">
          Retry Loading
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="analytics-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-600">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="period-select"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button
            onClick={loadAnalyticsData}
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
            data-testid="refresh-button"
          >
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6" data-testid="sessions-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.totalSessions)}</p>
            </div>
            <div className="text-2xl">👥</div>
          </div>
          <div className={`flex items-center mt-2 text-sm ${getGrowthColor(data.overview.growth.sessions)}`}>
            <span className="mr-1">{getGrowthIcon(data.overview.growth.sessions)}</span>
            <span>{Math.abs(data.overview.growth.sessions)}% vs previous period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6" data-testid="visitors-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.uniqueVisitors)}</p>
            </div>
            <div className="text-2xl">🔍</div>
          </div>
          <div className={`flex items-center mt-2 text-sm ${getGrowthColor(data.overview.growth.visitors)}`}>
            <span className="mr-1">{getGrowthIcon(data.overview.growth.visitors)}</span>
            <span>{Math.abs(data.overview.growth.visitors)}% vs previous period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6" data-testid="pageviews-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.pageViews)}</p>
            </div>
            <div className="text-2xl">📄</div>
          </div>
          <div className={`flex items-center mt-2 text-sm ${getGrowthColor(data.overview.growth.pageViews)}`}>
            <span className="mr-1">{getGrowthIcon(data.overview.growth.pageViews)}</span>
            <span>{Math.abs(data.overview.growth.pageViews)}% vs previous period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6" data-testid="bounce-rate-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.bounceRate.toFixed(1)}%</p>
            </div>
            <div className="text-2xl">⚡</div>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Avg Session: {formatDuration(data.overview.avgSessionDuration)}
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">🔴 Real-time Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Visitors</p>
            <p className="text-3xl font-bold text-green-600">{data.realTime.activeVisitors}</p>
            <p className="text-xs text-gray-500">Last 30 minutes</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Top Pages Now</p>
            <div className="space-y-1">
              {data.realTime.topPages.slice(0, 3).map((page, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700 truncate">{page.page}</span>
                  <span className="text-gray-500">{page.views}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Recent Events</p>
            <div className="space-y-1">
              {data.realTime.recentEvents.slice(0, 3).map((event, index) => (
                <div key={index} className="text-xs text-gray-600">
                  <span className="font-medium">{event.type}</span> on {event.page}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Top Pages</h3>
          <div className="space-y-3">
            {data.topPages.slice(0, 5).map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{page.page}</p>
                  <p className="text-xs text-gray-500">
                    {page.uniqueVisitors} visitors • {page.avgScrollDepth.toFixed(0)}% scroll
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatNumber(page.views)}</p>
                  <p className="text-xs text-gray-500">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📱 Device Breakdown</h3>
          <div className="space-y-3">
            {data.deviceStats.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">
                    {device.deviceType === 'mobile' ? '📱' : 
                     device.deviceType === 'tablet' ? '📱' : '💻'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{device.deviceType}</p>
                    <p className="text-xs text-gray-500">
                      {device.bounceRate.toFixed(1)}% bounce rate
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatNumber(device.sessions)}</p>
                  <p className="text-xs text-gray-500">sessions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      {data.performance.overview.totalMeasurements > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">⚡ Performance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{data.performance.overview.avgPerformanceScore.toFixed(0)}</p>
              <p className="text-sm text-gray-600">Performance Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.performance.overview.avgWebVitalsScore.toFixed(0)}</p>
              <p className="text-sm text-gray-600">Web Vitals Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{data.performance.overview.avgLCP.toFixed(0)}ms</p>
              <p className="text-sm text-gray-600">Avg LCP</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{data.performance.overview.avgFID.toFixed(1)}ms</p>
              <p className="text-sm text-gray-600">Avg FID</p>
            </div>
          </div>
        </div>
      )}

      {/* Conversions */}
      {data.overview.conversions > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Conversions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{data.overview.conversions}</p>
              <p className="text-sm text-gray-600">Total Conversions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{data.overview.conversionRate.toFixed(2)}%</p>
              <p className="text-sm text-gray-600">Conversion Rate</p>
            </div>
            <div className="text-center">
              <div className={`text-sm ${getGrowthColor(data.overview.growth.conversions)}`}>
                <span className="mr-1">{getGrowthIcon(data.overview.growth.conversions)}</span>
                <span>{Math.abs(data.overview.growth.conversions)}% vs previous</span>
              </div>
              <p className="text-sm text-gray-600">Growth</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

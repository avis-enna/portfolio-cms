'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '@/components/Toast'

interface AnalyticsData {
  pageViews: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  visitors: {
    unique: number
    returning: number
    newVisitors: number
  }
  topPages: Array<{
    path: string
    views: number
    percentage: number
  }>
  referrers: Array<{
    source: string
    visits: number
    percentage: number
  }>
  devices: {
    desktop: number
    mobile: number
    tablet: number
  }
  countries: Array<{
    country: string
    visits: number
    percentage: number
  }>
  contactFormSubmissions: {
    total: number
    thisMonth: number
    conversionRate: number
  }
  blogEngagement: {
    totalPosts: number
    averageReadTime: number
    mostPopularPost: string
  }
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    // Check authentication
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      router.push('/admin/login')
      return
    }

    loadAnalyticsData()
  }, [router, dateRange])

  const loadAnalyticsData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        router.push('/admin/login')
        return
      }

      const response = await fetch(`/api/admin/analytics?range=${dateRange}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login')
          return
        }
        throw new Error('Failed to fetch analytics data')
      }

      const result = await response.json()
      if (result.success) {
        setAnalyticsData(result.data)
      } else {
        // Mock data for demonstration
        setAnalyticsData({
          pageViews: {
            total: 12543,
            thisMonth: 3421,
            lastMonth: 2987,
            growth: 14.5
          },
          visitors: {
            unique: 8932,
            returning: 3421,
            newVisitors: 5511
          },
          topPages: [
            { path: '/', views: 4521, percentage: 36.0 },
            { path: '/projects', views: 2134, percentage: 17.0 },
            { path: '/about', views: 1876, percentage: 15.0 },
            { path: '/contact', views: 1234, percentage: 9.8 },
            { path: '/blog', views: 987, percentage: 7.9 }
          ],
          referrers: [
            { source: 'Direct', visits: 5432, percentage: 43.3 },
            { source: 'Google', visits: 3210, percentage: 25.6 },
            { source: 'LinkedIn', visits: 1876, percentage: 15.0 },
            { source: 'GitHub', visits: 1234, percentage: 9.8 },
            { source: 'Twitter', visits: 791, percentage: 6.3 }
          ],
          devices: {
            desktop: 7234,
            mobile: 4321,
            tablet: 988
          },
          countries: [
            { country: 'United States', visits: 4521, percentage: 36.0 },
            { country: 'United Kingdom', visits: 2134, percentage: 17.0 },
            { country: 'Canada', visits: 1876, percentage: 15.0 },
            { country: 'Germany', visits: 1234, percentage: 9.8 },
            { country: 'Australia', visits: 987, percentage: 7.9 }
          ],
          contactFormSubmissions: {
            total: 87,
            thisMonth: 23,
            conversionRate: 2.3
          },
          blogEngagement: {
            totalPosts: 12,
            averageReadTime: 4.2,
            mostPopularPost: 'Building Modern Web Applications'
          }
        })
      }
    } catch (error) {
      console.error('Error loading analytics data:', error)
      showToast('Failed to load analytics data', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      )
    } else if (growth < 0) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!analyticsData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Not Available</h2>
          <p className="text-gray-600">Analytics data is not available at the moment.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="analytics-dashboard">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your portfolio performance and visitor insights</p>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="date-range-select"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6" data-testid="metric-pageviews">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Page Views</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsData.pageViews.total)}</p>
                <div className={`flex items-center mt-1 ${getGrowthColor(analyticsData.pageViews.growth)}`}>
                  {getGrowthIcon(analyticsData.pageViews.growth)}
                  <span className="text-sm ml-1">
                    {analyticsData.pageViews.growth > 0 ? '+' : ''}{analyticsData.pageViews.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6" data-testid="metric-visitors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsData.visitors.unique)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {analyticsData.visitors.newVisitors} new, {analyticsData.visitors.returning} returning
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6" data-testid="metric-contacts">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Submissions</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.contactFormSubmissions.total}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {analyticsData.contactFormSubmissions.conversionRate}% conversion rate
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6" data-testid="metric-blog">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Read Time</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.blogEngagement.averageReadTime}m</p>
                <p className="text-sm text-gray-600 mt-1">
                  {analyticsData.blogEngagement.totalPosts} blog posts
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <div className="bg-white rounded-lg shadow p-6" data-testid="top-pages">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Pages</h3>
            <div className="space-y-4">
              {analyticsData.topPages.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <span className="text-sm text-gray-900 ml-3">{page.path}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">{formatNumber(page.views)}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${page.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-lg shadow p-6" data-testid="traffic-sources">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Sources</h3>
            <div className="space-y-4">
              {analyticsData.referrers.map((referrer, index) => (
                <div key={referrer.source} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <span className="text-sm text-gray-900 ml-3">{referrer.source}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">{formatNumber(referrer.visits)}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${referrer.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="bg-white rounded-lg shadow p-6" data-testid="device-breakdown">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Device Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-900">Desktop</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{formatNumber(analyticsData.devices.desktop)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-900">Mobile</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{formatNumber(analyticsData.devices.mobile)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-900">Tablet</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{formatNumber(analyticsData.devices.tablet)}</span>
              </div>
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white rounded-lg shadow p-6" data-testid="top-countries">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Countries</h3>
            <div className="space-y-4">
              {analyticsData.countries.map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <span className="text-sm text-gray-900 ml-3">{country.country}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">{formatNumber(country.visits)}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${country.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="insights">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Most Popular Content</h4>
              <p className="text-sm text-blue-700">
                Your homepage receives the most traffic, followed by your projects page. Consider highlighting your best work there.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-900 mb-2">Traffic Growth</h4>
              <p className="text-sm text-green-700">
                Your traffic has grown by {analyticsData.pageViews.growth.toFixed(1)}% this month. Keep up the great content!
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-900 mb-2">Engagement</h4>
              <p className="text-sm text-purple-700">
                Your blog posts have an average read time of {analyticsData.blogEngagement.averageReadTime} minutes, indicating good engagement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

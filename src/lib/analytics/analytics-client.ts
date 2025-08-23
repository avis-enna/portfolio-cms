/**
 * Advanced Analytics Client
 * Handles visitor tracking, performance monitoring, and user behavior analytics
 */

export interface AnalyticsEvent {
  id: string
  type: 'page_view' | 'click' | 'scroll' | 'form_submit' | 'download' | 'contact' | 'project_view' | 'blog_read' | 'custom'
  timestamp: Date
  sessionId: string
  userId?: string
  page: string
  url: string
  referrer?: string
  userAgent: string
  device: DeviceInfo
  location?: LocationInfo
  metadata?: Record<string, any>
  duration?: number
  scrollDepth?: number
  exitPage?: boolean
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile'
  os: string
  browser: string
  screenResolution: string
  viewport: string
  touchSupport: boolean
}

export interface LocationInfo {
  country?: string
  region?: string
  city?: string
  timezone: string
  language: string
}

export interface AnalyticsSession {
  id: string
  startTime: Date
  endTime?: Date
  duration?: number
  pageViews: number
  events: number
  bounceRate: boolean
  conversionEvents: string[]
  device: DeviceInfo
  location?: LocationInfo
  referrer?: string
  landingPage: string
  exitPage?: string
}

export interface PerformanceMetrics {
  id: string
  timestamp: Date
  page: string
  metrics: {
    // Core Web Vitals
    lcp?: number // Largest Contentful Paint
    fid?: number // First Input Delay
    cls?: number // Cumulative Layout Shift
    fcp?: number // First Contentful Paint
    ttfb?: number // Time to First Byte
    
    // Custom metrics
    domContentLoaded?: number
    loadComplete?: number
    resourceLoadTime?: number
    apiResponseTime?: number
    renderTime?: number
  }
  device: DeviceInfo
  connection?: {
    effectiveType: string
    downlink: number
    rtt: number
  }
}

export interface ConversionFunnel {
  id: string
  name: string
  steps: FunnelStep[]
  conversionRate: number
  dropOffPoints: number[]
  totalUsers: number
  completedUsers: number
}

export interface FunnelStep {
  id: string
  name: string
  page: string
  action?: string
  users: number
  conversionRate: number
  dropOffRate: number
  avgTimeSpent: number
}

export interface ABTestVariant {
  id: string
  name: string
  traffic: number // percentage
  conversionRate: number
  users: number
  conversions: number
  isControl: boolean
}

export interface ABTest {
  id: string
  name: string
  description: string
  status: 'draft' | 'running' | 'completed' | 'paused'
  startDate: Date
  endDate?: Date
  variants: ABTestVariant[]
  goal: string
  significance: number
  winner?: string
}

class AnalyticsClient {
  private sessionId: string
  private userId?: string
  private sessionStartTime: Date
  private currentPage: string = ''
  private pageStartTime: Date = new Date()
  private scrollDepth: number = 0
  private events: AnalyticsEvent[] = []
  private isTracking: boolean = true
  private performanceObserver?: PerformanceObserver

  constructor() {
    this.sessionId = this.generateSessionId()
    this.sessionStartTime = new Date()
    this.initializeTracking()
  }

  /**
   * Initialize analytics tracking
   */
  private initializeTracking() {
    if (typeof window === 'undefined') return

    // Track page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    
    // Track scroll depth
    window.addEventListener('scroll', this.trackScrollDepth.bind(this))
    
    // Track clicks
    document.addEventListener('click', this.trackClick.bind(this))
    
    // Track form submissions
    document.addEventListener('submit', this.trackFormSubmit.bind(this))
    
    // Track page unload
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this))
    
    // Initialize performance monitoring
    this.initializePerformanceMonitoring()
    
    // Track initial page view
    this.trackPageView()
  }

  /**
   * Track page view
   */
  trackPageView(page?: string, metadata?: Record<string, any>) {
    const currentPage = page || window.location.pathname
    const previousPage = this.currentPage
    
    // End previous page session
    if (previousPage && previousPage !== currentPage) {
      this.trackEvent({
        type: 'page_view',
        page: previousPage,
        metadata: { ...metadata, exitPage: true },
        duration: Date.now() - this.pageStartTime.getTime()
      })
    }
    
    this.currentPage = currentPage
    this.pageStartTime = new Date()
    this.scrollDepth = 0
    
    this.trackEvent({
      type: 'page_view',
      page: currentPage,
      metadata
    })
  }

  /**
   * Track custom event
   */
  trackEvent(eventData: Partial<AnalyticsEvent>) {
    if (!this.isTracking) return

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.userId,
      page: this.currentPage,
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      device: this.getDeviceInfo(),
      location: this.getLocationInfo(),
      scrollDepth: this.scrollDepth,
      ...eventData
    }

    this.events.push(event)
    this.sendEvent(event)
  }

  /**
   * Track conversion event
   */
  trackConversion(goal: string, value?: number, metadata?: Record<string, any>) {
    this.trackEvent({
      type: 'custom',
      metadata: {
        eventType: 'conversion',
        goal,
        value,
        ...metadata
      }
    })
  }

  /**
   * Track performance metrics
   */
  trackPerformance(customMetrics?: Record<string, number>) {
    if (typeof window === 'undefined') return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    const metrics: PerformanceMetrics = {
      id: this.generateEventId(),
      timestamp: new Date(),
      page: this.currentPage,
      metrics: {
        ttfb: navigation?.responseStart - navigation?.requestStart,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart,
        loadComplete: navigation?.loadEventEnd - navigation?.navigationStart,
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        ...customMetrics
      },
      device: this.getDeviceInfo(),
      connection: this.getConnectionInfo()
    }

    this.sendPerformanceMetrics(metrics)
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals() {
    if (typeof window === 'undefined') return

    // Track LCP (Largest Contentful Paint)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      this.trackEvent({
        type: 'custom',
        metadata: {
          eventType: 'web_vital',
          metric: 'lcp',
          value: lastEntry.startTime,
          rating: lastEntry.startTime > 4000 ? 'poor' : lastEntry.startTime > 2500 ? 'needs-improvement' : 'good'
        }
      })
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // Track FID (First Input Delay)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        this.trackEvent({
          type: 'custom',
          metadata: {
            eventType: 'web_vital',
            metric: 'fid',
            value: entry.processingStart - entry.startTime,
            rating: entry.processingStart - entry.startTime > 300 ? 'poor' : 
                   entry.processingStart - entry.startTime > 100 ? 'needs-improvement' : 'good'
          }
        })
      })
    }).observe({ entryTypes: ['first-input'] })

    // Track CLS (Cumulative Layout Shift)
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      
      this.trackEvent({
        type: 'custom',
        metadata: {
          eventType: 'web_vital',
          metric: 'cls',
          value: clsValue,
          rating: clsValue > 0.25 ? 'poor' : clsValue > 0.1 ? 'needs-improvement' : 'good'
        }
      })
    }).observe({ entryTypes: ['layout-shift'] })
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string) {
    this.userId = userId
  }

  /**
   * Enable/disable tracking
   */
  setTracking(enabled: boolean) {
    this.isTracking = enabled
  }

  /**
   * Get current session data
   */
  getSession(): AnalyticsSession {
    return {
      id: this.sessionId,
      startTime: this.sessionStartTime,
      endTime: new Date(),
      duration: Date.now() - this.sessionStartTime.getTime(),
      pageViews: this.events.filter(e => e.type === 'page_view').length,
      events: this.events.length,
      bounceRate: this.events.filter(e => e.type === 'page_view').length <= 1,
      conversionEvents: this.events.filter(e => e.metadata?.eventType === 'conversion').map(e => e.metadata?.goal),
      device: this.getDeviceInfo(),
      location: this.getLocationInfo(),
      referrer: document.referrer,
      landingPage: this.events.find(e => e.type === 'page_view')?.page || '',
      exitPage: this.currentPage
    }
  }

  /**
   * Private helper methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent
    const screenWidth = window.screen.width
    
    return {
      type: screenWidth < 768 ? 'mobile' : screenWidth < 1024 ? 'tablet' : 'desktop',
      os: this.getOS(userAgent),
      browser: this.getBrowser(userAgent),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      touchSupport: 'ontouchstart' in window
    }
  }

  private getLocationInfo(): LocationInfo {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    }
  }

  private getConnectionInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      }
    }
    
    return undefined
  }

  private getOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  private getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private trackScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollPercent = Math.round((scrollTop / documentHeight) * 100)
    
    this.scrollDepth = Math.max(this.scrollDepth, scrollPercent)
  }

  private trackClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    const tagName = target.tagName.toLowerCase()
    const text = target.textContent?.trim().substring(0, 100)
    
    this.trackEvent({
      type: 'click',
      metadata: {
        element: tagName,
        text,
        className: target.className,
        id: target.id,
        href: tagName === 'a' ? (target as HTMLAnchorElement).href : undefined
      }
    })
  }

  private trackFormSubmit(event: SubmitEvent) {
    const form = event.target as HTMLFormElement
    
    this.trackEvent({
      type: 'form_submit',
      metadata: {
        formId: form.id,
        formAction: form.action,
        formMethod: form.method,
        fieldCount: form.elements.length
      }
    })
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.trackEvent({
        type: 'custom',
        metadata: {
          eventType: 'page_hidden',
          timeOnPage: Date.now() - this.pageStartTime.getTime()
        }
      })
    } else {
      this.pageStartTime = new Date()
      this.trackEvent({
        type: 'custom',
        metadata: { eventType: 'page_visible' }
      })
    }
  }

  private handlePageUnload() {
    this.trackEvent({
      type: 'custom',
      metadata: {
        eventType: 'page_unload',
        timeOnPage: Date.now() - this.pageStartTime.getTime(),
        scrollDepth: this.scrollDepth
      },
      exitPage: true
    })
    
    // Send any pending events
    this.sendBatch()
  }

  private initializePerformanceMonitoring() {
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.trackEvent({
              type: 'custom',
              metadata: {
                eventType: 'resource_load',
                resource: entry.name,
                duration: entry.duration,
                size: (entry as any).transferSize
              }
            })
          }
        })
      })
      
      this.performanceObserver.observe({ entryTypes: ['resource', 'navigation'] })
    }
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true
      })
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  private async sendPerformanceMetrics(metrics: PerformanceMetrics) {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
        keepalive: true
      })
    } catch (error) {
      console.error('Failed to send performance metrics:', error)
    }
  }

  private async sendBatch() {
    if (this.events.length === 0) return
    
    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: this.getSession(),
          events: this.events
        }),
        keepalive: true
      })
      
      this.events = []
    } catch (error) {
      console.error('Failed to send analytics batch:', error)
    }
  }
}

// Export singleton instance
export const analyticsClient = new AnalyticsClient()

// Export utility functions
export const trackPageView = (page?: string, metadata?: Record<string, any>) => {
  analyticsClient.trackPageView(page, metadata)
}

export const trackEvent = (eventData: Partial<AnalyticsEvent>) => {
  analyticsClient.trackEvent(eventData)
}

export const trackConversion = (goal: string, value?: number, metadata?: Record<string, any>) => {
  analyticsClient.trackConversion(goal, value, metadata)
}

export const trackPerformance = (customMetrics?: Record<string, number>) => {
  analyticsClient.trackPerformance(customMetrics)
}

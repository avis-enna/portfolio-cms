/**
 * Security audit and monitoring utilities
 */

interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'token_refresh' | 'suspicious_activity' | 'rate_limit_hit'
  timestamp: number
  clientId: string
  userId?: string
  username?: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface SecurityMetrics {
  totalEvents: number
  loginAttempts: number
  loginSuccesses: number
  loginFailures: number
  rateLimitHits: number
  suspiciousActivities: number
  uniqueClients: number
  failureRate: number
  averageResponseTime: number
}

class SecurityAuditor {
  private events: SecurityEvent[] = []
  private maxEvents: number
  private alertThresholds: {
    failureRate: number
    rateLimitHits: number
    suspiciousActivities: number
  }

  constructor(maxEvents = 1000) {
    this.maxEvents = maxEvents
    this.alertThresholds = {
      failureRate: 0.5, // 50% failure rate
      rateLimitHits: 10, // 10 rate limit hits per hour
      suspiciousActivities: 5, // 5 suspicious activities per hour
    }
  }

  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    }

    this.events.push(fullEvent)

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Check for alerts
    this.checkAlerts(fullEvent)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY] ${event.type}:`, event.details)
    }
  }

  /**
   * Log login attempt
   */
  logLoginAttempt(clientId: string, username: string, success: boolean, details: Record<string, any> = {}): void {
    this.logEvent({
      type: success ? 'login_success' : 'login_failure',
      clientId,
      username,
      details: {
        ...details,
        userAgent: details.userAgent || 'unknown',
        timestamp: new Date().toISOString(),
      },
      severity: success ? 'low' : 'medium',
    })
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(
    clientId: string,
    activityType: string,
    details: Record<string, any> = {},
    severity: SecurityEvent['severity'] = 'high'
  ): void {
    this.logEvent({
      type: 'suspicious_activity',
      clientId,
      details: {
        activityType,
        ...details,
        timestamp: new Date().toISOString(),
      },
      severity,
    })
  }

  /**
   * Log rate limit hit
   */
  logRateLimitHit(clientId: string, endpoint: string, details: Record<string, any> = {}): void {
    this.logEvent({
      type: 'rate_limit_hit',
      clientId,
      details: {
        endpoint,
        ...details,
        timestamp: new Date().toISOString(),
      },
      severity: 'medium',
    })
  }

  /**
   * Get security metrics for a time period
   */
  getMetrics(hoursBack = 24): SecurityMetrics {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000)
    const recentEvents = this.events.filter(event => event.timestamp >= cutoff)

    const loginAttempts = recentEvents.filter(e => e.type === 'login_attempt').length
    const loginSuccesses = recentEvents.filter(e => e.type === 'login_success').length
    const loginFailures = recentEvents.filter(e => e.type === 'login_failure').length
    const rateLimitHits = recentEvents.filter(e => e.type === 'rate_limit_hit').length
    const suspiciousActivities = recentEvents.filter(e => e.type === 'suspicious_activity').length

    const uniqueClients = new Set(recentEvents.map(e => e.clientId)).size
    const totalLoginAttempts = loginSuccesses + loginFailures
    const failureRate = totalLoginAttempts > 0 ? loginFailures / totalLoginAttempts : 0

    // Calculate average response time if available
    const responseTimes = recentEvents
      .map(e => e.details.responseTime)
      .filter(time => typeof time === 'number')
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    return {
      totalEvents: recentEvents.length,
      loginAttempts: totalLoginAttempts,
      loginSuccesses,
      loginFailures,
      rateLimitHits,
      suspiciousActivities,
      uniqueClients,
      failureRate,
      averageResponseTime,
    }
  }

  /**
   * Get events by type and time period
   */
  getEvents(
    type?: SecurityEvent['type'],
    hoursBack = 24,
    severity?: SecurityEvent['severity']
  ): SecurityEvent[] {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000)
    
    return this.events.filter(event => {
      if (event.timestamp < cutoff) return false
      if (type && event.type !== type) return false
      if (severity && event.severity !== severity) return false
      return true
    })
  }

  /**
   * Get top suspicious clients
   */
  getTopSuspiciousClients(hoursBack = 24, limit = 10): Array<{
    clientId: string
    suspiciousEvents: number
    failedLogins: number
    rateLimitHits: number
    totalEvents: number
  }> {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000)
    const recentEvents = this.events.filter(event => event.timestamp >= cutoff)

    const clientStats = new Map<string, {
      suspiciousEvents: number
      failedLogins: number
      rateLimitHits: number
      totalEvents: number
    }>()

    for (const event of recentEvents) {
      const stats = clientStats.get(event.clientId) || {
        suspiciousEvents: 0,
        failedLogins: 0,
        rateLimitHits: 0,
        totalEvents: 0,
      }

      stats.totalEvents++

      if (event.type === 'suspicious_activity') {
        stats.suspiciousEvents++
      } else if (event.type === 'login_failure') {
        stats.failedLogins++
      } else if (event.type === 'rate_limit_hit') {
        stats.rateLimitHits++
      }

      clientStats.set(event.clientId, stats)
    }

    return Array.from(clientStats.entries())
      .map(([clientId, stats]) => ({ clientId, ...stats }))
      .sort((a, b) => {
        // Sort by suspiciousness score
        const scoreA = a.suspiciousEvents * 3 + a.failedLogins * 2 + a.rateLimitHits
        const scoreB = b.suspiciousEvents * 3 + b.failedLogins * 2 + b.rateLimitHits
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  /**
   * Check for security alerts
   */
  private checkAlerts(event: SecurityEvent): void {
    const metrics = this.getMetrics(1) // Last hour

    // High failure rate alert
    if (metrics.failureRate > this.alertThresholds.failureRate && metrics.loginAttempts > 10) {
      this.triggerAlert('high_failure_rate', {
        failureRate: metrics.failureRate,
        loginAttempts: metrics.loginAttempts,
      })
    }

    // Too many rate limit hits
    if (metrics.rateLimitHits > this.alertThresholds.rateLimitHits) {
      this.triggerAlert('excessive_rate_limits', {
        rateLimitHits: metrics.rateLimitHits,
      })
    }

    // Too many suspicious activities
    if (metrics.suspiciousActivities > this.alertThresholds.suspiciousActivities) {
      this.triggerAlert('excessive_suspicious_activity', {
        suspiciousActivities: metrics.suspiciousActivities,
      })
    }

    // Critical severity events
    if (event.severity === 'critical') {
      this.triggerAlert('critical_security_event', {
        eventType: event.type,
        clientId: event.clientId,
        details: event.details,
      })
    }
  }

  /**
   * Trigger security alert
   */
  private triggerAlert(alertType: string, details: Record<string, any>): void {
    console.warn(`[SECURITY ALERT] ${alertType}:`, details)

    // In production, you would send this to your monitoring system
    // e.g., Sentry, DataDog, CloudWatch, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // monitoringService.sendAlert(alertType, details)
    }
  }

  /**
   * Generate security report
   */
  generateReport(hoursBack = 24): string {
    const metrics = this.getMetrics(hoursBack)
    const suspiciousClients = this.getTopSuspiciousClients(hoursBack, 5)
    const criticalEvents = this.getEvents(undefined, hoursBack, 'critical')

    let report = `Security Report (Last ${hoursBack} hours)\n`
    report += `=====================================\n\n`

    report += `Metrics:\n`
    report += `- Total Events: ${metrics.totalEvents}\n`
    report += `- Login Attempts: ${metrics.loginAttempts}\n`
    report += `- Login Success Rate: ${((1 - metrics.failureRate) * 100).toFixed(1)}%\n`
    report += `- Rate Limit Hits: ${metrics.rateLimitHits}\n`
    report += `- Suspicious Activities: ${metrics.suspiciousActivities}\n`
    report += `- Unique Clients: ${metrics.uniqueClients}\n`
    report += `- Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms\n\n`

    if (suspiciousClients.length > 0) {
      report += `Top Suspicious Clients:\n`
      suspiciousClients.forEach((client, index) => {
        report += `${index + 1}. ${client.clientId} - `
        report += `${client.suspiciousEvents} suspicious, `
        report += `${client.failedLogins} failed logins, `
        report += `${client.rateLimitHits} rate limits\n`
      })
      report += `\n`
    }

    if (criticalEvents.length > 0) {
      report += `Critical Events:\n`
      criticalEvents.forEach((event, index) => {
        report += `${index + 1}. ${event.type} from ${event.clientId} at ${new Date(event.timestamp).toISOString()}\n`
      })
    }

    return report
  }

  /**
   * Clear old events
   */
  cleanup(hoursBack = 168): void { // Default: keep 1 week
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000)
    this.events = this.events.filter(event => event.timestamp >= cutoff)
  }
}

// Create singleton instance
export const securityAuditor = new SecurityAuditor()

// Cleanup old events every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    securityAuditor.cleanup()
  }, 60 * 60 * 1000)
}

export default SecurityAuditor

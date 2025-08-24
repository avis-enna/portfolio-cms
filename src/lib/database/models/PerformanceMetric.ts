import mongoose, { Document, Schema } from 'mongoose'

export interface IPerformanceMetric extends Document {
  _id: mongoose.Types.ObjectId
  metricId: string
  timestamp: Date
  page: string
  url: string
  sessionId: string
  userId?: string
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
    
    // Additional performance metrics
    memoryUsage?: number
    cpuUsage?: number
    networkLatency?: number
    cacheHitRate?: number
  }
  device: {
    type: 'desktop' | 'tablet' | 'mobile'
    os: string
    browser: string
    screenResolution: string
    viewport: string
    touchSupport: boolean
  }
  connection?: {
    effectiveType: string
    downlink: number
    rtt: number
    saveData?: boolean
  }
  performanceScore: number
  webVitalsScore: number
  createdAt: Date
  updatedAt: Date
}

const PerformanceMetricSchema = new Schema<IPerformanceMetric>(
  {
    metricId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    page: {
      type: String,
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    metrics: {
      // Core Web Vitals
      lcp: {
        type: Number,
        min: 0,
      },
      fid: {
        type: Number,
        min: 0,
      },
      cls: {
        type: Number,
        min: 0,
      },
      fcp: {
        type: Number,
        min: 0,
      },
      ttfb: {
        type: Number,
        min: 0,
      },
      
      // Custom metrics
      domContentLoaded: {
        type: Number,
        min: 0,
      },
      loadComplete: {
        type: Number,
        min: 0,
      },
      resourceLoadTime: {
        type: Number,
        min: 0,
      },
      apiResponseTime: {
        type: Number,
        min: 0,
      },
      renderTime: {
        type: Number,
        min: 0,
      },
      
      // Additional metrics
      memoryUsage: {
        type: Number,
        min: 0,
      },
      cpuUsage: {
        type: Number,
        min: 0,
        max: 100,
      },
      networkLatency: {
        type: Number,
        min: 0,
      },
      cacheHitRate: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    device: {
      type: {
        type: String,
        required: true,
        enum: ['desktop', 'tablet', 'mobile'],
        index: true,
      },
      os: {
        type: String,
        required: true,
        index: true,
      },
      browser: {
        type: String,
        required: true,
        index: true,
      },
      screenResolution: {
        type: String,
        required: true,
      },
      viewport: {
        type: String,
        required: true,
      },
      touchSupport: {
        type: Boolean,
        required: true,
      },
    },
    connection: {
      effectiveType: {
        type: String,
        enum: ['slow-2g', '2g', '3g', '4g'],
        index: true,
      },
      downlink: {
        type: Number,
        min: 0,
      },
      rtt: {
        type: Number,
        min: 0,
      },
      saveData: {
        type: Boolean,
      },
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      index: true,
    },
    webVitalsScore: {
      type: Number,
      min: 0,
      max: 100,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v
        return ret
      },
    },
  }
)

// Indexes for performance (timestamp already has index from schema definition)
PerformanceMetricSchema.index({ page: 1, timestamp: -1 })
PerformanceMetricSchema.index({ 'device.type': 1, timestamp: -1 })
PerformanceMetricSchema.index({ performanceScore: -1, timestamp: -1 })
PerformanceMetricSchema.index({ webVitalsScore: -1, timestamp: -1 })

// Compound indexes
PerformanceMetricSchema.index({ page: 1, 'device.type': 1, timestamp: -1 })
PerformanceMetricSchema.index({ sessionId: 1, timestamp: 1 })

// TTL index to automatically delete old metrics (keep 1 year)
PerformanceMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 })

// Pre-save middleware to calculate performance scores
PerformanceMetricSchema.pre('save', function(next) {
  this.performanceScore = this.calculatePerformanceScore()
  this.webVitalsScore = this.calculateWebVitalsScore()
  next()
})

// Instance methods
PerformanceMetricSchema.methods.calculatePerformanceScore = function(): number {
  let score = 100
  const metrics = this.metrics
  
  // Deduct points based on performance thresholds
  if (metrics.lcp && metrics.lcp > 4000) score -= 30
  else if (metrics.lcp && metrics.lcp > 2500) score -= 15
  
  if (metrics.fid && metrics.fid > 300) score -= 25
  else if (metrics.fid && metrics.fid > 100) score -= 10
  
  if (metrics.cls && metrics.cls > 0.25) score -= 25
  else if (metrics.cls && metrics.cls > 0.1) score -= 10
  
  if (metrics.fcp && metrics.fcp > 3000) score -= 15
  else if (metrics.fcp && metrics.fcp > 1800) score -= 7
  
  if (metrics.ttfb && metrics.ttfb > 800) score -= 10
  else if (metrics.ttfb && metrics.ttfb > 600) score -= 5
  
  return Math.max(score, 0)
}

PerformanceMetricSchema.methods.calculateWebVitalsScore = function(): number {
  const metrics = this.metrics
  let score = 0
  let totalMetrics = 0
  
  // LCP scoring
  if (metrics.lcp !== undefined) {
    totalMetrics++
    if (metrics.lcp <= 2500) score += 100
    else if (metrics.lcp <= 4000) score += 50
    else score += 0
  }
  
  // FID scoring
  if (metrics.fid !== undefined) {
    totalMetrics++
    if (metrics.fid <= 100) score += 100
    else if (metrics.fid <= 300) score += 50
    else score += 0
  }
  
  // CLS scoring
  if (metrics.cls !== undefined) {
    totalMetrics++
    if (metrics.cls <= 0.1) score += 100
    else if (metrics.cls <= 0.25) score += 50
    else score += 0
  }
  
  return totalMetrics > 0 ? Math.round(score / totalMetrics) : 0
}

// Static methods
PerformanceMetricSchema.statics.getPerformanceOverview = function (startDate: Date, endDate: Date, page?: string) {
  const matchQuery: any = {
    timestamp: { $gte: startDate, $lte: endDate }
  }
  
  if (page) {
    matchQuery.page = page
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        avgPerformanceScore: { $avg: '$performanceScore' },
        avgWebVitalsScore: { $avg: '$webVitalsScore' },
        avgLCP: { $avg: '$metrics.lcp' },
        avgFID: { $avg: '$metrics.fid' },
        avgCLS: { $avg: '$metrics.cls' },
        avgFCP: { $avg: '$metrics.fcp' },
        avgTTFB: { $avg: '$metrics.ttfb' },
        avgLoadTime: { $avg: '$metrics.loadComplete' },
        totalMeasurements: { $sum: 1 },
        goodLCP: { $sum: { $cond: [{ $lte: ['$metrics.lcp', 2500] }, 1, 0] } },
        goodFID: { $sum: { $cond: [{ $lte: ['$metrics.fid', 100] }, 1, 0] } },
        goodCLS: { $sum: { $cond: [{ $lte: ['$metrics.cls', 0.1] }, 1, 0] } }
      }
    },
    {
      $project: {
        avgPerformanceScore: { $round: ['$avgPerformanceScore', 1] },
        avgWebVitalsScore: { $round: ['$avgWebVitalsScore', 1] },
        avgLCP: { $round: ['$avgLCP', 0] },
        avgFID: { $round: ['$avgFID', 1] },
        avgCLS: { $round: ['$avgCLS', 3] },
        avgFCP: { $round: ['$avgFCP', 0] },
        avgTTFB: { $round: ['$avgTTFB', 0] },
        avgLoadTime: { $round: ['$avgLoadTime', 0] },
        totalMeasurements: 1,
        lcpPassRate: { $round: [{ $multiply: [{ $divide: ['$goodLCP', '$totalMeasurements'] }, 100] }, 1] },
        fidPassRate: { $round: [{ $multiply: [{ $divide: ['$goodFID', '$totalMeasurements'] }, 100] }, 1] },
        clsPassRate: { $round: [{ $multiply: [{ $divide: ['$goodCLS', '$totalMeasurements'] }, 100] }, 1] }
      }
    }
  ])
}

PerformanceMetricSchema.statics.getPerformanceByPage = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$page',
        avgPerformanceScore: { $avg: '$performanceScore' },
        avgWebVitalsScore: { $avg: '$webVitalsScore' },
        avgLCP: { $avg: '$metrics.lcp' },
        avgFID: { $avg: '$metrics.fid' },
        avgCLS: { $avg: '$metrics.cls' },
        avgLoadTime: { $avg: '$metrics.loadComplete' },
        measurements: { $sum: 1 }
      }
    },
    {
      $project: {
        page: '$_id',
        avgPerformanceScore: { $round: ['$avgPerformanceScore', 1] },
        avgWebVitalsScore: { $round: ['$avgWebVitalsScore', 1] },
        avgLCP: { $round: ['$avgLCP', 0] },
        avgFID: { $round: ['$avgFID', 1] },
        avgCLS: { $round: ['$avgCLS', 3] },
        avgLoadTime: { $round: ['$avgLoadTime', 0] },
        measurements: 1
      }
    },
    {
      $sort: { avgPerformanceScore: -1 }
    }
  ])
}

PerformanceMetricSchema.statics.getPerformanceByDevice = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$device.type',
        avgPerformanceScore: { $avg: '$performanceScore' },
        avgWebVitalsScore: { $avg: '$webVitalsScore' },
        avgLCP: { $avg: '$metrics.lcp' },
        avgFID: { $avg: '$metrics.fid' },
        avgCLS: { $avg: '$metrics.cls' },
        measurements: { $sum: 1 }
      }
    },
    {
      $project: {
        deviceType: '$_id',
        avgPerformanceScore: { $round: ['$avgPerformanceScore', 1] },
        avgWebVitalsScore: { $round: ['$avgWebVitalsScore', 1] },
        avgLCP: { $round: ['$avgLCP', 0] },
        avgFID: { $round: ['$avgFID', 1] },
        avgCLS: { $round: ['$avgCLS', 3] },
        measurements: 1
      }
    },
    {
      $sort: { measurements: -1 }
    }
  ])
}

PerformanceMetricSchema.statics.getPerformanceTrends = function (startDate: Date, endDate: Date, interval: 'hour' | 'day' = 'day') {
  const dateFormat = interval === 'hour' 
    ? { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } }
    : { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: dateFormat,
        avgPerformanceScore: { $avg: '$performanceScore' },
        avgWebVitalsScore: { $avg: '$webVitalsScore' },
        avgLCP: { $avg: '$metrics.lcp' },
        avgFID: { $avg: '$metrics.fid' },
        avgCLS: { $avg: '$metrics.cls' },
        measurements: { $sum: 1 }
      }
    },
    {
      $project: {
        date: '$_id',
        avgPerformanceScore: { $round: ['$avgPerformanceScore', 1] },
        avgWebVitalsScore: { $round: ['$avgWebVitalsScore', 1] },
        avgLCP: { $round: ['$avgLCP', 0] },
        avgFID: { $round: ['$avgFID', 1] },
        avgCLS: { $round: ['$avgCLS', 3] },
        measurements: 1
      }
    },
    {
      $sort: { date: 1 }
    }
  ])
}

// Prevent multiple models compilation error
const PerformanceMetric = mongoose.models.PerformanceMetric || mongoose.model<IPerformanceMetric>('PerformanceMetric', PerformanceMetricSchema)

export default PerformanceMetric

import mongoose, { Document, Schema } from 'mongoose'

export interface IAnalyticsSession extends Document {
  _id: mongoose.Types.ObjectId
  sessionId: string
  startTime: Date
  endTime?: Date
  duration?: number
  pageViews: number
  events: number
  bounceRate: boolean
  conversionEvents: string[]
  device: {
    type: 'desktop' | 'tablet' | 'mobile'
    os: string
    browser: string
    screenResolution: string
    viewport: string
    touchSupport: boolean
  }
  location?: {
    country?: string
    region?: string
    city?: string
    timezone: string
    language: string
  }
  referrer?: string
  landingPage: string
  exitPage?: string
  userId?: string
  isReturningVisitor: boolean
  avgScrollDepth: number
  maxScrollDepth: number
  totalInteractions: number
  createdAt: Date
  updatedAt: Date
}

const AnalyticsSessionSchema = new Schema<IAnalyticsSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      index: true,
    },
    duration: {
      type: Number, // in milliseconds
      min: 0,
    },
    pageViews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    events: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    bounceRate: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    conversionEvents: [{
      type: String,
    }],
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
    location: {
      country: {
        type: String,
        index: true,
      },
      region: {
        type: String,
        index: true,
      },
      city: {
        type: String,
        index: true,
      },
      timezone: {
        type: String,
        required: true,
        index: true,
      },
      language: {
        type: String,
        required: true,
        index: true,
      },
    },
    referrer: {
      type: String,
      index: true,
    },
    landingPage: {
      type: String,
      required: true,
      index: true,
    },
    exitPage: {
      type: String,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    isReturningVisitor: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    avgScrollDepth: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    maxScrollDepth: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    totalInteractions: {
      type: Number,
      default: 0,
      min: 0,
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

// Indexes for performance
AnalyticsSessionSchema.index({ startTime: -1 })
AnalyticsSessionSchema.index({ endTime: -1 })
AnalyticsSessionSchema.index({ duration: -1 })
AnalyticsSessionSchema.index({ 'device.type': 1, startTime: -1 })
AnalyticsSessionSchema.index({ 'location.country': 1, startTime: -1 })
AnalyticsSessionSchema.index({ landingPage: 1, startTime: -1 })
AnalyticsSessionSchema.index({ bounceRate: 1, startTime: -1 })

// Compound indexes
AnalyticsSessionSchema.index({ startTime: -1, bounceRate: 1 })
AnalyticsSessionSchema.index({ 'device.type': 1, bounceRate: 1, startTime: -1 })

// TTL index to automatically delete old sessions (keep 2 years)
AnalyticsSessionSchema.index({ startTime: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 })

// Virtual for session quality score
AnalyticsSessionSchema.virtual('qualityScore').get(function() {
  let score = 0
  
  // Duration score (0-40 points)
  if (this.duration) {
    if (this.duration > 300000) score += 40 // 5+ minutes
    else if (this.duration > 120000) score += 30 // 2-5 minutes
    else if (this.duration > 60000) score += 20 // 1-2 minutes
    else if (this.duration > 30000) score += 10 // 30s-1min
  }
  
  // Page views score (0-30 points)
  if (this.pageViews > 5) score += 30
  else if (this.pageViews > 3) score += 20
  else if (this.pageViews > 1) score += 15
  else score += 5
  
  // Interactions score (0-20 points)
  if (this.totalInteractions > 10) score += 20
  else if (this.totalInteractions > 5) score += 15
  else if (this.totalInteractions > 2) score += 10
  else if (this.totalInteractions > 0) score += 5
  
  // Scroll depth score (0-10 points)
  if (this.maxScrollDepth > 80) score += 10
  else if (this.maxScrollDepth > 50) score += 7
  else if (this.maxScrollDepth > 25) score += 5
  else if (this.maxScrollDepth > 0) score += 2
  
  return Math.min(score, 100)
})

// Static methods
AnalyticsSessionSchema.statics.getSessionStats = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$sessionId' },
        totalPageViews: { $sum: '$pageViews' },
        totalEvents: { $sum: '$events' },
        bounces: { $sum: { $cond: ['$bounceRate', 1, 0] } },
        avgDuration: { $avg: '$duration' },
        avgPageViews: { $avg: '$pageViews' },
        avgScrollDepth: { $avg: '$avgScrollDepth' },
        conversions: { $sum: { $size: '$conversionEvents' } }
      }
    },
    {
      $project: {
        totalSessions: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
        totalPageViews: 1,
        totalEvents: 1,
        bounceRate: { 
          $round: [{ $multiply: [{ $divide: ['$bounces', '$totalSessions'] }, 100] }, 2] 
        },
        avgDuration: { $round: ['$avgDuration', 0] },
        avgPageViews: { $round: ['$avgPageViews', 2] },
        avgScrollDepth: { $round: ['$avgScrollDepth', 2] },
        conversions: 1,
        conversionRate: {
          $round: [{ $multiply: [{ $divide: ['$conversions', '$totalSessions'] }, 100] }, 2]
        }
      }
    }
  ])
}

AnalyticsSessionSchema.statics.getDeviceBreakdown = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$device.type',
        sessions: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        avgPageViews: { $avg: '$pageViews' },
        bounces: { $sum: { $cond: ['$bounceRate', 1, 0] } }
      }
    },
    {
      $project: {
        deviceType: '$_id',
        sessions: 1,
        avgDuration: { $round: ['$avgDuration', 0] },
        avgPageViews: { $round: ['$avgPageViews', 2] },
        bounceRate: { 
          $round: [{ $multiply: [{ $divide: ['$bounces', '$sessions'] }, 100] }, 2] 
        }
      }
    },
    {
      $sort: { sessions: -1 }
    }
  ])
}

AnalyticsSessionSchema.statics.getTopLandingPages = function (startDate: Date, endDate: Date, limit: number = 10) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$landingPage',
        sessions: { $sum: 1 },
        bounces: { $sum: { $cond: ['$bounceRate', 1, 0] } },
        avgDuration: { $avg: '$duration' },
        conversions: { $sum: { $size: '$conversionEvents' } }
      }
    },
    {
      $project: {
        page: '$_id',
        sessions: 1,
        bounceRate: { 
          $round: [{ $multiply: [{ $divide: ['$bounces', '$sessions'] }, 100] }, 2] 
        },
        avgDuration: { $round: ['$avgDuration', 0] },
        conversions: 1,
        conversionRate: {
          $round: [{ $multiply: [{ $divide: ['$conversions', '$sessions'] }, 100] }, 2]
        }
      }
    },
    {
      $sort: { sessions: -1 }
    },
    {
      $limit: limit
    }
  ])
}

AnalyticsSessionSchema.statics.getHourlyDistribution = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $hour: '$startTime' },
        sessions: { $sum: 1 },
        avgDuration: { $avg: '$duration' }
      }
    },
    {
      $project: {
        hour: '$_id',
        sessions: 1,
        avgDuration: { $round: ['$avgDuration', 0] }
      }
    },
    {
      $sort: { hour: 1 }
    }
  ])
}

AnalyticsSessionSchema.statics.getRetentionAnalysis = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$isReturningVisitor',
        sessions: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        avgPageViews: { $avg: '$pageViews' },
        conversions: { $sum: { $size: '$conversionEvents' } }
      }
    },
    {
      $project: {
        visitorType: { $cond: ['$_id', 'Returning', 'New'] },
        sessions: 1,
        avgDuration: { $round: ['$avgDuration', 0] },
        avgPageViews: { $round: ['$avgPageViews', 2] },
        conversions: 1
      }
    }
  ])
}

// Prevent multiple models compilation error
const AnalyticsSession = mongoose.models.AnalyticsSession || mongoose.model<IAnalyticsSession>('AnalyticsSession', AnalyticsSessionSchema)

export default AnalyticsSession

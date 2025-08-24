import mongoose, { Document, Schema } from 'mongoose'

export interface IAnalyticsEvent extends Document {
  _id: mongoose.Types.ObjectId
  eventId: string
  type: 'page_view' | 'click' | 'scroll' | 'form_submit' | 'download' | 'contact' | 'project_view' | 'blog_read' | 'custom'
  timestamp: Date
  sessionId: string
  userId?: string
  page: string
  url: string
  referrer?: string
  userAgent: string
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
  metadata?: Record<string, any>
  duration?: number
  scrollDepth?: number
  exitPage?: boolean
  createdAt: Date
  updatedAt: Date
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['page_view', 'click', 'scroll', 'form_submit', 'download', 'contact', 'project_view', 'blog_read', 'custom'],
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
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
    page: {
      type: String,
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    referrer: {
      type: String,
    },
    userAgent: {
      type: String,
      required: true,
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
    metadata: {
      type: Schema.Types.Mixed,
    },
    duration: {
      type: Number,
    },
    scrollDepth: {
      type: Number,
      min: 0,
      max: 100,
    },
    exitPage: {
      type: Boolean,
      default: false,
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
AnalyticsEventSchema.index({ sessionId: 1, timestamp: 1 })
AnalyticsEventSchema.index({ type: 1, timestamp: -1 })
AnalyticsEventSchema.index({ page: 1, timestamp: -1 })
AnalyticsEventSchema.index({ 'device.type': 1, timestamp: -1 })
AnalyticsEventSchema.index({ 'location.country': 1, timestamp: -1 })

// Compound indexes for common queries
AnalyticsEventSchema.index({ type: 1, page: 1, timestamp: -1 })
AnalyticsEventSchema.index({ sessionId: 1, type: 1, timestamp: 1 })

// TTL index to automatically delete old events (optional - keep 1 year)
AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 })

// Static methods
AnalyticsEventSchema.statics.getPageViews = function (startDate: Date, endDate: Date, page?: string) {
  const query: any = {
    type: 'page_view',
    timestamp: { $gte: startDate, $lte: endDate }
  }
  
  if (page) {
    query.page = page
  }
  
  return this.find(query).sort({ timestamp: -1 })
}

AnalyticsEventSchema.statics.getUniqueVisitors = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        type: 'page_view',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$sessionId',
        firstVisit: { $min: '$timestamp' },
        lastVisit: { $max: '$timestamp' },
        pageViews: { $sum: 1 },
        pages: { $addToSet: '$page' }
      }
    },
    {
      $project: {
        sessionId: '$_id',
        firstVisit: 1,
        lastVisit: 1,
        pageViews: 1,
        uniquePages: { $size: '$pages' },
        sessionDuration: {
          $subtract: ['$lastVisit', '$firstVisit']
        }
      }
    }
  ])
}

AnalyticsEventSchema.statics.getTopPages = function (startDate: Date, endDate: Date, limit: number = 10) {
  return this.aggregate([
    {
      $match: {
        type: 'page_view',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$page',
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$sessionId' },
        avgScrollDepth: { $avg: '$scrollDepth' },
        avgDuration: { $avg: '$duration' }
      }
    },
    {
      $project: {
        page: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
        avgScrollDepth: { $round: ['$avgScrollDepth', 2] },
        avgDuration: { $round: ['$avgDuration', 2] }
      }
    },
    {
      $sort: { views: -1 }
    },
    {
      $limit: limit
    }
  ])
}

AnalyticsEventSchema.statics.getDeviceStats = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        type: 'page_view',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$device.type',
          os: '$device.os',
          browser: '$device.browser'
        },
        count: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        device: '$_id',
        count: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ])
}

AnalyticsEventSchema.statics.getReferrerStats = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        type: 'page_view',
        timestamp: { $gte: startDate, $lte: endDate },
        referrer: { $exists: true, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$referrer',
        count: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        referrer: '$_id',
        count: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 20
    }
  ])
}

AnalyticsEventSchema.statics.getConversionEvents = function (startDate: Date, endDate: Date, goal?: string) {
  const query: any = {
    type: 'custom',
    'metadata.eventType': 'conversion',
    timestamp: { $gte: startDate, $lte: endDate }
  }
  
  if (goal) {
    query['metadata.goal'] = goal
  }
  
  return this.find(query).sort({ timestamp: -1 })
}

// Prevent multiple models compilation error
const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema)

export default AnalyticsEvent

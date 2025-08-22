import mongoose, { Document, Schema } from 'mongoose'

export interface IChangeLog extends Document {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  collectionName: string
  documentId: string
  changes?: {
    field: string
    oldValue?: any
    newValue?: any
  }[]
  metadata?: {
    userAgent?: string
    ipAddress?: string
    sessionId?: string
  }
  timestamp: Date
  createdAt: Date
  updatedAt: Date
}

const ChangeLogSchema = new Schema<IChangeLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    action: {
      type: String,
      enum: {
        values: ['CREATE', 'UPDATE', 'DELETE'],
        message: 'Action must be CREATE, UPDATE, or DELETE',
      },
      required: [true, 'Action is required'],
    },
    collectionName: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
      enum: {
        values: ['PortfolioContent', 'BlogPost', 'ContactSubmission', 'User'],
        message: 'Collection name must be one of: PortfolioContent, BlogPost, ContactSubmission, User',
      },
    },
    documentId: {
      type: String,
      required: [true, 'Document ID is required'],
      trim: true,
    },
    changes: {
      type: [
        {
          field: {
            type: String,
            required: [true, 'Field name is required'],
            trim: true,
          },
          oldValue: {
            type: Schema.Types.Mixed,
            default: null,
          },
          newValue: {
            type: Schema.Types.Mixed,
            default: null,
          },
        },
      ],
      default: [],
    },
    metadata: {
      userAgent: {
        type: String,
        trim: true,
        maxlength: [500, 'User agent cannot exceed 500 characters'],
      },
      ipAddress: {
        type: String,
        trim: true,
        match: [
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
          'Please provide a valid IP address',
        ],
      },
      sessionId: {
        type: String,
        trim: true,
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: [true, 'Timestamp is required'],
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

// TTL Index - Documents will be automatically deleted after 7 days (604800 seconds)
ChangeLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 })

// Other indexes
ChangeLogSchema.index({ user: 1 })
ChangeLogSchema.index({ action: 1 })
ChangeLogSchema.index({ collectionName: 1 })
ChangeLogSchema.index({ documentId: 1 })
ChangeLogSchema.index({ timestamp: -1 })

// Compound indexes
ChangeLogSchema.index({ user: 1, timestamp: -1 })
ChangeLogSchema.index({ collectionName: 1, documentId: 1, timestamp: -1 })
ChangeLogSchema.index({ action: 1, timestamp: -1 })

// Static method to log a change
ChangeLogSchema.statics.logChange = async function (
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  collectionName: string,
  documentId: string,
  changes?: Array<{ field: string; oldValue?: any; newValue?: any }>,
  metadata?: { userAgent?: string; ipAddress?: string; sessionId?: string }
) {
  try {
    const changeLog = new this({
      user: userId,
      action,
      collectionName,
      documentId,
      changes: changes || [],
      metadata: metadata || {},
      timestamp: new Date(),
    })
    
    await changeLog.save()
    return changeLog
  } catch (error) {
    console.error('Failed to log change:', error)
    // Don't throw error to avoid breaking the main operation
    return null
  }
}

// Static method to get recent changes
ChangeLogSchema.statics.getRecentChanges = function (limit: number = 50) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'username email')
}

// Static method to get changes by user
ChangeLogSchema.statics.getChangesByUser = function (userId: string, limit?: number) {
  const query = this.find({ user: userId })
    .sort({ timestamp: -1 })
    .populate('user', 'username email')
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to get changes by collection
ChangeLogSchema.statics.getChangesByCollection = function (collectionName: string, limit?: number) {
  const query = this.find({ collectionName })
    .sort({ timestamp: -1 })
    .populate('user', 'username email')
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to get changes by document
ChangeLogSchema.statics.getChangesByDocument = function (
  collectionName: string,
  documentId: string,
  limit?: number
) {
  const query = this.find({ collectionName, documentId })
    .sort({ timestamp: -1 })
    .populate('user', 'username email')
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to get changes by action
ChangeLogSchema.statics.getChangesByAction = function (action: 'CREATE' | 'UPDATE' | 'DELETE', limit?: number) {
  const query = this.find({ action })
    .sort({ timestamp: -1 })
    .populate('user', 'username email')
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to get changes within date range
ChangeLogSchema.statics.getChangesByDateRange = function (
  startDate: Date,
  endDate: Date,
  limit?: number
) {
  const query = this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ timestamp: -1 })
    .populate('user', 'username email')
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to get statistics
ChangeLogSchema.statics.getStats = async function () {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
  
  const [
    totalChanges,
    todayChanges,
    weekChanges,
    createActions,
    updateActions,
    deleteActions,
  ] = await Promise.all([
    this.countDocuments({}),
    this.countDocuments({ timestamp: { $gte: startOfDay } }),
    this.countDocuments({ timestamp: { $gte: startOfWeek } }),
    this.countDocuments({ action: 'CREATE' }),
    this.countDocuments({ action: 'UPDATE' }),
    this.countDocuments({ action: 'DELETE' }),
  ])
  
  return {
    total: totalChanges,
    today: todayChanges,
    thisWeek: weekChanges,
    actions: {
      create: createActions,
      update: updateActions,
      delete: deleteActions,
    },
  }
}

// Static method to clean up old logs (manual cleanup, TTL should handle this automatically)
ChangeLogSchema.statics.cleanupOldLogs = async function (daysOld: number = 7) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate },
  })
  
  return {
    deletedCount: result.deletedCount,
    cutoffDate,
  }
}

// Prevent multiple models compilation error
const ChangeLog = mongoose.models.ChangeLog || mongoose.model<IChangeLog>('ChangeLog', ChangeLogSchema)

export default ChangeLog

import mongoose, { Document, Schema } from 'mongoose'

export interface IContactSubmission extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  subject?: string
  message: string
  isRead: boolean
  isSpam: boolean
  ipAddress?: string
  userAgent?: string
  source: 'contact-form' | 'api' | 'other'
  submittedAt: Date
  readAt?: Date
  createdAt: Date
  updatedAt: Date
  
  // Methods
  markAsRead(): Promise<void>
  markAsUnread(): Promise<void>
  markAsSpam(): Promise<void>
}

const ContactSubmissionSchema = new Schema<IContactSubmission>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      match: [/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters long'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isSpam: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
      trim: true,
      match: [
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
        'Please provide a valid IP address',
      ],
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: [500, 'User agent cannot exceed 500 characters'],
    },
    source: {
      type: String,
      enum: {
        values: ['contact-form', 'api', 'other'],
        message: 'Source must be either contact-form, api, or other',
      },
      default: 'contact-form',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Submission date is required'],
    },
    readAt: {
      type: Date,
      default: null,
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

// Indexes
ContactSubmissionSchema.index({ email: 1 })
ContactSubmissionSchema.index({ isRead: 1 })
ContactSubmissionSchema.index({ isSpam: 1 })
ContactSubmissionSchema.index({ submittedAt: -1 })
ContactSubmissionSchema.index({ source: 1 })
ContactSubmissionSchema.index({ createdAt: -1 })

// Compound indexes
ContactSubmissionSchema.index({ isRead: 1, submittedAt: -1 })
ContactSubmissionSchema.index({ isSpam: 1, submittedAt: -1 })
ContactSubmissionSchema.index({ email: 1, submittedAt: -1 })

// Pre-save middleware
ContactSubmissionSchema.pre('save', function (next) {
  // Set readAt when isRead changes to true
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date()
  }
  
  // Clear readAt when isRead changes to false
  if (this.isModified('isRead') && !this.isRead) {
    this.readAt = undefined
  }
  
  next()
})

// Instance method to mark as read
ContactSubmissionSchema.methods.markAsRead = async function (): Promise<void> {
  this.isRead = true
  this.readAt = new Date()
  await this.save()
}

// Instance method to mark as unread
ContactSubmissionSchema.methods.markAsUnread = async function (): Promise<void> {
  this.isRead = false
  this.readAt = undefined
  await this.save()
}

// Instance method to mark as spam
ContactSubmissionSchema.methods.markAsSpam = async function (): Promise<void> {
  this.isSpam = true
  await this.save()
}

// Static method to get unread submissions
ContactSubmissionSchema.statics.getUnread = function (limit?: number) {
  const query = this.find({ isRead: false, isSpam: false })
    .sort({ submittedAt: -1 })
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to get recent submissions
ContactSubmissionSchema.statics.getRecent = function (days: number = 7, limit?: number) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const query = this.find({
    submittedAt: { $gte: startDate },
    isSpam: false,
  }).sort({ submittedAt: -1 })
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to get submissions by email
ContactSubmissionSchema.statics.getByEmail = function (email: string, limit?: number) {
  const query = this.find({ email: email.toLowerCase() })
    .sort({ submittedAt: -1 })
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to search submissions
ContactSubmissionSchema.statics.search = function (searchTerm: string, limit?: number) {
  const query = this.find({
    isSpam: false,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { subject: { $regex: searchTerm, $options: 'i' } },
      { message: { $regex: searchTerm, $options: 'i' } },
    ],
  }).sort({ submittedAt: -1 })
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to get statistics
ContactSubmissionSchema.statics.getStats = async function () {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const [
    totalSubmissions,
    unreadSubmissions,
    spamSubmissions,
    todaySubmissions,
    weekSubmissions,
    monthSubmissions,
  ] = await Promise.all([
    this.countDocuments({}),
    this.countDocuments({ isRead: false, isSpam: false }),
    this.countDocuments({ isSpam: true }),
    this.countDocuments({ submittedAt: { $gte: startOfDay } }),
    this.countDocuments({ submittedAt: { $gte: startOfWeek } }),
    this.countDocuments({ submittedAt: { $gte: startOfMonth } }),
  ])
  
  return {
    total: totalSubmissions,
    unread: unreadSubmissions,
    spam: spamSubmissions,
    today: todaySubmissions,
    thisWeek: weekSubmissions,
    thisMonth: monthSubmissions,
  }
}

// Static method for spam detection (basic implementation)
ContactSubmissionSchema.statics.detectSpam = function (submission: Partial<IContactSubmission>): boolean {
  const spamKeywords = [
    'viagra', 'casino', 'lottery', 'winner', 'congratulations',
    'click here', 'free money', 'make money fast', 'work from home',
    'weight loss', 'diet pills', 'enlargement', 'mortgage',
  ]
  
  const text = `${submission.name} ${submission.subject} ${submission.message}`.toLowerCase()
  
  // Check for spam keywords
  const hasSpamKeywords = spamKeywords.some(keyword => text.includes(keyword))
  
  // Check for excessive links
  const linkCount = (text.match(/https?:\/\//g) || []).length
  const hasExcessiveLinks = linkCount > 3
  
  // Check for excessive capitalization
  const capsCount = (text.match(/[A-Z]/g) || []).length
  const totalLetters = (text.match(/[a-zA-Z]/g) || []).length
  const hasExcessiveCaps = totalLetters > 0 && (capsCount / totalLetters) > 0.5
  
  return hasSpamKeywords || hasExcessiveLinks || hasExcessiveCaps
}

// Prevent multiple models compilation error
const ContactSubmission = mongoose.models.ContactSubmission || mongoose.model<IContactSubmission>('ContactSubmission', ContactSubmissionSchema)

export default ContactSubmission

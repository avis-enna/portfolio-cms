import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  username: string
  email: string
  password: string
  refreshTokens: string[]
  lastLogin?: Date
  linkedInIntegration?: {
    isConnected: boolean
    accessToken?: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
    profile?: {
      id: string
      firstName?: {
        localized?: Record<string, string>
        preferredLocale?: {
          country: string
          language: string
        }
      }
      lastName?: {
        localized?: Record<string, string>
        preferredLocale?: {
          country: string
          language: string
        }
      }
      email?: string
      profilePicture?: string
    }
    connectedAt?: Date
    lastUsed?: Date
  }
  createdAt: Date
  updatedAt: Date

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>
  addRefreshToken(token: string): Promise<void>
  removeRefreshToken(token: string): Promise<void>
  clearRefreshTokens(): Promise<void>
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in queries by default
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false, // Don't include refresh tokens in queries by default
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    linkedInIntegration: {
      isConnected: {
        type: Boolean,
        default: false,
      },
      accessToken: {
        type: String,
        select: false, // Don't include in queries by default for security
      },
      refreshToken: {
        type: String,
        select: false,
      },
      expiresAt: {
        type: Date,
      },
      scope: {
        type: String,
      },
      profile: {
        id: String,
        firstName: {
          localized: {
            type: Map,
            of: String,
          },
          preferredLocale: {
            country: String,
            language: String,
          },
        },
        lastName: {
          localized: {
            type: Map,
            of: String,
          },
          preferredLocale: {
            country: String,
            language: String,
          },
        },
        email: String,
        profilePicture: String,
      },
      connectedAt: {
        type: Date,
      },
      lastUsed: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password
        delete ret.refreshTokens
        delete ret.__v
        return ret
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password
        delete ret.refreshTokens
        delete ret.__v
        return ret
      },
    },
  }
)

// Indexes
UserSchema.index({ username: 1 }, { unique: true })
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ lastLogin: 1 })

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next()

  try {
    // Hash password with cost of 12
    const saltRounds = 12
    this.password = await bcrypt.hash(this.password, saltRounds)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('Password comparison failed')
  }
}

// Instance method to add refresh token
UserSchema.methods.addRefreshToken = async function (token: string): Promise<void> {
  // Limit to 5 refresh tokens per user (for multiple devices)
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift() // Remove oldest token
  }
  
  this.refreshTokens.push(token)
  await this.save()
}

// Instance method to remove refresh token
UserSchema.methods.removeRefreshToken = async function (token: string): Promise<void> {
  this.refreshTokens = this.refreshTokens.filter((t: string) => t !== token)
  await this.save()
}

// Instance method to clear all refresh tokens
UserSchema.methods.clearRefreshTokens = async function (): Promise<void> {
  this.refreshTokens = []
  await this.save()
}

// Static method to find user by username or email
UserSchema.statics.findByUsernameOrEmail = function (identifier: string) {
  return this.findOne({
    $or: [
      { username: identifier },
      { email: identifier.toLowerCase() },
    ],
  }).select('+password +refreshTokens')
}

// Static method to create admin user if none exists
UserSchema.statics.createAdminIfNotExists = async function () {
  const adminExists = await this.findOne({ username: 'admin' })
  
  if (!adminExists) {
    const adminUser = new this({
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@portfolio.com',
      password: process.env.ADMIN_PASSWORD || 'change-this-password',
    })
    
    await adminUser.save()
    console.log('✅ Admin user created')
    return adminUser
  }
  
  return adminExists
}

// Prevent multiple models compilation error
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User

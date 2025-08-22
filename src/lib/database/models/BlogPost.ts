import mongoose, { Document, Schema } from 'mongoose'

export interface IBlogPost extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'draft' | 'published' | 'archived'
  displayOrder: number
  author: mongoose.Types.ObjectId
  tags: string[]
  categories: string[]
  featuredImage?: string
  seoMetadata: {
    title: string
    description: string
    keywords: string[]
  }
  publishedAt?: Date
  readingTime: number
  viewCount: number
  linkedinShared: boolean
  linkedinSharedAt?: Date
  createdAt: Date
  updatedAt: Date
  
  // Methods
  generateSlug(): string
  calculateReadingTime(): number
  generateExcerpt(): string
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      minlength: [100, 'Content must be at least 100 characters long'],
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
      maxlength: [300, 'Excerpt cannot exceed 300 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: 'Status must be either draft, published, or archived',
      },
      default: 'draft',
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: [0, 'Display order cannot be negative'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.every(tag => tag.length >= 2 && tag.length <= 30)
        },
        message: 'Each tag must be between 2 and 30 characters long',
      },
    },
    categories: {
      type: [String],
      default: [],
      validate: {
        validator: function (categories: string[]) {
          return categories.every(category => category.length >= 2 && category.length <= 50)
        },
        message: 'Each category must be between 2 and 50 characters long',
      },
    },
    featuredImage: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please provide a valid image URL'],
    },
    seoMetadata: {
      title: {
        type: String,
        required: [true, 'SEO title is required'],
        trim: true,
        maxlength: [60, 'SEO title cannot exceed 60 characters'],
      },
      description: {
        type: String,
        required: [true, 'SEO description is required'],
        trim: true,
        maxlength: [160, 'SEO description cannot exceed 160 characters'],
      },
      keywords: {
        type: [String],
        default: [],
      },
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    readingTime: {
      type: Number,
      default: 0,
      min: [0, 'Reading time cannot be negative'],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
    },
    linkedinShared: {
      type: Boolean,
      default: false,
    },
    linkedinSharedAt: {
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
BlogPostSchema.index({ slug: 1 }, { unique: true })
BlogPostSchema.index({ status: 1 })
BlogPostSchema.index({ publishedAt: -1 })
BlogPostSchema.index({ displayOrder: 1 })
BlogPostSchema.index({ author: 1 })
BlogPostSchema.index({ tags: 1 })
BlogPostSchema.index({ categories: 1 })
BlogPostSchema.index({ createdAt: -1 })
BlogPostSchema.index({ updatedAt: -1 })

// Compound indexes
BlogPostSchema.index({ status: 1, publishedAt: -1 })
BlogPostSchema.index({ status: 1, displayOrder: 1 })

// Pre-save middleware
BlogPostSchema.pre('save', function (next) {
  // Generate slug if not provided
  if (!this.slug && this.title) {
    this.slug = this.generateSlug()
  }
  
  // Calculate reading time
  this.readingTime = this.calculateReadingTime()
  
  // Generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.generateExcerpt()
  }
  
  // Set publishedAt when status changes to published
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }
  
  // Clear publishedAt when status changes from published
  if (this.status !== 'published' && this.publishedAt) {
    this.publishedAt = undefined
  }
  
  next()
})

// Instance method to generate slug
BlogPostSchema.methods.generateSlug = function (): string {
  return this.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Instance method to calculate reading time (words per minute = 200)
BlogPostSchema.methods.calculateReadingTime = function (): number {
  const wordsPerMinute = 200
  const wordCount = this.content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

// Instance method to generate excerpt
BlogPostSchema.methods.generateExcerpt = function (): string {
  // Remove markdown and HTML tags
  const plainText = this.content
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()
  
  // Truncate to 250 characters and add ellipsis
  if (plainText.length <= 250) {
    return plainText
  }
  
  return plainText.substring(0, 250).trim() + '...'
}

// Static method to get published posts
BlogPostSchema.statics.getPublished = function (limit?: number, skip?: number) {
  const query = this.find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .populate('author', 'username email')
  
  if (limit) query.limit(limit)
  if (skip) query.skip(skip)
  
  return query
}

// Static method to get posts by tag
BlogPostSchema.statics.getByTag = function (tag: string, limit?: number) {
  const query = this.find({ 
    status: 'published',
    tags: { $in: [tag] }
  })
    .sort({ publishedAt: -1 })
    .populate('author', 'username email')
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to get posts by category
BlogPostSchema.statics.getByCategory = function (category: string, limit?: number) {
  const query = this.find({ 
    status: 'published',
    categories: { $in: [category] }
  })
    .sort({ publishedAt: -1 })
    .populate('author', 'username email')
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to search posts
BlogPostSchema.statics.search = function (searchTerm: string, limit?: number) {
  const query = this.find({
    status: 'published',
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { content: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } },
      { categories: { $in: [new RegExp(searchTerm, 'i')] } },
    ],
  })
    .sort({ publishedAt: -1 })
    .populate('author', 'username email')
  
  if (limit) query.limit(limit)
  
  return query
}

// Static method to increment view count
BlogPostSchema.statics.incrementViewCount = function (id: string) {
  return this.findByIdAndUpdate(
    id,
    { $inc: { viewCount: 1 } },
    { new: true }
  )
}

// Prevent multiple models compilation error
const BlogPost = mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema)

export default BlogPost

import mongoose, { Document, Schema } from 'mongoose'

// Interfaces for nested objects
export interface ITechnicalSkill {
  category: string
  skills: string[]
}

export interface IExperience {
  title: string
  company: string
  startDate: Date
  endDate?: Date
  responsibilities: string[]
  technologies?: string[]
  achievements?: string[]
}

export interface IEducation {
  degree: string
  institution: string
  year: number
  gpa?: number
  honors?: string[]
  relevantCourses?: string[]
}

export interface IProject {
  title: string
  description: string
  technologies: string[]
  link?: string
  githubUrl?: string
  imageUrl?: string
  featured: boolean
  startDate?: Date
  endDate?: Date
  status: 'completed' | 'in-progress' | 'planned'
}

export interface ICertification {
  name: string
  issuer: string
  date: Date
  expiryDate?: Date
  credentialId?: string
  credentialUrl?: string
}

export interface IPortfolioContent extends Document {
  _id: mongoose.Types.ObjectId
  summary: string
  technicalSkills: ITechnicalSkill[]
  softSkills: string[]
  experience: IExperience[]
  education: IEducation[]
  projects: IProject[]
  certifications: ICertification[]
  contactInfo: {
    email: string
    phone?: string
    location: string
    linkedin?: string
    github?: string
    website?: string
  }
  seoMetadata: {
    title: string
    description: string
    keywords: string[]
  }
  createdAt: Date
  updatedAt: Date
}

// Sub-schemas
const TechnicalSkillSchema = new Schema<ITechnicalSkill>({
  category: {
    type: String,
    required: [true, 'Skill category is required'],
    trim: true,
  },
  skills: {
    type: [String],
    required: [true, 'Skills array is required'],
    validate: {
      validator: function (skills: string[]) {
        return skills.length > 0
      },
      message: 'At least one skill is required per category',
    },
  },
})

const ExperienceSchema = new Schema<IExperience>({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    default: null,
  },
  responsibilities: {
    type: [String],
    required: [true, 'Responsibilities are required'],
    validate: {
      validator: function (responsibilities: string[]) {
        return responsibilities.length > 0
      },
      message: 'At least one responsibility is required',
    },
  },
  technologies: {
    type: [String],
    default: [],
  },
  achievements: {
    type: [String],
    default: [],
  },
})

const EducationSchema = new Schema<IEducation>({
  degree: {
    type: String,
    required: [true, 'Degree is required'],
    trim: true,
  },
  institution: {
    type: String,
    required: [true, 'Institution is required'],
    trim: true,
  },
  year: {
    type: Number,
    required: [true, 'Graduation year is required'],
    min: [1950, 'Year must be after 1950'],
    max: [new Date().getFullYear() + 10, 'Year cannot be more than 10 years in the future'],
  },
  gpa: {
    type: Number,
    min: [0, 'GPA cannot be negative'],
    max: [4.0, 'GPA cannot exceed 4.0'],
  },
  honors: {
    type: [String],
    default: [],
  },
  relevantCourses: {
    type: [String],
    default: [],
  },
})

const ProjectSchema = new Schema<IProject>({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
  },
  technologies: {
    type: [String],
    required: [true, 'Technologies are required'],
    validate: {
      validator: function (technologies: string[]) {
        return technologies.length > 0
      },
      message: 'At least one technology is required',
    },
  },
  link: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
  },
  githubUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid GitHub URL'],
  },
  imageUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid image URL'],
  },
  featured: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['completed', 'in-progress', 'planned'],
    default: 'completed',
  },
})

const CertificationSchema = new Schema<ICertification>({
  name: {
    type: String,
    required: [true, 'Certification name is required'],
    trim: true,
  },
  issuer: {
    type: String,
    required: [true, 'Issuer is required'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Certification date is required'],
  },
  expiryDate: {
    type: Date,
  },
  credentialId: {
    type: String,
    trim: true,
  },
  credentialUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid credential URL'],
  },
})

// Main schema
const PortfolioContentSchema = new Schema<IPortfolioContent>(
  {
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
      minlength: [50, 'Summary must be at least 50 characters long'],
      maxlength: [1000, 'Summary cannot exceed 1000 characters'],
    },
    technicalSkills: {
      type: [TechnicalSkillSchema],
      required: [true, 'Technical skills are required'],
      validate: {
        validator: function (skills: ITechnicalSkill[]) {
          return skills.length > 0
        },
        message: 'At least one technical skill category is required',
      },
    },
    softSkills: {
      type: [String],
      required: [true, 'Soft skills are required'],
      validate: {
        validator: function (skills: string[]) {
          return skills.length > 0
        },
        message: 'At least one soft skill is required',
      },
    },
    experience: {
      type: [ExperienceSchema],
      default: [],
    },
    education: {
      type: [EducationSchema],
      default: [],
    },
    projects: {
      type: [ProjectSchema],
      default: [],
    },
    certifications: {
      type: [CertificationSchema],
      default: [],
    },
    contactInfo: {
      email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
      },
      phone: {
        type: String,
        trim: true,
      },
      location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
      },
      linkedin: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please provide a valid LinkedIn URL'],
      },
      github: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please provide a valid GitHub URL'],
      },
      website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please provide a valid website URL'],
      },
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
PortfolioContentSchema.index({ 'projects.featured': 1 })
PortfolioContentSchema.index({ 'projects.status': 1 })
PortfolioContentSchema.index({ 'experience.startDate': -1 })
PortfolioContentSchema.index({ 'education.year': -1 })

// Static method to get or create portfolio content
PortfolioContentSchema.statics.getOrCreateDefault = async function () {
  let content = await this.findOne()
  
  if (!content) {
    content = new this({
      summary: 'Experienced Software Engineer specializing in scalable systems and modern technologies.',
      technicalSkills: [
        {
          category: 'Programming Languages',
          skills: ['JavaScript', 'TypeScript', 'Python', 'Java'],
        },
        {
          category: 'Frontend',
          skills: ['React', 'Next.js', 'Vue.js', 'HTML5', 'CSS3'],
        },
        {
          category: 'Backend',
          skills: ['Node.js', 'Express.js', 'MongoDB', 'PostgreSQL'],
        },
      ],
      softSkills: ['Leadership', 'Problem Solving', 'Communication', 'Team Collaboration'],
      contactInfo: {
        email: 'contact@portfolio.com',
        location: 'Remote',
      },
      seoMetadata: {
        title: 'Software Engineer Portfolio',
        description: 'Professional portfolio showcasing software engineering expertise',
        keywords: ['software engineer', 'full stack', 'react', 'node.js'],
      },
    })
    
    await content.save()
    console.log('✅ Default portfolio content created')
  }
  
  return content
}

// Prevent multiple models compilation error
const PortfolioContent = mongoose.models.PortfolioContent || mongoose.model<IPortfolioContent>('PortfolioContent', PortfolioContentSchema)

export default PortfolioContent

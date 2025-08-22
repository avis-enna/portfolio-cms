const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not defined')
  process.exit(1)
}

// User Schema (simplified for script)
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshTokens: {
    type: [String],
    default: [],
  },
  lastLogin: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
})

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  
  try {
    const saltRounds = 12
    this.password = await bcrypt.hash(this.password, saltRounds)
    next()
  } catch (error) {
    next(error)
  }
})

const User = mongoose.model('User', UserSchema)

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
    })
    
    console.log('✅ Connected to MongoDB')
    
    // Check if admin user exists
    const adminExists = await User.findOne({ username: 'admin' })
    
    if (adminExists) {
      console.log('✅ Admin user already exists')
    } else {
      // Create admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@test.com',
        password: 'testpassword123', // This will be hashed by the pre-save middleware
      })
      
      await adminUser.save()
      console.log('✅ Admin user created successfully')
      console.log('   Username: admin')
      console.log('   Password: testpassword123')
      console.log('   Email: admin@test.com')
    }
    
    console.log('✅ Database initialization complete')
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run the initialization
initializeDatabase()

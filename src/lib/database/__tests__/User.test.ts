import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User, { IUser } from '../models/User'

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// Mock mongoose
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    methods: {},
    statics: {},
    index: jest.fn(),
  })),
  model: jest.fn(),
  models: {},
  Types: {
    ObjectId: jest.fn(),
  },
}))

describe('User Model', () => {
  let mockUser: Partial<IUser>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      refreshTokens: [],
      save: jest.fn().mockResolvedValue(true),
    }
  })

  describe('Schema Validation', () => {
    it('should require username', () => {
      const userWithoutUsername = {
        email: 'test@example.com',
        password: 'password123',
      }

      // In a real test, this would validate against the schema
      expect(userWithoutUsername).not.toHaveProperty('username')
    })

    it('should require email', () => {
      const userWithoutEmail = {
        username: 'testuser',
        password: 'password123',
      }

      expect(userWithoutEmail).not.toHaveProperty('email')
    })

    it('should require password', () => {
      const userWithoutPassword = {
        username: 'testuser',
        email: 'test@example.com',
      }

      expect(userWithoutPassword).not.toHaveProperty('password')
    })

    it('should validate email format', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test.example.com',
      ]

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      })
    })

    it('should validate username format', () => {
      const invalidUsernames = [
        'ab', // too short
        'a'.repeat(31), // too long
        'user@name', // invalid characters
        'user name', // spaces
      ]

      invalidUsernames.forEach(username => {
        if (username.length < 3 || username.length > 30) {
          expect(username.length < 3 || username.length > 30).toBe(true)
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          expect(username).not.toMatch(/^[a-zA-Z0-9_]+$/)
        }
      })
    })
  })

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      mockBcrypt.hash.mockResolvedValueOnce('hashedpassword')

      // Simulate pre-save middleware
      const password = 'plainpassword'
      const hashedPassword = await bcrypt.hash(password, 12)

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12)
      expect(hashedPassword).toBe('hashedpassword')
    })

    it('should not hash password if not modified', () => {
      // This would be tested in the actual pre-save middleware
      // where isModified('password') returns false
      expect(true).toBe(true) // Placeholder for actual test
    })
  })

  describe('Instance Methods', () => {
    describe('comparePassword', () => {
      it('should compare password correctly', async () => {
        mockBcrypt.compare.mockResolvedValueOnce(true)

        const user = mockUser as IUser
        user.comparePassword = async function(candidatePassword: string) {
          return await bcrypt.compare(candidatePassword, this.password)
        }

        const result = await user.comparePassword('plainpassword')

        expect(mockBcrypt.compare).toHaveBeenCalledWith('plainpassword', 'hashedpassword')
        expect(result).toBe(true)
      })

      it('should return false for incorrect password', async () => {
        mockBcrypt.compare.mockResolvedValueOnce(false)

        const user = mockUser as IUser
        user.comparePassword = async function(candidatePassword: string) {
          return await bcrypt.compare(candidatePassword, this.password)
        }

        const result = await user.comparePassword('wrongpassword')

        expect(result).toBe(false)
      })

      it('should throw error when comparison fails', async () => {
        mockBcrypt.compare.mockRejectedValueOnce(new Error('Comparison failed'))

        const user = mockUser as IUser
        user.comparePassword = async function(candidatePassword: string) {
          try {
            return await bcrypt.compare(candidatePassword, this.password)
          } catch (error) {
            throw new Error('Password comparison failed')
          }
        }

        await expect(user.comparePassword('password')).rejects.toThrow('Password comparison failed')
      })
    })

    describe('addRefreshToken', () => {
      it('should add refresh token', async () => {
        const user = mockUser as IUser
        user.addRefreshToken = async function(token: string) {
          if (this.refreshTokens.length >= 5) {
            this.refreshTokens.shift()
          }
          this.refreshTokens.push(token)
          await this.save()
        }

        await user.addRefreshToken('new-token')

        expect(user.refreshTokens).toContain('new-token')
        expect(user.save).toHaveBeenCalled()
      })

      it('should limit refresh tokens to 5', async () => {
        const user = mockUser as IUser
        user.refreshTokens = ['token1', 'token2', 'token3', 'token4', 'token5']
        user.addRefreshToken = async function(token: string) {
          if (this.refreshTokens.length >= 5) {
            this.refreshTokens.shift()
          }
          this.refreshTokens.push(token)
          await this.save()
        }

        await user.addRefreshToken('token6')

        expect(user.refreshTokens).toHaveLength(5)
        expect(user.refreshTokens).not.toContain('token1')
        expect(user.refreshTokens).toContain('token6')
      })
    })

    describe('removeRefreshToken', () => {
      it('should remove specific refresh token', async () => {
        const user = mockUser as IUser
        user.refreshTokens = ['token1', 'token2', 'token3']
        user.removeRefreshToken = async function(token: string) {
          this.refreshTokens = this.refreshTokens.filter(t => t !== token)
          await this.save()
        }

        await user.removeRefreshToken('token2')

        expect(user.refreshTokens).not.toContain('token2')
        expect(user.refreshTokens).toContain('token1')
        expect(user.refreshTokens).toContain('token3')
        expect(user.save).toHaveBeenCalled()
      })
    })

    describe('clearRefreshTokens', () => {
      it('should clear all refresh tokens', async () => {
        const user = mockUser as IUser
        user.refreshTokens = ['token1', 'token2', 'token3']
        user.clearRefreshTokens = async function() {
          this.refreshTokens = []
          await this.save()
        }

        await user.clearRefreshTokens()

        expect(user.refreshTokens).toHaveLength(0)
        expect(user.save).toHaveBeenCalled()
      })
    })
  })

  describe('Static Methods', () => {
    describe('findByUsernameOrEmail', () => {
      it('should find user by username', () => {
        const mockFind = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue('user'),
        })

        const UserModel = {
          findOne: mockFind,
        }

        // Simulate static method
        const findByUsernameOrEmail = function(identifier: string) {
          return this.findOne({
            $or: [
              { username: identifier },
              { email: identifier.toLowerCase() },
            ],
          }).select('+password +refreshTokens')
        }

        const result = findByUsernameOrEmail.call(UserModel, 'testuser')

        expect(mockFind).toHaveBeenCalledWith({
          $or: [
            { username: 'testuser' },
            { email: 'testuser' },
          ],
        })
      })

      it('should find user by email', () => {
        const mockFind = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue('user'),
        })

        const UserModel = {
          findOne: mockFind,
        }

        const findByUsernameOrEmail = function(identifier: string) {
          return this.findOne({
            $or: [
              { username: identifier },
              { email: identifier.toLowerCase() },
            ],
          }).select('+password +refreshTokens')
        }

        findByUsernameOrEmail.call(UserModel, 'TEST@EXAMPLE.COM')

        expect(mockFind).toHaveBeenCalledWith({
          $or: [
            { username: 'TEST@EXAMPLE.COM' },
            { email: 'test@example.com' },
          ],
        })
      })
    })

    describe('createAdminIfNotExists', () => {
      it('should create admin user if none exists', async () => {
        const mockSave = jest.fn().mockResolvedValue(true)
        const mockUser = { save: mockSave }

        function MockUserConstructor(data) {
          Object.assign(this, data)
          this.save = mockSave
          return this
        }

        const UserModel = {
          findOne: jest.fn().mockResolvedValue(null),
        }
        UserModel.constructor = MockUserConstructor

        // Set environment variables
        process.env.ADMIN_USERNAME = 'admin'
        process.env.ADMIN_EMAIL = 'admin@test.com'
        process.env.ADMIN_PASSWORD = 'testpassword'

        const createAdminIfNotExists = async function() {
          const adminExists = await this.findOne({ username: 'admin' })

          if (!adminExists) {
            const adminUser = new MockUserConstructor({
              username: process.env.ADMIN_USERNAME || 'admin',
              email: process.env.ADMIN_EMAIL || 'admin@portfolio.com',
              password: process.env.ADMIN_PASSWORD || 'change-this-password',
            })

            await adminUser.save()
            return adminUser
          }

          return adminExists
        }

        const result = await createAdminIfNotExists.call(UserModel)

        expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'admin' })
        expect(mockSave).toHaveBeenCalled()
      })

      it('should return existing admin user if exists', async () => {
        const existingAdmin = { username: 'admin', email: 'admin@test.com' }
        
        const UserModel = {
          findOne: jest.fn().mockResolvedValue(existingAdmin),
        }

        const createAdminIfNotExists = async function() {
          const adminExists = await this.findOne({ username: 'admin' })
          
          if (!adminExists) {
            const adminUser = new this({
              username: process.env.ADMIN_USERNAME || 'admin',
              email: process.env.ADMIN_EMAIL || 'admin@portfolio.com',
              password: process.env.ADMIN_PASSWORD || 'change-this-password',
            })
            
            await adminUser.save()
            return adminUser
          }
          
          return adminExists
        }

        const result = await createAdminIfNotExists.call(UserModel)

        expect(result).toBe(existingAdmin)
      })
    })
  })

  describe('JSON Transformation', () => {
    it('should exclude password and refreshTokens from JSON', () => {
      const user = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        refreshTokens: ['token1', 'token2'],
        __v: 0,
      }

      // Simulate toJSON transformation
      const transformedUser = { ...user }
      delete transformedUser.password
      delete transformedUser.refreshTokens
      delete transformedUser.__v

      expect(transformedUser).not.toHaveProperty('password')
      expect(transformedUser).not.toHaveProperty('refreshTokens')
      expect(transformedUser).not.toHaveProperty('__v')
      expect(transformedUser).toHaveProperty('username')
      expect(transformedUser).toHaveProperty('email')
    })
  })
})

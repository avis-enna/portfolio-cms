import { connectToDatabase } from './connection'
import { User, PortfolioContent } from './models'

/**
 * Initialize the database with default data
 * This function should be called when the application starts
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Connect to database
    await connectToDatabase()
    
    // Create admin user if it doesn't exist
    await User.createAdminIfNotExists()
    
    // Create default portfolio content if it doesn't exist
    await PortfolioContent.getOrCreateDefault()
    
    console.log('✅ Database initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
    throw error
  }
}

/**
 * Seed the database with sample data for development
 */
export async function seedDatabase(): Promise<void> {
  try {
    await connectToDatabase()
    
    // Create admin user
    const admin = await User.createAdminIfNotExists()
    
    // Create sample portfolio content
    const portfolioContent = await PortfolioContent.getOrCreateDefault()
    
    // Update with more comprehensive sample data
    portfolioContent.summary = 'Experienced Software Engineer with 5+ years of expertise in building scalable web applications and cloud-native solutions. Passionate about clean code, test-driven development, and modern technologies.'
    
    portfolioContent.technicalSkills = [
      {
        category: 'Programming Languages',
        skills: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go'],
      },
      {
        category: 'Frontend Technologies',
        skills: ['React', 'Next.js', 'Vue.js', 'Angular', 'HTML5', 'CSS3', 'Tailwind CSS'],
      },
      {
        category: 'Backend Technologies',
        skills: ['Node.js', 'Express.js', 'FastAPI', 'Spring Boot', 'GraphQL', 'REST APIs'],
      },
      {
        category: 'Databases',
        skills: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch'],
      },
      {
        category: 'Cloud & DevOps',
        skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Jenkins'],
      },
      {
        category: 'Testing',
        skills: ['Jest', 'Cypress', 'Pytest', 'JUnit', 'TDD', 'Integration Testing'],
      },
    ]
    
    portfolioContent.softSkills = [
      'Leadership',
      'Problem Solving',
      'Communication',
      'Team Collaboration',
      'Project Management',
      'Mentoring',
      'Agile Methodologies',
    ]
    
    portfolioContent.experience = [
      {
        title: 'Senior Software Engineer',
        company: 'Cisco Systems',
        startDate: new Date('2022-01-01'),
        responsibilities: [
          'Led development of microservices architecture serving 1M+ users',
          'Implemented CI/CD pipelines reducing deployment time by 60%',
          'Mentored junior developers and conducted code reviews',
          'Collaborated with cross-functional teams to deliver features on time',
        ],
        technologies: ['React', 'Node.js', 'AWS', 'Docker', 'MongoDB'],
        achievements: [
          'Reduced system latency by 40% through performance optimizations',
          'Increased test coverage from 60% to 95%',
          'Led migration to cloud-native architecture',
        ],
      },
      {
        title: 'Software Engineer',
        company: 'Cognizant Technology Solutions',
        startDate: new Date('2020-06-01'),
        endDate: new Date('2021-12-31'),
        responsibilities: [
          'Developed full-stack web applications using modern frameworks',
          'Integrated third-party APIs and payment gateways',
          'Optimized database queries and improved application performance',
          'Participated in agile development processes',
        ],
        technologies: ['JavaScript', 'React', 'Express.js', 'PostgreSQL'],
        achievements: [
          'Delivered 15+ features ahead of schedule',
          'Reduced bug reports by 30% through improved testing',
        ],
      },
    ]
    
    portfolioContent.education = [
      {
        degree: 'Master of Science in Computer Science',
        institution: 'University of Technology',
        year: 2020,
        gpa: 3.8,
        honors: ['Magna Cum Laude', 'Dean\'s List'],
        relevantCourses: [
          'Advanced Algorithms',
          'Distributed Systems',
          'Machine Learning',
          'Software Engineering',
        ],
      },
      {
        degree: 'Bachelor of Technology in Computer Science',
        institution: 'Engineering College',
        year: 2018,
        gpa: 3.6,
        honors: ['Cum Laude'],
        relevantCourses: [
          'Data Structures',
          'Database Systems',
          'Web Development',
          'Computer Networks',
        ],
      },
    ]
    
    portfolioContent.projects = [
      {
        title: 'AI-Powered Analytics Platform',
        description: 'Built a comprehensive analytics platform using machine learning to provide insights from large datasets. Features real-time data processing, interactive dashboards, and predictive analytics.',
        technologies: ['Python', 'TensorFlow', 'React', 'AWS', 'PostgreSQL'],
        link: 'https://analytics-platform.example.com',
        githubUrl: 'https://github.com/example/analytics-platform',
        featured: true,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-06-01'),
        status: 'completed',
      },
      {
        title: 'E-commerce Microservices',
        description: 'Designed and implemented a scalable e-commerce platform using microservices architecture. Includes user management, product catalog, order processing, and payment integration.',
        technologies: ['Node.js', 'Docker', 'Kubernetes', 'MongoDB', 'Redis'],
        githubUrl: 'https://github.com/example/ecommerce-microservices',
        featured: true,
        startDate: new Date('2022-08-01'),
        endDate: new Date('2022-12-01'),
        status: 'completed',
      },
      {
        title: 'Real-time Chat Application',
        description: 'Developed a real-time chat application with features like group chats, file sharing, and message encryption. Supports thousands of concurrent users.',
        technologies: ['React', 'Socket.io', 'Express.js', 'MongoDB'],
        link: 'https://chat-app.example.com',
        githubUrl: 'https://github.com/example/chat-app',
        featured: false,
        startDate: new Date('2022-03-01'),
        endDate: new Date('2022-05-01'),
        status: 'completed',
      },
    ]
    
    portfolioContent.certifications = [
      {
        name: 'AWS Solutions Architect Associate',
        issuer: 'Amazon Web Services',
        date: new Date('2023-01-15'),
        expiryDate: new Date('2026-01-15'),
        credentialId: 'AWS-SAA-123456',
        credentialUrl: 'https://aws.amazon.com/verification',
      },
      {
        name: 'Certified Kubernetes Administrator',
        issuer: 'Cloud Native Computing Foundation',
        date: new Date('2022-09-10'),
        expiryDate: new Date('2025-09-10'),
        credentialId: 'CKA-789012',
        credentialUrl: 'https://cncf.io/verification',
      },
      {
        name: 'MongoDB Certified Developer',
        issuer: 'MongoDB Inc.',
        date: new Date('2022-05-20'),
        credentialId: 'MDB-DEV-345678',
      },
    ]
    
    portfolioContent.contactInfo = {
      email: 'contact@portfolio.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/example',
      github: 'https://github.com/example',
      website: 'https://portfolio.example.com',
    }
    
    portfolioContent.seoMetadata = {
      title: 'Venna Venkata Siva Reddy - Software Engineer Portfolio',
      description: 'Experienced Software Engineer specializing in scalable web applications, cloud-native solutions, and modern technologies. View my projects and experience.',
      keywords: [
        'software engineer',
        'full stack developer',
        'react',
        'node.js',
        'aws',
        'mongodb',
        'typescript',
        'microservices',
        'cloud computing',
      ],
    }
    
    await portfolioContent.save()
    
    console.log('✅ Database seeded successfully')
  } catch (error) {
    console.error('❌ Failed to seed database:', error)
    throw error
  }
}

/**
 * Clean the database (useful for testing)
 */
export async function cleanDatabase(): Promise<void> {
  try {
    await connectToDatabase()
    
    // Clear all collections
    await User.deleteMany({})
    await PortfolioContent.deleteMany({})
    
    console.log('✅ Database cleaned successfully')
  } catch (error) {
    console.error('❌ Failed to clean database:', error)
    throw error
  }
}

/**
 * Check if database is properly initialized
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    await connectToDatabase()
    
    const adminExists = await User.findOne({ username: 'admin' })
    const portfolioExists = await PortfolioContent.findOne()
    
    return !!(adminExists && portfolioExists)
  } catch (error) {
    console.error('❌ Failed to check database initialization:', error)
    return false
  }
}

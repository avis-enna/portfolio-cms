/**
 * Test Data Factory
 * Generates test data for various test scenarios
 */

import { faker } from '@faker-js/faker'

export class TestDataFactory {
  /**
   * Create valid personal information for setup wizard
   */
  createValidPersonalInfo() {
    return {
      name: faker.person.fullName(),
      title: faker.person.jobTitle(),
      tagline: faker.company.catchPhrase(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      bio: faker.lorem.paragraph(3)
    }
  }

  /**
   * Create invalid personal information for validation testing
   */
  createInvalidPersonalInfo() {
    return {
      name: '', // Required field empty
      title: '', // Required field empty
      tagline: faker.company.catchPhrase(),
      email: 'invalid-email', // Invalid email format
      phone: faker.phone.number(),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      bio: faker.lorem.paragraph(3)
    }
  }

  /**
   * Create social media links
   */
  createSocialLinks() {
    const username = faker.internet.userName()
    return {
      github: `https://github.com/${username}`,
      linkedin: `https://linkedin.com/in/${username}`,
      twitter: `https://twitter.com/${username}`,
      instagram: `https://instagram.com/${username}`,
      youtube: `https://youtube.com/@${username}`,
      dribbble: `https://dribbble.com/${username}`,
      behance: `https://behance.net/${username}`,
      medium: `https://medium.com/@${username}`
    }
  }

  /**
   * Create feature configuration
   */
  createFeatureConfig() {
    return {
      ai: faker.datatype.boolean(),
      analytics: faker.datatype.boolean(),
      pwa: faker.datatype.boolean(),
      blog: faker.datatype.boolean(),
      contact: faker.datatype.boolean()
    }
  }

  /**
   * Create theme configuration
   */
  createThemeConfig() {
    const themes = ['default', 'minimal', 'dark', 'colorful']
    const colors = ['#2563eb', '#059669', '#7c3aed', '#dc2626', '#ea580c']
    const modes = ['system', 'light', 'dark']

    return {
      theme: faker.helpers.arrayElement(themes),
      primaryColor: faker.helpers.arrayElement(colors),
      mode: faker.helpers.arrayElement(modes)
    }
  }

  /**
   * Create admin credentials
   */
  createAdminCredentials() {
    return {
      email: 'admin@test.com',
      password: 'testpassword123'
    }
  }

  /**
   * Create user credentials
   */
  createUserCredentials() {
    return {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 })
    }
  }

  /**
   * Create OpenAI API configuration
   */
  createOpenAIConfig() {
    return {
      validKey: 'sk-test-valid-key-' + faker.string.alphanumeric(32),
      invalidKey: 'invalid-key-' + faker.string.alphanumeric(10),
      model: faker.helpers.arrayElement(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview']),
      maxTokens: faker.number.int({ min: 100, max: 2000 }),
      temperature: faker.number.float({ min: 0, max: 1, precision: 0.1 })
    }
  }

  /**
   * Create email configuration
   */
  createEmailConfig() {
    return {
      host: 'smtp.gmail.com',
      port: 587,
      user: faker.internet.email(),
      password: faker.internet.password()
    }
  }

  /**
   * Create Google Analytics configuration
   */
  createAnalyticsConfig() {
    return {
      googleAnalyticsId: `G-${faker.string.alphanumeric(10).toUpperCase()}`,
      enabled: faker.datatype.boolean()
    }
  }

  /**
   * Create blog post data
   */
  createBlogPost() {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(5),
      excerpt: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(['draft', 'published', 'archived']),
      tags: faker.lorem.words(3).split(' '),
      category: faker.helpers.arrayElement(['Technology', 'Design', 'Development', 'Tutorial']),
      publishDate: faker.date.future(),
      featuredImage: faker.image.url(),
      seoTitle: faker.lorem.sentence(),
      seoDescription: faker.lorem.paragraph()
    }
  }

  /**
   * Create project data
   */
  createProject() {
    return {
      title: faker.company.name() + ' ' + faker.helpers.arrayElement(['App', 'Website', 'Platform', 'Tool']),
      slug: faker.lorem.slug(),
      shortDescription: faker.lorem.sentence(),
      longDescription: faker.lorem.paragraphs(3),
      category: faker.helpers.arrayElement(['Web Application', 'Mobile App', 'API', 'Tool']),
      type: faker.helpers.arrayElement(['Full Stack', 'Frontend', 'Backend', 'Mobile']),
      status: faker.helpers.arrayElement(['Completed', 'In Progress', 'Planning']),
      featured: faker.datatype.boolean(),
      startDate: faker.date.past(),
      endDate: faker.date.recent(),
      technologies: faker.helpers.arrayElements([
        'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'TypeScript', 
        'JavaScript', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker'
      ], { min: 3, max: 8 }),
      liveUrl: faker.internet.url(),
      githubUrl: `https://github.com/${faker.internet.userName()}/${faker.lorem.slug()}`,
      images: Array.from({ length: 3 }, () => faker.image.url())
    }
  }

  /**
   * Create contact message
   */
  createContactMessage() {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      subject: faker.lorem.sentence(),
      message: faker.lorem.paragraphs(2),
      phone: faker.phone.number(),
      company: faker.company.name(),
      projectType: faker.helpers.arrayElement(['Web Development', 'Mobile App', 'Consultation', 'Other'])
    }
  }

  /**
   * Create experience entry
   */
  createExperience() {
    const startDate = faker.date.past({ years: 5 })
    const endDate = faker.datatype.boolean() ? faker.date.between({ from: startDate, to: new Date() }) : null

    return {
      company: faker.company.name(),
      position: faker.person.jobTitle(),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      type: faker.helpers.arrayElement(['Full-time', 'Part-time', 'Contract', 'Freelance']),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate ? endDate.toISOString().split('T')[0] : null,
      current: !endDate,
      description: faker.lorem.paragraph(),
      achievements: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => faker.lorem.sentence()),
      technologies: faker.helpers.arrayElements([
        'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'TypeScript', 
        'JavaScript', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker'
      ], { min: 3, max: 6 })
    }
  }

  /**
   * Create education entry
   */
  createEducation() {
    const startDate = faker.date.past({ years: 10 })
    const endDate = faker.date.between({ from: startDate, to: new Date() })

    return {
      institution: faker.company.name() + ' University',
      degree: faker.helpers.arrayElement([
        'Bachelor of Science in Computer Science',
        'Master of Science in Software Engineering',
        'Bachelor of Arts in Design',
        'Master of Business Administration'
      ]),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      gpa: faker.number.float({ min: 3.0, max: 4.0, precision: 0.1 }).toString() + '/4.0',
      honors: faker.helpers.arrayElements(['Magna Cum Laude', 'Dean\'s List', 'Honor Society'], { min: 0, max: 2 }),
      relevantCourses: faker.helpers.arrayElements([
        'Data Structures and Algorithms',
        'Software Engineering',
        'Database Systems',
        'Web Development',
        'Machine Learning',
        'Computer Networks'
      ], { min: 4, max: 6 })
    }
  }

  /**
   * Create certification
   */
  createCertification() {
    const issueDate = faker.date.past({ years: 2 })
    const expiryDate = faker.date.future({ years: 2, refDate: issueDate })

    return {
      name: faker.helpers.arrayElement([
        'AWS Certified Solutions Architect',
        'Google Cloud Professional Developer',
        'Microsoft Azure Developer Associate',
        'Certified Kubernetes Administrator'
      ]),
      issuer: faker.helpers.arrayElement([
        'Amazon Web Services',
        'Google Cloud',
        'Microsoft',
        'Cloud Native Computing Foundation'
      ]),
      date: issueDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      credentialId: faker.string.alphanumeric(12).toUpperCase(),
      verificationUrl: faker.internet.url()
    }
  }

  /**
   * Create testimonial
   */
  createTestimonial() {
    return {
      name: faker.person.fullName(),
      position: faker.person.jobTitle(),
      company: faker.company.name(),
      avatar: faker.image.avatar(),
      content: faker.lorem.paragraph(3),
      rating: faker.number.int({ min: 4, max: 5 }),
      date: faker.date.past().toISOString().split('T')[0]
    }
  }

  /**
   * Create complete portfolio configuration
   */
  createCompletePortfolioConfig() {
    return {
      personal: this.createValidPersonalInfo(),
      social: this.createSocialLinks(),
      features: this.createFeatureConfig(),
      theme: this.createThemeConfig(),
      projects: Array.from({ length: 5 }, () => this.createProject()),
      experience: Array.from({ length: 3 }, () => this.createExperience()),
      education: Array.from({ length: 2 }, () => this.createEducation()),
      certifications: Array.from({ length: 3 }, () => this.createCertification()),
      testimonials: Array.from({ length: 4 }, () => this.createTestimonial())
    }
  }

  /**
   * Create test user with specific role
   */
  createTestUser(role: 'admin' | 'user' = 'user') {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      role: role,
      isActive: true,
      createdAt: faker.date.past(),
      lastLogin: faker.date.recent()
    }
  }

  /**
   * Create performance test data
   */
  createPerformanceTestData() {
    return {
      projects: Array.from({ length: 50 }, () => this.createProject()),
      blogPosts: Array.from({ length: 100 }, () => this.createBlogPost()),
      contacts: Array.from({ length: 200 }, () => this.createContactMessage())
    }
  }
}

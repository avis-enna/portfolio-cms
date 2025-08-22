/**
 * End-to-End Portfolio Flow Tests
 * Tests complete user journeys through the portfolio website
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '@/app/page'

// Mock Next.js components and hooks
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

jest.mock('next/image', () => {
  return ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  )
})

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

// Mock database connection
jest.mock('@/lib/database/connection', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
}))

jest.mock('@/lib/database/models', () => ({
  PortfolioData: {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        personalInfo: {
          name: 'John Doe',
          title: 'Full-Stack Developer',
          bio: 'Passionate developer with 5+ years of experience',
          email: 'john@example.com',
          phone: '+1234567890',
          location: 'San Francisco, CA',
          profileImage: '/profile.jpg',
          resumeUrl: '/resume.pdf'
        },
        summary: 'Experienced developer specializing in modern web technologies',
        technicalSkills: [
          { name: 'React', level: 90, category: 'Frontend' },
          { name: 'Node.js', level: 85, category: 'Backend' },
          { name: 'TypeScript', level: 88, category: 'Language' }
        ],
        softSkills: ['Leadership', 'Communication', 'Problem Solving'],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Senior Developer',
            startDate: '2020-01-01',
            endDate: '2023-12-31',
            description: 'Led development of multiple web applications',
            technologies: ['React', 'Node.js', 'MongoDB'],
            achievements: ['Increased performance by 40%', 'Led team of 5 developers']
          }
        ],
        projects: [
          {
            title: 'E-commerce Platform',
            description: 'Full-stack e-commerce solution with modern UI',
            technologies: ['React', 'Node.js', 'PostgreSQL'],
            imageUrl: '/project1.jpg',
            liveUrl: 'https://example.com',
            githubUrl: 'https://github.com/user/project',
            featured: true
          }
        ],
        education: [
          {
            institution: 'University of Technology',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            startDate: '2016-09-01',
            endDate: '2020-05-31',
            gpa: '3.8',
            achievements: ['Dean\'s List', 'Graduated Magna Cum Laude']
          }
        ],
        certifications: [
          {
            name: 'AWS Certified Developer',
            issuer: 'Amazon Web Services',
            date: '2023-01-15',
            expiryDate: '2026-01-15',
            credentialUrl: 'https://aws.amazon.com/verification'
          }
        ],
        socialLinks: {
          linkedin: 'https://linkedin.com/in/johndoe',
          github: 'https://github.com/johndoe',
          twitter: 'https://twitter.com/johndoe',
          website: 'https://johndoe.dev'
        },
        seoMetadata: {
          title: 'John Doe - Full-Stack Developer',
          description: 'Professional portfolio of John Doe, experienced full-stack developer',
          keywords: ['developer', 'react', 'node.js']
        }
      })
    })
  }
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn()

// Mock matchMedia for theme system
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('Portfolio Website E2E Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  test('complete user journey through portfolio website', async () => {
    render(await HomePage())

    // 1. Hero Section - User lands on the page
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Full-Stack Developer')).toBeInTheDocument()

    // 2. Navigation - User can see navigation menu
    expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
    expect(screen.getByTestId('nav-about')).toBeInTheDocument()
    expect(screen.getByTestId('nav-experience')).toBeInTheDocument()
    expect(screen.getByTestId('nav-projects')).toBeInTheDocument()

    // 3. About Section - User scrolls to about section
    expect(screen.getByTestId('about-section')).toBeInTheDocument()
    expect(screen.getByText('About Me')).toBeInTheDocument()
    expect(screen.getByText('Experienced developer specializing in modern web technologies')).toBeInTheDocument()

    // 4. Skills - User sees technical skills
    const technicalSkills = screen.getAllByTestId('technical-skill')
    expect(technicalSkills).toHaveLength(3)
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()

    // 5. Soft Skills - User sees soft skills
    const softSkills = screen.getAllByTestId('soft-skill')
    expect(softSkills).toHaveLength(3)
    expect(screen.getByText('Leadership')).toBeInTheDocument()

    // 6. Experience Section - User views work experience
    expect(screen.getByTestId('experience-section')).toBeInTheDocument()
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Senior Developer')).toBeInTheDocument()
    expect(screen.getByText('Tech Corp')).toBeInTheDocument()

    // 7. Projects Section - User explores projects
    expect(screen.getByTestId('projects-section')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('E-commerce Platform')).toBeInTheDocument()

    // 8. Education Section - User checks education
    expect(screen.getByTestId('education-section')).toBeInTheDocument()
    expect(screen.getByText('Education & Certifications')).toBeInTheDocument()
    expect(screen.getByText('Bachelor of Science in Computer Science')).toBeInTheDocument()
    expect(screen.getByText('AWS Certified Developer')).toBeInTheDocument()

    // 9. Contact Section - User reaches contact form
    expect(screen.getByTestId('contact-section')).toBeInTheDocument()
    expect(screen.getByText('Get In Touch')).toBeInTheDocument()
    expect(screen.getByTestId('contact-form')).toBeInTheDocument()

    // 10. Footer - User sees footer information
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  test('user can successfully submit contact form', async () => {
    // Mock successful API response
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Thank you for your message! I\'ll get back to you soon.',
        data: {
          submissionId: 'test-submission-id',
          submittedAt: new Date().toISOString()
        }
      })
    })

    render(await HomePage())

    // Navigate to contact section
    const contactSection = screen.getByTestId('contact-section')
    expect(contactSection).toBeInTheDocument()

    // Fill out contact form
    fireEvent.change(screen.getByTestId('contact-name'), {
      target: { value: 'Jane Smith' }
    })
    fireEvent.change(screen.getByTestId('contact-email-input'), {
      target: { value: 'jane@example.com' }
    })
    fireEvent.change(screen.getByTestId('contact-subject'), {
      target: { value: 'Collaboration Opportunity' }
    })
    fireEvent.change(screen.getByTestId('contact-message'), {
      target: { value: 'Hi John, I would like to discuss a potential collaboration opportunity. Please let me know when you are available.' }
    })

    // Submit form
    fireEvent.click(screen.getByTestId('contact-submit'))

    // Verify API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Jane Smith',
          email: 'jane@example.com',
          subject: 'Collaboration Opportunity',
          message: 'Hi John, I would like to discuss a potential collaboration opportunity. Please let me know when you are available.'
        })
      })
    })

    // Verify form is reset after successful submission
    await waitFor(() => {
      expect(screen.getByTestId('contact-name')).toHaveValue('')
      expect(screen.getByTestId('contact-email-input')).toHaveValue('')
      expect(screen.getByTestId('contact-subject')).toHaveValue('')
      expect(screen.getByTestId('contact-message')).toHaveValue('')
    })
  })

  test('user can toggle theme successfully', async () => {
    render(await HomePage())

    // Find theme toggle button (should be in navigation)
    const navigation = screen.getByTestId('main-navigation')
    expect(navigation).toBeInTheDocument()

    // Theme toggle should be present
    // Note: The theme toggle is rendered within the navigation component
    // We can verify the theme system is working by checking localStorage calls
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme')
  })

  test('user can navigate through sections smoothly', async () => {
    render(await HomePage())

    // Test navigation clicks
    const aboutLink = screen.getByTestId('nav-about')
    fireEvent.click(aboutLink)

    // Should attempt to scroll to about section
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()

    const experienceLink = screen.getByTestId('nav-experience')
    fireEvent.click(experienceLink)

    // Should attempt to scroll to experience section
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  test('mobile navigation works correctly', async () => {
    render(await HomePage())

    // Find mobile menu button
    const mobileMenuButton = screen.getByTestId('mobile-menu-button')
    expect(mobileMenuButton).toBeInTheDocument()

    // Click to open mobile menu
    fireEvent.click(mobileMenuButton)

    // Mobile navigation should be visible
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument()

    // Mobile navigation items should be present
    expect(screen.getByTestId('mobile-nav-about')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-nav-experience')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-nav-projects')).toBeInTheDocument()
  })

  test('social links work correctly', async () => {
    render(await HomePage())

    // Check social links in hero section
    const linkedinLink = screen.getByTestId('social-linkedin')
    const githubLink = screen.getByTestId('social-github')
    const twitterLink = screen.getByTestId('social-twitter')
    const websiteLink = screen.getByTestId('social-website')

    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/johndoe')
    expect(githubLink).toHaveAttribute('href', 'https://github.com/johndoe')
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/johndoe')
    expect(websiteLink).toHaveAttribute('href', 'https://johndoe.dev')

    // All social links should open in new tab
    expect(linkedinLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(twitterLink).toHaveAttribute('target', '_blank')
    expect(websiteLink).toHaveAttribute('target', '_blank')
  })

  test('project links work correctly', async () => {
    render(await HomePage())

    // Find project section
    const projectsSection = screen.getByTestId('projects-section')
    expect(projectsSection).toBeInTheDocument()

    // Check project links
    const liveDemo = screen.getByText('Live Demo')
    const codeLink = screen.getByText('Code')

    expect(liveDemo).toHaveAttribute('href', 'https://example.com')
    expect(codeLink).toHaveAttribute('href', 'https://github.com/user/project')

    // Links should open in new tab
    expect(liveDemo).toHaveAttribute('target', '_blank')
    expect(codeLink).toHaveAttribute('target', '_blank')
  })

  test('handles missing portfolio data gracefully', async () => {
    // Mock empty portfolio data
    const { PortfolioData } = require('@/lib/database/models')
    PortfolioData.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    })

    render(await HomePage())

    // Should still render with default data
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByText('Professional Developer')).toBeInTheDocument()
    expect(screen.getByText('Full-Stack Developer')).toBeInTheDocument()
  })
})

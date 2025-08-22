/**
 * Portfolio Components Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Navigation } from '../Navigation'
import { HeroSection } from '../HeroSection'
import { AboutSection, ExperienceSection, ProjectsSection, EducationSection } from '../PortfolioSections'
import { ContactSection } from '../ContactSection'
import { Footer } from '../Footer'
import { ThemeProvider } from '../../contexts/ThemeContext'

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

jest.mock('next/image', () => {
  return ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  )
})

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

// Mock toast context
jest.mock('../../components/Toast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}))

const mockPortfolioData = {
  personalInfo: {
    name: 'John Doe',
    title: 'Full-Stack Developer',
    bio: 'Passionate developer with 5+ years of experience',
    profileImage: '/profile.jpg',
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    resumeUrl: '/resume.pdf'
  },
  summary: 'Experienced developer specializing in modern web technologies',
  technicalSkills: [
    { name: 'React', level: 90, category: 'Frontend' },
    { name: 'Node.js', level: 85, category: 'Backend' },
    { name: 'TypeScript', level: 88, category: 'Language' }
  ],
  softSkills: [
    { name: 'Leadership' },
    { name: 'Communication' },
    { name: 'Problem Solving' }
  ],
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
  },
  contactInfo: {
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'San Francisco, CA'
  }
}

// Wrapper component for theme context
const ThemeWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('Navigation Component', () => {
  test('renders navigation with portfolio data', () => {
    render(
      <ThemeWrapper>
        <Navigation portfolioData={mockPortfolioData} />
      </ThemeWrapper>
    )

    expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
    expect(screen.getByTestId('nav-logo')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  test('shows/hides navigation items based on data availability', () => {
    render(
      <ThemeWrapper>
        <Navigation portfolioData={mockPortfolioData} />
      </ThemeWrapper>
    )

    expect(screen.getByTestId('nav-about')).toBeInTheDocument()
    expect(screen.getByTestId('nav-experience')).toBeInTheDocument()
    expect(screen.getByTestId('nav-projects')).toBeInTheDocument()
    expect(screen.getByTestId('nav-education')).toBeInTheDocument()
  })

  test('toggles mobile menu', () => {
    render(
      <ThemeWrapper>
        <Navigation portfolioData={mockPortfolioData} />
      </ThemeWrapper>
    )

    const mobileMenuButton = screen.getByTestId('mobile-menu-button')
    fireEvent.click(mobileMenuButton)

    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument()
  })
})

describe('HeroSection Component', () => {
  test('renders hero section with portfolio data', () => {
    render(<HeroSection portfolioData={mockPortfolioData} />)

    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Full-Stack Developer')).toBeInTheDocument()
    expect(screen.getByText(/Passionate developer with 5\+ years/)).toBeInTheDocument()
  })

  test('renders social links when available', () => {
    render(<HeroSection portfolioData={mockPortfolioData} />)

    expect(screen.getByTestId('social-linkedin')).toBeInTheDocument()
    expect(screen.getByTestId('social-github')).toBeInTheDocument()
    expect(screen.getByTestId('social-twitter')).toBeInTheDocument()
    expect(screen.getByTestId('social-website')).toBeInTheDocument()
  })

  test('renders profile image when available', () => {
    render(<HeroSection portfolioData={mockPortfolioData} />)

    expect(screen.getByTestId('profile-image')).toBeInTheDocument()
    expect(screen.getByTestId('profile-image')).toHaveAttribute('src', '/profile.jpg')
  })

  test('handles action button clicks', () => {
    // Mock scrollIntoView
    const mockScrollIntoView = jest.fn()
    Element.prototype.scrollIntoView = mockScrollIntoView

    render(<HeroSection portfolioData={mockPortfolioData} />)

    const viewWorkButton = screen.getByTestId('view-work-button')
    fireEvent.click(viewWorkButton)

    // Should attempt to scroll to projects section
    expect(mockScrollIntoView).toHaveBeenCalled()
  })
})

describe('AboutSection Component', () => {
  test('renders about section with summary and skills', () => {
    render(
      <AboutSection
        summary={mockPortfolioData.summary}
        technicalSkills={mockPortfolioData.technicalSkills}
        softSkills={mockPortfolioData.softSkills}
      />
    )

    expect(screen.getByTestId('about-section')).toBeInTheDocument()
    expect(screen.getByText('About Me')).toBeInTheDocument()
    expect(screen.getByText(mockPortfolioData.summary)).toBeInTheDocument()
  })

  test('renders technical skills with levels', () => {
    render(
      <AboutSection
        summary={mockPortfolioData.summary}
        technicalSkills={mockPortfolioData.technicalSkills}
        softSkills={mockPortfolioData.softSkills}
      />
    )

    const technicalSkills = screen.getAllByTestId('technical-skill')
    expect(technicalSkills).toHaveLength(3)
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
  })

  test('renders soft skills', () => {
    render(
      <AboutSection
        summary={mockPortfolioData.summary}
        technicalSkills={mockPortfolioData.technicalSkills}
        softSkills={mockPortfolioData.softSkills}
      />
    )

    const softSkills = screen.getAllByTestId('soft-skill')
    expect(softSkills).toHaveLength(3)
    expect(screen.getByText('Leadership')).toBeInTheDocument()
  })

  test('does not render when no data provided', () => {
    render(<AboutSection />)

    expect(screen.queryByTestId('about-section')).not.toBeInTheDocument()
  })
})

describe('ExperienceSection Component', () => {
  test('renders experience section with data', () => {
    render(<ExperienceSection experience={mockPortfolioData.experience} />)

    expect(screen.getByTestId('experience-section')).toBeInTheDocument()
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Senior Developer')).toBeInTheDocument()
    expect(screen.getByText('Tech Corp')).toBeInTheDocument()
  })

  test('renders experience technologies', () => {
    render(<ExperienceSection experience={mockPortfolioData.experience} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByText('MongoDB')).toBeInTheDocument()
  })

  test('does not render when no experience data', () => {
    render(<ExperienceSection experience={[]} />)

    expect(screen.queryByTestId('experience-section')).not.toBeInTheDocument()
  })
})

describe('ProjectsSection Component', () => {
  test('renders projects section with data', () => {
    render(<ProjectsSection projects={mockPortfolioData.projects} />)

    expect(screen.getByTestId('projects-section')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('E-commerce Platform')).toBeInTheDocument()
  })

  test('renders project links', () => {
    render(<ProjectsSection projects={mockPortfolioData.projects} />)

    const liveLink = screen.getByText('Live Demo')
    const codeLink = screen.getByText('Code')

    expect(liveLink).toHaveAttribute('href', 'https://example.com')
    expect(codeLink).toHaveAttribute('href', 'https://github.com/user/project')
  })

  test('does not render when no projects', () => {
    render(<ProjectsSection projects={[]} />)

    expect(screen.queryByTestId('projects-section')).not.toBeInTheDocument()
  })
})

describe('EducationSection Component', () => {
  test('renders education section with data', () => {
    render(
      <EducationSection
        education={mockPortfolioData.education}
        certifications={mockPortfolioData.certifications}
      />
    )

    expect(screen.getByTestId('education-section')).toBeInTheDocument()
    expect(screen.getByText('Education & Certifications')).toBeInTheDocument()
    expect(screen.getByText('Bachelor of Science in Computer Science')).toBeInTheDocument()
    expect(screen.getByText('AWS Certified Developer')).toBeInTheDocument()
  })

  test('does not render when no education or certification data', () => {
    render(<EducationSection education={[]} certifications={[]} />)

    expect(screen.queryByTestId('education-section')).not.toBeInTheDocument()
  })
})

describe('ContactSection Component', () => {
  test('renders contact section', () => {
    render(<ContactSection contactInfo={mockPortfolioData.contactInfo} />)

    expect(screen.getByTestId('contact-section')).toBeInTheDocument()
    expect(screen.getByText('Get In Touch')).toBeInTheDocument()
    expect(screen.getByTestId('contact-form')).toBeInTheDocument()
  })

  test('displays contact information', () => {
    render(<ContactSection contactInfo={mockPortfolioData.contactInfo} />)

    expect(screen.getByTestId('contact-email')).toBeInTheDocument()
    expect(screen.getByTestId('contact-phone')).toBeInTheDocument()
    expect(screen.getByTestId('contact-location')).toBeInTheDocument()
  })

  test('validates form inputs', async () => {
    render(<ContactSection contactInfo={mockPortfolioData.contactInfo} />)

    const submitButton = screen.getByTestId('contact-submit')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toBeInTheDocument()
      expect(screen.getByTestId('email-error')).toBeInTheDocument()
      expect(screen.getByTestId('subject-error')).toBeInTheDocument()
      expect(screen.getByTestId('message-error')).toBeInTheDocument()
    })
  })
})

describe('Footer Component', () => {
  test('renders footer with portfolio data', () => {
    render(<Footer portfolioData={mockPortfolioData} />)

    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  test('renders social links in footer', () => {
    render(<Footer portfolioData={mockPortfolioData} />)

    expect(screen.getByTestId('footer-social-linkedin')).toBeInTheDocument()
    expect(screen.getByTestId('footer-social-github')).toBeInTheDocument()
  })

  test('renders quick links', () => {
    render(<Footer portfolioData={mockPortfolioData} />)

    expect(screen.getByTestId('footer-link-home')).toBeInTheDocument()
    expect(screen.getByTestId('footer-link-about')).toBeInTheDocument()
    expect(screen.getByTestId('footer-link-contact')).toBeInTheDocument()
  })
})

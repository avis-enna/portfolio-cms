import React from 'react'
import { Metadata } from 'next'

interface PortfolioData {
  personalInfo?: {
    name: string
    title: string
    bio: string
    profileImage?: string
  }
  summary?: string
  technicalSkills: Array<{
    category: string
    skills: string[]
  }>
  softSkills: string[]
  experience: Array<{
    title: string
    company: string
    location: string
    startDate: string
    endDate?: string
    current: boolean
    description: string
    technologies: string[]
  }>
  education: Array<{
    degree: string
    institution: string
    location: string
    startDate: string
    endDate: string
    gpa?: string
    description: string
  }>
  projects: Array<{
    title: string
    description: string
    technologies: string[]
    status: string
    featured: boolean
    startDate: string
    endDate?: string
    githubUrl?: string
    liveUrl?: string
    imageUrl?: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    date: string
    expiryDate?: string
    credentialId?: string
    credentialUrl?: string
  }>
  contactInfo: {
    email: string
    location: string
    linkedin?: string
    github?: string
    phone?: string
  }
  seoMetadata: {
    title: string
    description: string
    keywords: string[]
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const portfolioData = await getPortfolioData()

  return {
    title: portfolioData.seoMetadata.title,
    description: portfolioData.seoMetadata.description,
    keywords: portfolioData.seoMetadata.keywords.join(', '),
    openGraph: {
      title: portfolioData.seoMetadata.title,
      description: portfolioData.seoMetadata.description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: portfolioData.seoMetadata.title,
      description: portfolioData.seoMetadata.description,
    },
  }
}

async function getPortfolioData(): Promise<PortfolioData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/portfolio`, {
      next: { revalidate: 60 } // Revalidate every minute
    })

    if (!response.ok) {
      throw new Error('Failed to fetch portfolio data')
    }

    const result = await response.json()
    return result.content
  } catch (error) {
    console.error('Error fetching portfolio data:', error)
    // Return minimal default data if API fails
    return {
      technicalSkills: [],
      softSkills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      contactInfo: {
        email: 'contact@example.com',
        location: 'Location not specified'
      },
      seoMetadata: {
        title: 'Portfolio',
        description: 'Professional portfolio website',
        keywords: []
      }
    }
  }
}

export default async function HomePage() {
  const portfolioData = await getPortfolioData()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm" data-testid="main-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Portfolio</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8" data-testid="desktop-nav">
              {(portfolioData.personalInfo?.bio || portfolioData.summary || portfolioData.softSkills.length > 0) && (
                <a href="#about" className="text-gray-700 hover:text-gray-900" data-testid="nav-about">
                  About
                </a>
              )}
              {portfolioData.technicalSkills.length > 0 && (
                <a href="#skills" className="text-gray-700 hover:text-gray-900" data-testid="nav-skills">
                  Skills
                </a>
              )}
              {portfolioData.experience.length > 0 && (
                <a href="#experience" className="text-gray-700 hover:text-gray-900" data-testid="nav-experience">
                  Experience
                </a>
              )}
              {portfolioData.education.length > 0 && (
                <a href="#education" className="text-gray-700 hover:text-gray-900" data-testid="nav-education">
                  Education
                </a>
              )}
              {portfolioData.projects.length > 0 && (
                <a href="#projects" className="text-gray-700 hover:text-gray-900" data-testid="nav-projects">
                  Projects
                </a>
              )}
              {portfolioData.certifications.length > 0 && (
                <a href="#certifications" className="text-gray-700 hover:text-gray-900" data-testid="nav-certifications">
                  Certifications
                </a>
              )}
              <a href="/blog" className="text-gray-700 hover:text-gray-900" data-testid="nav-blog">
                Blog
              </a>
              <a href="#contact" className="text-gray-700 hover:text-gray-900" data-testid="nav-contact">
                Contact
              </a>
            </div>
            <div className="md:hidden flex items-center">
              <button
                type="button"
                className="text-gray-700 hover:text-gray-900"
                data-testid="mobile-menu-button"
                aria-label="Open mobile menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4" data-testid="hero-section">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {portfolioData.personalInfo?.name || portfolioData.seoMetadata.title}
          </h1>
          {portfolioData.personalInfo?.title && (
            <h2 className="text-2xl md:text-3xl text-gray-700 mb-4">
              {portfolioData.personalInfo.title}
            </h2>
          )}
          <p className="text-xl text-gray-600 mb-8">
            {portfolioData.personalInfo?.bio || portfolioData.summary || portfolioData.seoMetadata.description}
          </p>
          <div className="flex justify-center space-x-4">
            <button type="button" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              View My Work
            </button>
            <button type="button" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50">
              Download Resume
            </button>
          </div>
        </div>
      </section>

      {/* About Section - Only show if there's content */}
      {(portfolioData.personalInfo?.bio || portfolioData.summary || portfolioData.softSkills.length > 0) && (
        <section id="about" className="py-20 px-4 bg-white" data-testid="about-section">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">About Me</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                {(portfolioData.personalInfo?.bio || portfolioData.summary) && (
                  <p className="text-gray-600 mb-4">
                    {portfolioData.personalInfo?.bio || portfolioData.summary}
                  </p>
                )}
                {portfolioData.softSkills.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Strengths</h3>
                    <div className="flex flex-wrap gap-2">
                      {portfolioData.softSkills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                {portfolioData.personalInfo?.profileImage ? (
                  <img
                    src={portfolioData.personalInfo.profileImage}
                    alt={portfolioData.personalInfo.name || 'Profile'}
                    className="rounded-full w-64 h-64 object-cover"
                  />
                ) : (
                  <div className="rounded-full w-64 h-64 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Profile Image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Skills Section - Only show if there are skills */}
      {portfolioData.technicalSkills.length > 0 && (
        <section id="skills" className="py-20 px-4" data-testid="skills-section">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Skills</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {portfolioData.technicalSkills.map((skillCategory, index) => (
                <div key={index} className="text-center">
                  <h3 className="text-xl font-semibold mb-4">{skillCategory.category}</h3>
                  <ul className="text-gray-600 space-y-2">
                    {skillCategory.skills.map((skill, skillIndex) => (
                      <li key={skillIndex}>{skill}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience Section - Only show if there's experience data */}
      {portfolioData.experience.length > 0 && (
        <section id="experience" className="py-20 px-4 bg-white" data-testid="experience-section">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Experience</h2>
            <div className="space-y-8">
              {portfolioData.experience.map((exp, index) => (
                <div key={index} className="border-l-4 border-blue-600 pl-6">
                  <h3 className="text-xl font-semibold">{exp.title}</h3>
                  <p className="text-gray-600">
                    {exp.company} • {exp.location} • {new Date(exp.startDate).getFullYear()} - {exp.current ? 'Present' : new Date(exp.endDate!).getFullYear()}
                  </p>
                  <p className="text-gray-700 mt-2">{exp.description}</p>
                  {exp.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {exp.technologies.map((tech, techIndex) => (
                        <span key={techIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Projects Section - Only show if there are projects */}
      {portfolioData.projects.length > 0 && (
        <section id="projects" className="py-20 px-4" data-testid="projects-section">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Projects</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {portfolioData.projects.map((project, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, techIndex) => (
                      <span key={techIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        GitHub
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Education Section - Only show if there's education data */}
      {portfolioData.education.length > 0 && (
        <section id="education" className="py-20 px-4 bg-white" data-testid="education-section">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Education</h2>
            <div className="space-y-8">
              {portfolioData.education.map((edu, index) => (
                <div key={index} className="border-l-4 border-green-600 pl-6">
                  <h3 className="text-xl font-semibold">{edu.degree}</h3>
                  <p className="text-gray-600">
                    {edu.institution} • {edu.location} • {new Date(edu.startDate).getFullYear()} - {new Date(edu.endDate).getFullYear()}
                  </p>
                  {edu.gpa && (
                    <p className="text-gray-600">GPA: {edu.gpa}</p>
                  )}
                  <p className="text-gray-700 mt-2">{edu.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certifications Section - Only show if there are certifications */}
      {portfolioData.certifications.length > 0 && (
        <section id="certifications" className="py-20 px-4" data-testid="certifications-section">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Certifications</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {portfolioData.certifications.map((cert, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-2">{cert.name}</h3>
                  <p className="text-gray-600 mb-2">{cert.issuer}</p>
                  <p className="text-gray-500 text-sm">
                    Issued: {new Date(cert.date).toLocaleDateString()}
                    {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                  </p>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                    >
                      View Credential
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-white" data-testid="contact-section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Get In Touch</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Let's work together</h3>
              <p className="text-gray-600 mb-6">
                I'm always interested in new opportunities and exciting projects.
                Feel free to reach out if you'd like to collaborate!
              </p>
              <div className="space-y-2">
                <p className="text-gray-600">📧 {portfolioData.contactInfo.email}</p>
                {portfolioData.contactInfo.phone && (
                  <p className="text-gray-600">📱 {portfolioData.contactInfo.phone}</p>
                )}
                <p className="text-gray-600">📍 {portfolioData.contactInfo.location}</p>
                {portfolioData.contactInfo.linkedin && (
                  <p className="text-gray-600">
                    💼 <a href={portfolioData.contactInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">LinkedIn</a>
                  </p>
                )}
                {portfolioData.contactInfo.github && (
                  <p className="text-gray-600">
                    🐙 <a href={portfolioData.contactInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">GitHub</a>
                  </p>
                )}
              </div>
            </div>
            <form className="space-y-4" data-testid="contact-form">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  data-testid="contact-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  data-testid="contact-email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  data-testid="contact-message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                data-testid="contact-submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p>&copy; 2024 Portfolio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

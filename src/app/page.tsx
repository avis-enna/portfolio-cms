import React from 'react'
import { Metadata } from 'next'
import { connectToDatabase } from '@/lib/database/connection'
import { PortfolioContent } from '@/lib/database/models'
import { Navigation, ScrollToTop } from '@/components/Navigation'
import { HeroSection } from '@/components/HeroSection'
import { AboutSection, ExperienceSection, ProjectsSection, EducationSection } from '@/components/PortfolioSections'
import { ContactSection } from '@/components/ContactSection'
import { Footer } from '@/components/Footer'

interface PortfolioDataType {
  personalInfo?: {
    name: string
    title: string
    bio: string
    profileImage?: string
    email?: string
    phone?: string
    location?: string
    resumeUrl?: string
  }
  summary?: string
  technicalSkills: Array<{
    name: string
    level?: number
    category?: string
  }>
  softSkills: Array<{
    name: string
  }>
  experience: Array<{
    company: string
    position: string
    startDate: string
    endDate?: string
    description: string
    technologies?: string[]
    achievements?: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    field?: string
    startDate: string
    endDate?: string
    gpa?: string
    achievements?: string[]
  }>
  projects: Array<{
    title: string
    description: string
    technologies: string[]
    imageUrl?: string
    liveUrl?: string
    githubUrl?: string
    featured?: boolean
  }>
  certifications: Array<{
    name: string
    issuer: string
    date: string
    expiryDate?: string
    credentialUrl?: string
  }>
  socialLinks?: {
    linkedin?: string
    github?: string
    twitter?: string
    website?: string
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
    title: portfolioData?.seoMetadata?.title || 'Professional Developer Portfolio',
    description: portfolioData?.seoMetadata?.description || 'A modern, responsive portfolio showcasing my work and experience',
    keywords: portfolioData?.seoMetadata?.keywords?.join(', ') || 'portfolio, developer, web development',
    openGraph: {
      title: portfolioData?.seoMetadata?.title || 'Professional Developer Portfolio',
      description: portfolioData?.seoMetadata?.description || 'A modern, responsive portfolio showcasing my work and experience',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: portfolioData?.seoMetadata?.title || 'Professional Developer Portfolio',
      description: portfolioData?.seoMetadata?.description || 'A modern, responsive portfolio showcasing my work and experience',
    },
  }
}

async function getPortfolioData(): Promise<PortfolioDataType | null> {
  try {
    await connectToDatabase()
    const portfolioData = await PortfolioContent.findOne().lean()

    if (!portfolioData) {
      return null
    }

    // Transform the data to match our component interfaces
    return {
      personalInfo: portfolioData.personalInfo,
      summary: portfolioData.summary,
      technicalSkills: portfolioData.technicalSkills || [],
      softSkills: portfolioData.softSkills?.map((skill: string) => ({ name: skill })) || [],
      experience: portfolioData.experience?.map((exp: any) => ({
        company: exp.company,
        position: exp.position || exp.title,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
        technologies: exp.technologies,
        achievements: exp.achievements
      })) || [],
      education: portfolioData.education || [],
      projects: portfolioData.projects || [],
      certifications: portfolioData.certifications || [],
      socialLinks: portfolioData.socialLinks,
      seoMetadata: portfolioData.seoMetadata || {
        title: 'Professional Developer Portfolio',
        description: 'A modern, responsive portfolio showcasing my work and experience',
        keywords: ['portfolio', 'developer', 'web development']
      }
    }
  } catch (error) {
    console.error('Error fetching portfolio data:', error)
    return null
  }
}

export default async function HomePage() {
  const portfolioData = await getPortfolioData()

  // Create default data if no portfolio data exists
  const defaultData = {
    personalInfo: {
      name: 'Professional Developer',
      title: 'Full-Stack Developer',
      bio: 'Passionate about creating amazing digital experiences',
      email: 'contact@example.com',
      location: 'Available Worldwide'
    },
    summary: 'Welcome to my portfolio. I\'m a dedicated developer with a passion for creating innovative solutions.',
    technicalSkills: [],
    softSkills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    socialLinks: {},
    seoMetadata: {
      title: 'Professional Developer Portfolio',
      description: 'A modern, responsive portfolio showcasing my work and experience',
      keywords: ['portfolio', 'developer', 'web development']
    }
  }

  const data = portfolioData || defaultData

  // Transform data for components
  const transformedData = {
    ...data,
    contactInfo: {
      email: data.personalInfo?.email,
      phone: data.personalInfo?.phone,
      location: data.personalInfo?.location
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation portfolioData={transformedData} />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection portfolioData={transformedData} />

        {/* About Section */}
        <AboutSection
          summary={transformedData.summary}
          technicalSkills={transformedData.technicalSkills}
          softSkills={transformedData.softSkills}
        />

        {/* Experience Section */}
        <ExperienceSection experience={transformedData.experience} />

        {/* Projects Section */}
        <ProjectsSection projects={transformedData.projects} />

        {/* Education Section */}
        <EducationSection
          education={transformedData.education}
          certifications={transformedData.certifications}
        />

        {/* Contact Section */}
        <ContactSection contactInfo={transformedData.contactInfo} />
      </main>

      {/* Footer */}
      <Footer portfolioData={transformedData} />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}



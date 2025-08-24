'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '@/components/Toast'
import { EnhancedButton, SaveButton, AddButton, DeleteButton } from '@/components/EnhancedButton'
import { useAutoSave } from '@/hooks/useAutoSave'

interface PersonalInfo {
  name: string
  title: string
  email: string
  phone: string
  location: string
  bio: string
  profileImage: string
  resumeUrl: string
}

interface Experience {
  id?: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
  achievements: string[]
  technologies: string[]
}

interface Education {
  id?: string
  institution: string
  degree: string
  startDate: string
  endDate: string
  gpa?: number
  description?: string
}

interface Project {
  id?: string
  name: string
  description: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  imageUrl?: string
  status: 'completed' | 'in-progress' | 'planned'
  featured: boolean
}

interface Certification {
  id?: string
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
  credentialId?: string
  credentialUrl?: string
}

interface TechnicalSkillCategory {
  category: string
  skills: string[]
}

interface PortfolioContent {
  personalInfo?: {
    name: string
    title: string
    bio: string
    profileImage?: string
  }
  summary: string
  technicalSkills: TechnicalSkillCategory[]
  softSkills: string[]
  experience: Experience[]
  education: Education[]
  projects: Project[]
  certifications: Certification[]
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
}

export default function ContentManagement() {
  const { success, error, warning } = useToast()
  const router = useRouter()

  const [isRedirecting, setIsRedirecting] = useState(false)
  const [content, setContent] = useState<PortfolioContent>({
    personalInfo: {
      name: '',
      title: '',
      bio: '',
      profileImage: ''
    },
    summary: '',
    technicalSkills: [],
    softSkills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    contactInfo: {
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: ''
    },
    seoMetadata: {
      title: '',
      description: '',
      keywords: []
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [newSkill, setNewSkill] = useState({ technical: '', soft: '', tools: '' })

  // Email validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  // Validation function with memoization
  const validateForm = useCallback(() => {
    const errors: {[key: string]: string} = {}

    // Personal Info validation
    if (!content.personalInfo.name.trim()) {
      errors['personalInfo.name'] = 'Name is required'
    }
    if (!content.personalInfo.title.trim()) {
      errors['personalInfo.title'] = 'Title is required'
    }
    if (!content.personalInfo.bio.trim()) {
      errors['personalInfo.bio'] = 'Bio is required'
    } else if (content.personalInfo.bio.trim().length < 50) {
      errors['personalInfo.bio'] = 'Bio must be at least 50 characters long'
    }

    // Contact Info validation
    if (!content.contactInfo.email.trim()) {
      errors['contactInfo.email'] = 'Email is required'
    } else if (!emailRegex.test(content.contactInfo.email)) {
      errors['contactInfo.email'] = 'Please enter a valid email address'
    }
    if (!content.contactInfo.location.trim()) {
      errors['contactInfo.location'] = 'Location is required'
    }

    // SEO Metadata validation
    if (!content.seoMetadata.title.trim()) {
      errors['seoMetadata.title'] = 'SEO title is required'
    }
    if (!content.seoMetadata.description.trim()) {
      errors['seoMetadata.description'] = 'SEO description is required'
    }

    // Skills validation
    if (content.technicalSkills.length === 0) {
      errors['technicalSkills'] = 'At least one technical skill category is required'
    }
    if (content.softSkills.length === 0) {
      errors['softSkills'] = 'At least one soft skill is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [content, emailRegex])

  // Helper function to get error message for a field
  const getFieldError = (fieldPath: string) => {
    return validationErrors[fieldPath]
  }

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken && !isRedirecting) {
        console.log('ContentPage: No access token found, redirecting to login')
        setIsRedirecting(true)
        setTimeout(() => {
          router.push('/admin/login')
        }, 500)
        return
      }

      const response = await fetch('/api/admin/content', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setContent(data.content)
        }
      } else if (response.status === 401 && !isRedirecting) {
        console.log('ContentPage: API returned 401, redirecting to login')
        setIsRedirecting(true)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setTimeout(() => {
          router.push('/admin/login')
        }, 500)
      }
    } catch (error) {
      console.error('Error loading content:', error)
      setMessage('Error loading content')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePersonalInfoChange = useCallback((field: keyof PersonalInfo, value: string) => {
    setContent(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }))
  }, [])

  const handleContactInfoChange = useCallback((field: keyof typeof content.contactInfo, value: string) => {
    setContent(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }))
  }, [])

  const addSkill = (category: 'technical' | 'soft' | 'tools') => {
    const skill = newSkill[category].trim()
    if (skill) {
      setContent(prev => ({
        ...prev,
        skills: {
          ...prev.skills,
          [category]: [...prev.skills[category], skill]
        }
      }))
      setNewSkill(prev => ({ ...prev, [category]: '' }))
    }
  }

  const removeSkill = (category: 'technical' | 'soft' | 'tools', index: number) => {
    setContent(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter((_, i) => i !== index)
      }
    }))
  }

  // Experience management
  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      achievements: [],
      technologies: []
    }
    setContent(prev => ({
      ...prev,
      experience: [...prev.experience, newExperience]
    }))
  }

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    setContent(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const removeExperience = (index: number) => {
    setContent(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  // Education management
  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      startDate: '',
      endDate: '',
      gpa: undefined,
      description: ''
    }
    setContent(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }))
  }

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    setContent(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const removeEducation = (index: number) => {
    setContent(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  // Project management
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: [],
      githubUrl: '',
      liveUrl: '',
      imageUrl: '',
      status: 'planned',
      featured: false
    }
    setContent(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }))
  }

  const updateProject = (index: number, field: keyof Project, value: any) => {
    setContent(prev => ({
      ...prev,
      projects: prev.projects.map((proj, i) =>
        i === index ? { ...proj, [field]: value } : proj
      )
    }))
  }

  const removeProject = (index: number) => {
    setContent(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }))
  }

  // Certification management
  const addCertification = () => {
    const newCertification: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: ''
    }
    setContent(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCertification]
    }))
  }

  const updateCertification = (index: number, field: keyof Certification, value: any) => {
    setContent(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      )
    }))
  }

  const removeCertification = (index: number) => {
    setContent(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')

    // Validate form before submitting
    if (!validateForm()) {
      setIsSaving(false)
      error('Validation failed', 'Please fix the errors below and try again.')
      return
    }

    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken && !isRedirecting) {
        warning('Session expired', 'Please log in again to continue.')
        setIsRedirecting(true)
        setTimeout(() => {
          router.push('/admin/login')
        }, 500)
        return
      }

      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      })

      const data = await response.json()

      if (data.success) {
        success('Content saved successfully!', 'Your portfolio content has been updated.')
        setMessage('Content saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        error('Save failed', data.error || 'Failed to save content. Please try again.')
        setMessage(data.error || 'Error saving content')
      }
    } catch (err) {
      console.error('Error saving content:', err)
      error('Save failed', 'An unexpected error occurred while saving.')
      setMessage('Error saving content')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="content-management">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Portfolio Content</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">Manage your personal information and portfolio content</p>
          </div>
          <div className="flex-shrink-0">
            <SaveButton
              onClick={handleSave}
              loading={isSaving}
              size="lg"
              className="w-full sm:w-auto"
            >
              Save Changes
            </SaveButton>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* Personal Information */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg font-medium text-white mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="personal-name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                id="personal-name"
                type="text"
                value={content.personalInfo.name}
                onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border text-white rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                  getFieldError('personalInfo.name')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Your full name"
              />
              {getFieldError('personalInfo.name') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('personalInfo.name')}</p>
              )}
            </div>
            <div>
              <label htmlFor="personal-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input
                id="personal-title"
                type="text"
                value={content.personalInfo.title}
                onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border text-white rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                  getFieldError('personalInfo.title')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Software Developer"
              />
              {getFieldError('personalInfo.title') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('personalInfo.title')}</p>
              )}
            </div>
            <div>
              <label htmlFor="personal-email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                id="personal-email"
                type="email"
                value={content.personalInfo.email}
                onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label htmlFor="personal-phone" className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
              <input
                id="personal-phone"
                type="text"
                value={content.personalInfo.phone}
                onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label htmlFor="personal-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                id="personal-location"
                type="text"
                value={content.personalInfo.location}
                onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <label htmlFor="personal-profile-image" className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
              <input
                id="personal-profile-image"
                type="url"
                value={content.personalInfo.profileImage}
                onChange={(e) => handlePersonalInfoChange('profileImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/profile.jpg"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="personal-bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                id="personal-bio"
                rows={4}
                value={content.personalInfo.bio}
                onChange={(e) => handlePersonalInfoChange('bio', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  getFieldError('personalInfo.bio')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Tell us about yourself, your experience, and what you&apos;re passionate about..."
              />
              {getFieldError('personalInfo.bio') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('personalInfo.bio')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg font-medium text-white mb-4">Skills</h2>
          {(getFieldError('technicalSkills') || getFieldError('softSkills')) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              {getFieldError('technicalSkills') && (
                <p className="text-sm text-red-600">{getFieldError('technicalSkills')}</p>
              )}
              {getFieldError('softSkills') && (
                <p className="text-sm text-red-600">{getFieldError('softSkills')}</p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {(['technical', 'soft', 'tools'] as const).map((category) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-gray-300 mb-2 capitalize">
                  {category} Skills
                </h3>
                <div className="space-y-2">
                  {/* Temporarily disabled: content.skills[category].map((skill, index) => ( */}
                  {[].map((skill, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm">{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(category, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <div className="flex">
                    <input
                      type="text"
                      value=""
                      onChange={(e) => setNewSkill(prev => ({ ...prev, [category]: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill(category)}
                      placeholder={`Add ${category} skill`}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => addSkill(category)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-medium text-white">Work Experience</h2>
            <AddButton onClick={addExperience} className="w-full sm:w-auto">
              Add Experience
            </AddButton>
          </div>
          <div className="space-y-6">
            {content.experience.map((exp, index) => (
              <div key={exp.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Experience #{index + 1}</h3>
                  <DeleteButton
                    onClick={() => removeExperience(index)}
                    size="sm"
                    variant="ghost"
                  >
                    Remove
                  </DeleteButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`exp-company-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      id={`exp-company-${index}`}
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label htmlFor={`exp-position-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      id={`exp-position-${index}`}
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateExperience(index, 'position', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <label htmlFor={`exp-start-date-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      id={`exp-start-date-${index}`}
                      type="date"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`exp-end-date-${index}`} className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      id={`exp-end-date-${index}`}
                      type="date"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor={`exp-description-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      id={`exp-description-${index}`}
                      rows={3}
                      value={exp.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your role and responsibilities"
                    />
                  </div>
                </div>
              </div>
            ))}
            {content.experience.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No work experience added yet. Click &quot;Add Experience&quot; to get started.
              </div>
            )}
          </div>
        </div>

        {/* Education */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-medium text-white">Education</h2>
            <button
              type="button"
              onClick={addEducation}
              className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Add Education
            </button>
          </div>
          <div className="space-y-6">
            {content.education.map((edu, index) => (
              <div key={edu.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Education #{index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="University or school name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Degree or certification"
                    />
                  </div>
                  <div>
                    <label htmlFor={`edu-start-date-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      id={`edu-start-date-${index}`}
                      type="date"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`edu-end-date-${index}`} className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      id={`edu-end-date-${index}`}
                      type="date"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GPA (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={edu.gpa || ''}
                      onChange={(e) => updateEducation(index, 'gpa', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="3.8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={edu.description || ''}
                      onChange={(e) => updateEducation(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Honors, relevant coursework, etc."
                    />
                  </div>
                </div>
              </div>
            ))}
            {content.education.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No education added yet. Click &quot;Add Education&quot; to get started.
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg font-medium text-white mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                id="contact-email"
                type="email"
                value={content.contactInfo.email}
                onChange={(e) => handleContactInfoChange('email', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border text-white rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                  getFieldError('contactInfo.email')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="your.email@example.com"
              />
              {getFieldError('contactInfo.email') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('contactInfo.email')}</p>
              )}
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
              <input
                id="contact-phone"
                type="text"
                value={content.contactInfo.phone || ''}
                onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label htmlFor="contact-location" className="block text-sm font-medium text-gray-300 mb-1">Location</label>
              <input
                id="contact-location"
                type="text"
                value={content.contactInfo.location}
                onChange={(e) => handleContactInfoChange('location', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border text-white rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                  getFieldError('contactInfo.location')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="San Francisco, CA"
              />
              {getFieldError('contactInfo.location') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('contactInfo.location')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg font-medium text-white mb-4">Social Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn</label>
              <input
                type="url"
                value={content.contactInfo.linkedin || ''}
                onChange={(e) => handleContactInfoChange('linkedin', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">GitHub</label>
              <input
                type="url"
                value={content.contactInfo.github || ''}
                onChange={(e) => handleContactInfoChange('github', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Website</label>
              <input
                type="url"
                value={content.contactInfo.website || ''}
                onChange={(e) => handleContactInfoChange('website', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-medium text-white">Projects</h2>
            <button
              type="button"
              onClick={addProject}
              className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Add Project
            </button>
          </div>
          <div className="space-y-6">
            {content.projects.map((project, index) => (
              <div key={project.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Project #{index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeProject(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={project.name}
                      onChange={(e) => updateProject(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Project name"
                    />
                  </div>
                  <div>
                    <label htmlFor={`project-status-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      id={`project-status-${index}`}
                      value={project.status}
                      onChange={(e) => updateProject(index, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="planned">Planned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                    <input
                      type="url"
                      value={project.githubUrl || ''}
                      onChange={(e) => updateProject(index, 'githubUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://github.com/user/repo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Live URL</label>
                    <input
                      type="url"
                      value={project.liveUrl || ''}
                      onChange={(e) => updateProject(index, 'liveUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://yourproject.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={project.description}
                      onChange={(e) => updateProject(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your project"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`featured-${index}`}
                        checked={project.featured}
                        onChange={(e) => updateProject(index, 'featured', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`featured-${index}`} className="ml-2 block text-sm text-gray-900">
                        Featured project (show prominently on portfolio)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {content.projects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No projects added yet. Click &quot;Add Project&quot; to get started.
              </div>
            )}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-medium text-white">Certifications</h2>
            <button
              type="button"
              onClick={addCertification}
              className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Add Certification
            </button>
          </div>
          <div className="space-y-6">
            {content.certifications.map((cert, index) => (
              <div key={cert.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Certification #{index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeCertification(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => updateCertification(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="AWS Certified Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Amazon Web Services"
                    />
                  </div>
                  <div>
                    <label htmlFor={`cert-issue-date-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                    <input
                      id={`cert-issue-date-${index}`}
                      type="date"
                      value={cert.issueDate}
                      onChange={(e) => updateCertification(index, 'issueDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`cert-expiry-date-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                    <input
                      id={`cert-expiry-date-${index}`}
                      type="date"
                      value={cert.expiryDate || ''}
                      onChange={(e) => updateCertification(index, 'expiryDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID (Optional)</label>
                    <input
                      type="text"
                      value={cert.credentialId || ''}
                      onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ABC123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credential URL (Optional)</label>
                    <input
                      type="url"
                      value={cert.credentialUrl || ''}
                      onChange={(e) => updateCertification(index, 'credentialUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://verify.example.com/cert"
                    />
                  </div>
                </div>
              </div>
            ))}
            {content.certifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No certifications added yet. Click &quot;Add Certification&quot; to get started.
              </div>
            )}
          </div>
        </div>

        {/* SEO Metadata */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg font-medium text-white mb-4">SEO Metadata</h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div>
              <label htmlFor="seo-title" className="block text-sm font-medium text-gray-300 mb-1">SEO Title</label>
              <input
                id="seo-title"
                type="text"
                value={content.seoMetadata.title}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  seoMetadata: { ...prev.seoMetadata, title: e.target.value }
                }))}
                className={`w-full px-3 py-2 bg-gray-800 border text-white rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                  getFieldError('seoMetadata.title')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Your Portfolio - Software Developer"
              />
              {getFieldError('seoMetadata.title') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('seoMetadata.title')}</p>
              )}
            </div>
            <div>
              <label htmlFor="seo-description" className="block text-sm font-medium text-gray-300 mb-1">SEO Description</label>
              <textarea
                id="seo-description"
                rows={3}
                value={content.seoMetadata.description}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  seoMetadata: { ...prev.seoMetadata, description: e.target.value }
                }))}
                className={`w-full px-3 py-2 bg-gray-800 border text-white rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                  getFieldError('seoMetadata.description')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Brief description of your portfolio and skills for search engines"
              />
              {getFieldError('seoMetadata.description') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('seoMetadata.description')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

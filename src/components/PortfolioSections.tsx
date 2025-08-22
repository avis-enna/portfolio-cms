'use client'

import React from 'react'
import Image from 'next/image'

interface Skill {
  name: string
  level?: number
  category?: string
}

interface Experience {
  company: string
  position: string
  startDate: string
  endDate?: string
  description: string
  technologies?: string[]
  achievements?: string[]
}

interface Project {
  title: string
  description: string
  technologies: string[]
  imageUrl?: string
  liveUrl?: string
  githubUrl?: string
  featured?: boolean
}

interface Education {
  institution: string
  degree: string
  field?: string
  startDate: string
  endDate?: string
  gpa?: string
  achievements?: string[]
}

interface Certification {
  name: string
  issuer: string
  date: string
  expiryDate?: string
  credentialUrl?: string
}

// About Section Component
interface AboutSectionProps {
  summary?: string
  technicalSkills?: Skill[]
  softSkills?: Skill[]
}

export function AboutSection({ summary, technicalSkills = [], softSkills = [] }: AboutSectionProps) {
  if (!summary && !technicalSkills.length && !softSkills.length) return null

  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-900" data-testid="about-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About Me
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Summary */}
          {summary && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">My Story</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {summary}
              </p>
            </div>
          )}

          {/* Skills */}
          {(technicalSkills.length > 0 || softSkills.length > 0) && (
            <div className="space-y-8">
              {technicalSkills.length > 0 && (
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Technical Skills
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {technicalSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 text-center hover:shadow-md transition-shadow"
                        data-testid="technical-skill"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {skill.name}
                        </div>
                        {skill.level && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${skill.level}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {softSkills.length > 0 && (
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Soft Skills
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {softSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                        data-testid="soft-skill"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// Experience Section Component
interface ExperienceSectionProps {
  experience?: Experience[]
}

export function ExperienceSection({ experience = [] }: ExperienceSectionProps) {
  if (!experience.length) return null

  return (
    <section id="experience" className="py-20 bg-gray-50 dark:bg-slate-800" data-testid="experience-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Experience
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
        </div>

        <div className="space-y-8">
          {experience.map((exp, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
              data-testid="experience-item"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {exp.position}
                  </h3>
                  <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
                    {exp.company}
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 md:mt-0">
                  {exp.startDate} - {exp.endDate || 'Present'}
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {exp.description}
              </p>

              {exp.technologies && exp.technologies.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Technologies:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {exp.achievements && exp.achievements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Key Achievements:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    {exp.achievements.map((achievement, achIndex) => (
                      <li key={achIndex} className="text-sm">
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Projects Section Component
interface ProjectsSectionProps {
  projects?: Project[]
}

export function ProjectsSection({ projects = [] }: ProjectsSectionProps) {
  if (!projects.length) return null

  const featuredProjects = projects.filter(p => p.featured)
  const otherProjects = projects.filter(p => !p.featured)

  return (
    <section id="projects" className="py-20 bg-white dark:bg-slate-900" data-testid="projects-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Projects
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
        </div>

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
              Featured Projects
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredProjects.map((project, index) => (
                <ProjectCard key={index} project={project} featured />
              ))}
            </div>
          </div>
        )}

        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <div>
            {featuredProjects.length > 0 && (
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
                Other Projects
              </h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherProjects.map((project, index) => (
                <ProjectCard key={index} project={project} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// Project Card Component
function ProjectCard({ project, featured = false }: { project: Project; featured?: boolean }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden ${
        featured ? 'lg:col-span-1' : ''
      }`}
      data-testid="project-card"
    >
      {project.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-6">
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {project.title}
        </h4>

        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.map((tech, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-sm font-medium"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex space-x-4">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Live Demo</span>
            </a>
          )}

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Code</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// Education Section Component
interface EducationSectionProps {
  education?: Education[]
  certifications?: Certification[]
}

export function EducationSection({ education = [], certifications = [] }: EducationSectionProps) {
  if (!education.length && !certifications.length) return null

  return (
    <section id="education" className="py-20 bg-gray-50 dark:bg-slate-800" data-testid="education-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Education & Certifications
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Education */}
          {education.length > 0 && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Education</h3>
              <div className="space-y-6">
                {education.map((edu, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    data-testid="education-item"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {edu.degree}
                        {edu.field && <span className="text-blue-600 dark:text-blue-400"> in {edu.field}</span>}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                        {edu.startDate} - {edu.endDate || 'Present'}
                      </span>
                    </div>

                    <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                      {edu.institution}
                    </p>

                    {edu.gpa && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                        GPA: {edu.gpa}
                      </p>
                    )}

                    {edu.achievements && edu.achievements.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                        {edu.achievements.map((achievement, achIndex) => (
                          <li key={achIndex}>{achievement}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Certifications</h3>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    data-testid="certification-item"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {cert.name}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                        {cert.date}
                        {cert.expiryDate && ` - ${cert.expiryDate}`}
                      </span>
                    </div>

                    <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                      {cert.issuer}
                    </p>

                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>View Credential</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

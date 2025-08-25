'use client';

import { useState, useEffect } from 'react';

interface PortfolioData {
  personalInfo: {
    name: string;
    title: string;
    bio: string;
    email: string;
    phone: string;
    location: string;
    profileImage: string;
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    technologies: string[];
    achievements: string[];
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    liveUrl: string;
    githubUrl: string;
    image: string;
  }>;
  technicalSkills: Array<{
    name: string;
    category: string;
  }>;
}

// Simple Loading
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Loading...</p>
    </div>
  );
}

// Simple Error
function ErrorScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Unable to load portfolio</p>
    </div>
  );
}

// Clean Hero Section
function HeroSection({ data }: { data: PortfolioData['personalInfo'] }) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {data.name}
        </h1>
        <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          {data.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          {data.bio}
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="#projects"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Projects
          </a>
          <a
            href="#contact"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </section>
  );
}

// Clean About Section
function AboutSection({ data }: { data: PortfolioData }) {
  return (
    <section id="about" className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          About
        </h2>
        <div className="space-y-8">
          <p className="text-gray-600 dark:text-gray-400 text-center">
            {data.personalInfo.bio}
          </p>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Skills
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {data.technicalSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Clean Experience Section
function ExperienceSection({ data }: { data: PortfolioData['experience'] }) {
  return (
    <section id="experience" className="py-16 px-6 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Experience
        </h2>
        <div className="space-y-6">
          {data.map((exp, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {exp.position}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400">
                    {exp.company}
                  </p>
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {exp.startDate} - {exp.endDate || 'Present'}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {exp.description}
              </p>
              {exp.technologies && (
                <div className="flex flex-wrap gap-1">
                  {exp.technologies.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                    >
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
  );
}

// Clean Projects Section
function ProjectsSection({ data }: { data: PortfolioData['projects'] }) {
  return (
    <section id="projects" className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Projects
        </h2>
        <div className="space-y-6">
          {data.map((project, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {project.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {project.technologies.map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    Live Demo
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:underline text-sm"
                  >
                    Code
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Clean Contact Section
function ContactSection({ data }: { data: PortfolioData['personalInfo'] }) {
  return (
    <section id="contact" className="py-16 px-6 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Contact
        </h2>
        <div className="space-y-4">
          <div>
            <a
              href={`mailto:${data.email}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {data.email}
            </a>
          </div>
          <div>
            <a
              href={`tel:${data.phone}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {data.phone}
            </a>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">{data.location}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch('/api/portfolio');
      if (response.ok) {
        const data = await response.json();
        setPortfolioData(data);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!portfolioData) {
    return <ErrorScreen />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Simple Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-900 dark:text-white">
              {portfolioData.personalInfo.name}
            </div>

            <div className="flex items-center space-x-6">
              <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                About
              </a>
              <a href="#experience" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Experience
              </a>
              <a href="#projects" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Projects
              </a>
              <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Contact
              </a>

              <button
                type="button"
                onClick={toggleTheme}
                className="p-1 rounded text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                aria-label="Toggle theme"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <HeroSection data={portfolioData.personalInfo} />
        <AboutSection data={portfolioData} />
        <ExperienceSection data={portfolioData.experience} />
        <ProjectsSection data={portfolioData.projects} />
        <ContactSection data={portfolioData.personalInfo} />
      </main>

      {/* Simple Footer */}
      <footer className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          © 2025 {portfolioData.personalInfo.name}
        </p>
      </footer>
    </div>
  );
}

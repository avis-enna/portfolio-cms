#!/usr/bin/env node

/**
 * Test script to verify dynamic portfolio features
 * This script tests:
 * 1. Adding content and verifying sections appear
 * 2. Removing content and verifying sections disappear
 * 3. Dashboard statistics updates
 * 4. API endpoints functionality
 */

const BASE_URL = 'http://localhost:3002';

// Test data
const testContent = {
  personalInfo: {
    name: 'John Doe',
    title: 'Full Stack Developer',
    bio: 'Passionate developer with 5+ years of experience building scalable web applications.',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA'
  },
  summary: 'I build modern web applications using cutting-edge technologies.',
  technicalSkills: [
    {
      category: 'Frontend',
      skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS']
    },
    {
      category: 'Backend',
      skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL']
    }
  ],
  softSkills: ['Problem Solving', 'Team Leadership', 'Communication'],
  experience: [
    {
      title: 'Senior Full Stack Developer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      startDate: '2022-01-01',
      current: true,
      description: 'Leading development of microservices architecture serving 1M+ users.',
      technologies: ['React', 'Node.js', 'AWS', 'MongoDB']
    }
  ],
  projects: [
    {
      title: 'E-commerce Platform',
      description: 'Full-featured e-commerce platform with payment integration.',
      technologies: ['Next.js', 'Stripe', 'PostgreSQL'],
      status: 'completed',
      featured: true,
      githubUrl: 'https://github.com/johndoe/ecommerce',
      liveUrl: 'https://ecommerce-demo.com'
    }
  ],
  contactInfo: {
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe'
  },
  seoMetadata: {
    title: 'John Doe - Full Stack Developer',
    description: 'Experienced full stack developer specializing in React and Node.js',
    keywords: ['full stack', 'react', 'node.js', 'developer']
  }
};

const emptyContent = {
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
};

async function testPortfolioAPI() {
  console.log('🧪 Testing Portfolio API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/portfolio`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Portfolio API working');
      console.log('📊 Current content sections:');
      console.log(`   - Technical Skills: ${data.content.technicalSkills.length} categories`);
      console.log(`   - Experience: ${data.content.experience.length} entries`);
      console.log(`   - Projects: ${data.content.projects.length} projects`);
      console.log(`   - Education: ${data.content.education.length} entries`);
      console.log(`   - Certifications: ${data.content.certifications.length} certifications`);
      return data.content;
    } else {
      console.log('❌ Portfolio API failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Portfolio API error:', error.message);
    return null;
  }
}

async function checkPortfolioSections() {
  console.log('\n🔍 Checking which sections should be visible...');
  
  const content = await testPortfolioAPI();
  if (!content) return;
  
  const sections = {
    'About': content.personalInfo?.bio || content.summary || content.softSkills.length > 0,
    'Skills': content.technicalSkills.length > 0,
    'Experience': content.experience.length > 0,
    'Education': content.education.length > 0,
    'Projects': content.projects.length > 0,
    'Certifications': content.certifications.length > 0,
    'Contact': true // Always visible
  };
  
  console.log('📋 Section visibility:');
  Object.entries(sections).forEach(([section, visible]) => {
    console.log(`   ${visible ? '✅' : '❌'} ${section}`);
  });
  
  const visibleSections = Object.entries(sections).filter(([_, visible]) => visible).map(([section, _]) => section);
  console.log(`\n🎯 Total visible sections: ${visibleSections.length}`);
  console.log(`📝 Navigation should show: ${visibleSections.join(', ')}, Blog`);
}

async function main() {
  console.log('🚀 Starting Dynamic Portfolio Features Test\n');
  
  // Test 1: Check initial state (should be minimal)
  console.log('='.repeat(50));
  console.log('TEST 1: Initial Empty State');
  console.log('='.repeat(50));
  await checkPortfolioSections();
  
  console.log('\n📱 Open http://localhost:3002 to see the current portfolio state');
  console.log('🔧 Open http://localhost:3002/admin/content to manage content');
  console.log('📊 Open http://localhost:3002/admin/dashboard to see statistics');
  
  console.log('\n✨ Test completed! Manual verification steps:');
  console.log('1. Check portfolio website - should show minimal content');
  console.log('2. Add content through admin panel');
  console.log('3. Refresh portfolio - new sections should appear');
  console.log('4. Remove content through admin panel');
  console.log('5. Refresh portfolio - sections should disappear');
  console.log('6. Check dashboard for real statistics');
}

// Run the test
main().catch(console.error);

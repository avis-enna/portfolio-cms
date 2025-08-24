#!/usr/bin/env node

/**
 * Portfolio CMS Setup Wizard
 * Interactive setup script for customizing the portfolio
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const crypto = require('crypto')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

class PortfolioSetup {
  constructor() {
    this.configPath = path.join(__dirname, '../config')
    this.envPath = path.join(__dirname, '../.env.local')
    this.config = {}
  }

  async run() {
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║                    Portfolio CMS Setup                      ║
║              Welcome to your new portfolio!                 ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`)

    console.log(`${colors.yellow}This wizard will help you customize your portfolio with your personal information.${colors.reset}\n`)

    try {
      await this.checkExistingSetup()
      await this.gatherPersonalInfo()
      await this.gatherSocialLinks()
      await this.configureFeatures()
      await this.configureTheme()
      await this.generateSecrets()
      await this.saveConfiguration()
      await this.showNextSteps()
    } catch (error) {
      console.error(`${colors.red}Setup failed: ${error.message}${colors.reset}`)
      process.exit(1)
    } finally {
      rl.close()
    }
  }

  async checkExistingSetup() {
    const setupFile = path.join(this.configPath, 'setup.json')
    if (fs.existsSync(setupFile)) {
      const setup = JSON.parse(fs.readFileSync(setupFile, 'utf8'))
      if (setup.setup.isConfigured) {
        const overwrite = await this.question(`${colors.yellow}Portfolio is already configured. Do you want to reconfigure? (y/N): ${colors.reset}`)
        if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
          console.log(`${colors.green}Setup cancelled. Use the admin dashboard to make changes.${colors.reset}`)
          process.exit(0)
        }
      }
    }
  }

  async gatherPersonalInfo() {
    console.log(`${colors.blue}${colors.bright}📝 Personal Information${colors.reset}`)
    console.log('Let\'s start with your basic information:\n')

    this.config.personal = {
      name: await this.question('Full Name: '),
      title: await this.question('Professional Title (e.g., Full Stack Developer): '),
      tagline: await this.question('Tagline/Motto: '),
      email: await this.question('Email Address: '),
      phone: await this.question('Phone Number (optional): ') || null,
      location: await this.question('Location (e.g., San Francisco, CA): '),
      website: await this.question('Website URL (optional): ') || null
    }

    const bioLines = []
    console.log('\nBio/About (press Enter twice when done):')
    let line
    while ((line = await this.question('')) !== '' || bioLines.length === 0) {
      if (line !== '') bioLines.push(line)
      if (line === '' && bioLines.length > 0) break
    }
    this.config.personal.bio = bioLines.join(' ')

    console.log(`${colors.green}✓ Personal information collected${colors.reset}\n`)
  }

  async gatherSocialLinks() {
    console.log(`${colors.blue}${colors.bright}🔗 Social Media Links${colors.reset}`)
    console.log('Add your social media profiles (leave empty to skip):\n')

    const socialPlatforms = [
      { key: 'github', name: 'GitHub', example: 'https://github.com/username' },
      { key: 'linkedin', name: 'LinkedIn', example: 'https://linkedin.com/in/username' },
      { key: 'twitter', name: 'Twitter', example: 'https://twitter.com/username' },
      { key: 'instagram', name: 'Instagram', example: 'https://instagram.com/username' },
      { key: 'youtube', name: 'YouTube', example: 'https://youtube.com/@username' },
      { key: 'dribbble', name: 'Dribbble', example: 'https://dribbble.com/username' },
      { key: 'behance', name: 'Behance', example: 'https://behance.net/username' },
      { key: 'medium', name: 'Medium', example: 'https://medium.com/@username' }
    ]

    this.config.social = {}
    for (const platform of socialPlatforms) {
      const url = await this.question(`${platform.name} (${platform.example}): `)
      if (url) this.config.social[platform.key] = url
    }

    console.log(`${colors.green}✓ Social links collected${colors.reset}\n`)
  }

  async configureFeatures() {
    console.log(`${colors.blue}${colors.bright}⚙️  Feature Configuration${colors.reset}`)
    console.log('Configure which features you want to enable:\n')

    const features = [
      { key: 'ai', name: 'AI Content Generation', description: 'Generate content with OpenAI' },
      { key: 'analytics', name: 'Analytics Dashboard', description: 'Track visitors and performance' },
      { key: 'pwa', name: 'Progressive Web App', description: 'Offline support and app-like experience' },
      { key: 'blog', name: 'Blog System', description: 'Write and publish blog posts' },
      { key: 'contact', name: 'Contact Form', description: 'Allow visitors to contact you' }
    ]

    this.config.features = {}
    for (const feature of features) {
      const enabled = await this.question(`Enable ${feature.name}? (${feature.description}) (Y/n): `)
      this.config.features[feature.key] = {
        enabled: enabled.toLowerCase() !== 'n' && enabled.toLowerCase() !== 'no'
      }
    }

    console.log(`${colors.green}✓ Features configured${colors.reset}\n`)
  }

  async configureTheme() {
    console.log(`${colors.blue}${colors.bright}🎨 Theme Configuration${colors.reset}`)
    console.log('Customize your portfolio\'s appearance:\n')

    const themes = ['default', 'dark', 'minimal', 'colorful']
    console.log('Available themes:', themes.join(', '))
    const theme = await this.question('Choose a theme (default): ') || 'default'

    const colors = ['blue', 'green', 'purple', 'red', 'orange', 'pink']
    console.log('Available colors:', colors.join(', '))
    const color = await this.question('Choose primary color (blue): ') || 'blue'

    this.config.theme = {
      name: theme,
      primaryColor: this.getColorValue(color),
      mode: 'system'
    }

    console.log(`${colors.green}✓ Theme configured${colors.reset}\n`)
  }

  async generateSecrets() {
    console.log(`${colors.blue}${colors.bright}🔐 Security Configuration${colors.reset}`)
    
    this.config.secrets = {
      jwtSecret: crypto.randomBytes(64).toString('hex'),
      sessionSecret: crypto.randomBytes(32).toString('hex'),
      encryptionKey: crypto.randomBytes(32).toString('hex')
    }

    // Ask for optional API keys
    console.log('Optional API Keys (leave empty to skip):')
    
    const openaiKey = await this.question('OpenAI API Key (for AI features): ')
    if (openaiKey) this.config.secrets.openaiApiKey = openaiKey

    const mongoUri = await this.question('MongoDB URI (leave empty for local): ')
    this.config.secrets.mongoUri = mongoUri || 'mongodb://localhost:27017/portfolio-cms'

    console.log(`${colors.green}✓ Security configured${colors.reset}\n`)
  }

  async saveConfiguration() {
    console.log(`${colors.blue}${colors.bright}💾 Saving Configuration${colors.reset}`)

    // Save portfolio config
    const portfolioConfig = {
      personal: this.config.personal,
      social: this.config.social,
      about: {
        shortDescription: this.config.personal.tagline,
        longDescription: this.config.personal.bio,
        interests: [],
        values: [],
        funFacts: []
      },
      experience: [],
      education: [],
      certifications: [],
      awards: [],
      testimonials: [],
      contact: {
        availability: "Available for opportunities",
        preferredContact: "email",
        responseTime: "Within 24 hours"
      },
      seo: {
        title: `${this.config.personal.name} - ${this.config.personal.title}`,
        description: `Professional portfolio of ${this.config.personal.name}, ${this.config.personal.title}`,
        keywords: [this.config.personal.title.toLowerCase(), "portfolio", this.config.personal.name.toLowerCase()]
      }
    }

    fs.writeFileSync(
      path.join(this.configPath, 'portfolio.json'),
      JSON.stringify(portfolioConfig, null, 2)
    )

    // Save setup config
    const setupConfig = {
      setup: {
        isConfigured: true,
        version: "1.0.0",
        setupDate: new Date().toISOString(),
        configuredBy: this.config.personal.name
      },
      features: this.config.features,
      theme: this.config.theme,
      deployment: {
        platform: "vercel",
        environment: "development"
      }
    }

    fs.writeFileSync(
      path.join(this.configPath, 'setup.json'),
      JSON.stringify(setupConfig, null, 2)
    )

    // Save environment variables
    const envContent = `# Portfolio CMS Environment Variables
# Generated by setup wizard on ${new Date().toISOString()}

# Database
MONGODB_URI="${this.config.secrets.mongoUri}"

# Authentication
JWT_SECRET="${this.config.secrets.jwtSecret}"
SESSION_SECRET="${this.config.secrets.sessionSecret}"
ENCRYPTION_KEY="${this.config.secrets.encryptionKey}"

# OpenAI (optional)
${this.config.secrets.openaiApiKey ? `OPENAI_API_KEY="${this.config.secrets.openaiApiKey}"` : '# OPENAI_API_KEY="your-openai-api-key"'}

# App Configuration
NEXT_PUBLIC_APP_NAME="${this.config.personal.name} Portfolio"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Features
NEXT_PUBLIC_ENABLE_AI="${this.config.features.ai?.enabled || false}"
NEXT_PUBLIC_ENABLE_ANALYTICS="${this.config.features.analytics?.enabled || false}"
NEXT_PUBLIC_ENABLE_PWA="${this.config.features.pwa?.enabled || false}"
`

    fs.writeFileSync(this.envPath, envContent)

    console.log(`${colors.green}✓ Configuration saved${colors.reset}\n`)
  }

  async showNextSteps() {
    console.log(`${colors.green}${colors.bright}🎉 Setup Complete!${colors.reset}`)
    console.log(`
Your portfolio has been configured successfully! Here's what to do next:

${colors.cyan}1. Start the development server:${colors.reset}
   npm run dev

${colors.cyan}2. Open your browser and go to:${colors.reset}
   http://localhost:3000

${colors.cyan}3. Access the admin dashboard:${colors.reset}
   http://localhost:3000/admin
   
${colors.cyan}4. Add your content:${colors.reset}
   • Upload your profile picture
   • Add your projects and experience
   • Write blog posts
   • Customize your theme

${colors.cyan}5. Deploy your portfolio:${colors.reset}
   • Push to GitHub
   • Deploy to Vercel/Netlify
   • Update environment variables

${colors.yellow}💡 Pro Tips:${colors.reset}
• Use the admin dashboard to manage all your content
• Enable AI features by adding your OpenAI API key
• Check the analytics dashboard for visitor insights
• Your portfolio works offline as a PWA!

${colors.magenta}Need help? Check the documentation or create an issue on GitHub.${colors.reset}
`)
  }

  getColorValue(color) {
    const colorMap = {
      blue: '#2563eb',
      green: '#059669',
      purple: '#7c3aed',
      red: '#dc2626',
      orange: '#ea580c',
      pink: '#db2777'
    }
    return colorMap[color] || colorMap.blue
  }

  question(prompt) {
    return new Promise((resolve) => {
      rl.question(prompt, resolve)
    })
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new PortfolioSetup()
  setup.run().catch(console.error)
}

module.exports = PortfolioSetup

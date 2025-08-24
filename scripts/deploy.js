#!/usr/bin/env node

/**
 * Portfolio CMS Deployment Script
 * Automated deployment to various platforms
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const readline = require('readline')

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

class PortfolioDeployer {
  constructor() {
    this.configPath = path.join(__dirname, '../config')
    this.platforms = {
      vercel: {
        name: 'Vercel',
        description: 'Recommended for Next.js apps',
        command: 'vercel --prod',
        setup: this.setupVercel.bind(this)
      },
      netlify: {
        name: 'Netlify',
        description: 'Great for static sites',
        command: 'netlify deploy --prod --dir=.next',
        setup: this.setupNetlify.bind(this)
      },
      railway: {
        name: 'Railway',
        description: 'Full-stack deployment',
        command: 'railway up',
        setup: this.setupRailway.bind(this)
      },
      docker: {
        name: 'Docker',
        description: 'Containerized deployment',
        command: 'docker build -t portfolio-cms .',
        setup: this.setupDocker.bind(this)
      }
    }
  }

  async run() {
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║                Portfolio CMS Deployment                     ║
║              Deploy your portfolio anywhere!                ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`)

    try {
      await this.checkPrerequisites()
      const platform = await this.selectPlatform()
      await this.prepareBuild()
      await this.platforms[platform].setup()
      await this.deploy(platform)
      await this.showSuccessMessage(platform)
    } catch (error) {
      console.error(`${colors.red}Deployment failed: ${error.message}${colors.reset}`)
      process.exit(1)
    } finally {
      rl.close()
    }
  }

  async checkPrerequisites() {
    console.log(`${colors.blue}${colors.bright}🔍 Checking Prerequisites${colors.reset}`)

    // Check if portfolio is configured
    const setupFile = path.join(this.configPath, 'setup.json')
    if (!fs.existsSync(setupFile)) {
      throw new Error('Portfolio not configured. Please run "npm run setup" first.')
    }

    const setup = JSON.parse(fs.readFileSync(setupFile, 'utf8'))
    if (!setup.setup.isConfigured) {
      throw new Error('Portfolio not configured. Please run "npm run setup" first.')
    }

    // Check if .env.local exists
    const envFile = path.join(__dirname, '../.env.local')
    if (!fs.existsSync(envFile)) {
      console.log(`${colors.yellow}⚠️  No .env.local file found. Creating from template...${colors.reset}`)
      await this.createEnvFile()
    }

    console.log(`${colors.green}✓ Prerequisites checked${colors.reset}\n`)
  }

  async selectPlatform() {
    console.log(`${colors.blue}${colors.bright}🚀 Select Deployment Platform${colors.reset}`)
    console.log('Choose where you want to deploy your portfolio:\n')

    const platformKeys = Object.keys(this.platforms)
    platformKeys.forEach((key, index) => {
      const platform = this.platforms[key]
      console.log(`${index + 1}. ${platform.name} - ${platform.description}`)
    })

    const choice = await this.question('\nEnter your choice (1-4): ')
    const selectedIndex = parseInt(choice) - 1

    if (selectedIndex < 0 || selectedIndex >= platformKeys.length) {
      throw new Error('Invalid platform selection')
    }

    const selectedPlatform = platformKeys[selectedIndex]
    console.log(`${colors.green}✓ Selected ${this.platforms[selectedPlatform].name}${colors.reset}\n`)
    
    return selectedPlatform
  }

  async prepareBuild() {
    console.log(`${colors.blue}${colors.bright}🔨 Preparing Build${colors.reset}`)

    try {
      console.log('Installing dependencies...')
      execSync('npm install', { stdio: 'inherit' })

      console.log('Running tests...')
      execSync('npm test -- --passWithNoTests', { stdio: 'inherit' })

      console.log('Building application...')
      execSync('npm run build', { stdio: 'inherit' })

      console.log(`${colors.green}✓ Build prepared successfully${colors.reset}\n`)
    } catch (error) {
      throw new Error(`Build preparation failed: ${error.message}`)
    }
  }

  async setupVercel() {
    console.log(`${colors.blue}${colors.bright}⚡ Setting up Vercel Deployment${colors.reset}`)

    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'pipe' })
    } catch {
      console.log('Installing Vercel CLI...')
      execSync('npm install -g vercel', { stdio: 'inherit' })
    }

    // Login to Vercel
    const loginChoice = await this.question('Are you logged in to Vercel? (y/N): ')
    if (loginChoice.toLowerCase() !== 'y') {
      console.log('Please login to Vercel...')
      execSync('vercel login', { stdio: 'inherit' })
    }

    // Create vercel.json if it doesn't exist
    const vercelConfig = {
      "name": "portfolio-cms",
      "version": 2,
      "builds": [
        {
          "src": "package.json",
          "use": "@vercel/next"
        }
      ],
      "env": {
        "MONGODB_URI": "@mongodb-uri",
        "JWT_SECRET": "@jwt-secret",
        "OPENAI_API_KEY": "@openai-api-key"
      }
    }

    fs.writeFileSync(
      path.join(__dirname, '../vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    )

    console.log(`${colors.green}✓ Vercel setup complete${colors.reset}\n`)
  }

  async setupNetlify() {
    console.log(`${colors.blue}${colors.bright}🌐 Setting up Netlify Deployment${colors.reset}`)

    // Check if Netlify CLI is installed
    try {
      execSync('netlify --version', { stdio: 'pipe' })
    } catch {
      console.log('Installing Netlify CLI...')
      execSync('npm install -g netlify-cli', { stdio: 'inherit' })
    }

    // Login to Netlify
    const loginChoice = await this.question('Are you logged in to Netlify? (y/N): ')
    if (loginChoice.toLowerCase() !== 'y') {
      console.log('Please login to Netlify...')
      execSync('netlify login', { stdio: 'inherit' })
    }

    // Create netlify.toml
    const netlifyConfig = `[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  MONGODB_URI = "your-mongodb-uri"
  JWT_SECRET = "your-jwt-secret"
  OPENAI_API_KEY = "your-openai-key"
`

    fs.writeFileSync(path.join(__dirname, '../netlify.toml'), netlifyConfig)

    console.log(`${colors.green}✓ Netlify setup complete${colors.reset}\n`)
  }

  async setupRailway() {
    console.log(`${colors.blue}${colors.bright}🚂 Setting up Railway Deployment${colors.reset}`)

    // Check if Railway CLI is installed
    try {
      execSync('railway --version', { stdio: 'pipe' })
    } catch {
      console.log('Installing Railway CLI...')
      execSync('npm install -g @railway/cli', { stdio: 'inherit' })
    }

    // Login to Railway
    const loginChoice = await this.question('Are you logged in to Railway? (y/N): ')
    if (loginChoice.toLowerCase() !== 'y') {
      console.log('Please login to Railway...')
      execSync('railway login', { stdio: 'inherit' })
    }

    // Initialize Railway project
    execSync('railway link', { stdio: 'inherit' })

    console.log(`${colors.green}✓ Railway setup complete${colors.reset}\n`)
  }

  async setupDocker() {
    console.log(`${colors.blue}${colors.bright}🐳 Setting up Docker Deployment${colors.reset}`)

    // Create Dockerfile if it doesn't exist
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
`

    fs.writeFileSync(path.join(__dirname, '../Dockerfile'), dockerfile)

    // Create .dockerignore
    const dockerignore = `node_modules
.next
.git
.env.local
README.md
Dockerfile
.dockerignore
`

    fs.writeFileSync(path.join(__dirname, '../.dockerignore'), dockerignore)

    console.log(`${colors.green}✓ Docker setup complete${colors.reset}\n`)
  }

  async deploy(platform) {
    console.log(`${colors.blue}${colors.bright}🚀 Deploying to ${this.platforms[platform].name}${colors.reset}`)

    try {
      const command = this.platforms[platform].command
      execSync(command, { stdio: 'inherit' })
      console.log(`${colors.green}✓ Deployment successful${colors.reset}\n`)
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`)
    }
  }

  async showSuccessMessage(platform) {
    console.log(`${colors.green}${colors.bright}🎉 Deployment Complete!${colors.reset}`)
    
    const platformName = this.platforms[platform].name
    
    console.log(`
Your portfolio has been successfully deployed to ${platformName}!

${colors.cyan}Next Steps:${colors.reset}
1. Visit your deployed portfolio
2. Test all functionality
3. Update DNS settings if using custom domain
4. Set up monitoring and analytics
5. Share your amazing portfolio with the world!

${colors.yellow}💡 Pro Tips:${colors.reset}
• Set up automatic deployments from your Git repository
• Configure environment variables in your platform dashboard
• Enable HTTPS and custom domains
• Set up monitoring and error tracking

${colors.magenta}Need help? Check the documentation or create an issue on GitHub.${colors.reset}
`)
  }

  async createEnvFile() {
    const envTemplate = `# Portfolio CMS Environment Variables
# Copy this file to .env.local and update with your values

# Database
MONGODB_URI=mongodb://localhost:27017/portfolio-cms

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here

# OpenAI (optional)
OPENAI_API_KEY=your-openai-api-key-here

# App Configuration
NEXT_PUBLIC_APP_NAME="Your Portfolio"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Features
NEXT_PUBLIC_ENABLE_AI=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PWA=true
`

    fs.writeFileSync(path.join(__dirname, '../.env.local'), envTemplate)
    console.log(`${colors.green}✓ Created .env.local file${colors.reset}`)
  }

  question(prompt) {
    return new Promise((resolve) => {
      rl.question(prompt, resolve)
    })
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployer = new PortfolioDeployer()
  deployer.run().catch(console.error)
}

module.exports = PortfolioDeployer

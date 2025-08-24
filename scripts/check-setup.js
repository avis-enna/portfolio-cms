#!/usr/bin/env node

/**
 * Check Setup Script
 * Runs after npm install to check if portfolio is configured
 */

const fs = require('fs')
const path = require('path')

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

function checkSetup() {
  const configPath = path.join(__dirname, '../config')
  const setupFile = path.join(configPath, 'setup.json')
  
  // Check if config directory exists
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(configPath, { recursive: true })
  }
  
  // Check if setup is complete
  let isConfigured = false
  if (fs.existsSync(setupFile)) {
    try {
      const setup = JSON.parse(fs.readFileSync(setupFile, 'utf8'))
      isConfigured = setup.setup?.isConfigured || false
    } catch (error) {
      // Invalid setup file, treat as not configured
      isConfigured = false
    }
  }
  
  if (!isConfigured) {
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║                  Portfolio CMS Setup                        ║
║                                                              ║
║  Welcome! Your portfolio needs to be configured.            ║
║                                                              ║
║  Run one of these commands to get started:                  ║
║                                                              ║
║  📝 Interactive Setup:                                       ║
║     npm run setup                                            ║
║                                                              ║
║  🌐 Web-based Setup:                                         ║
║     npm run dev                                              ║
║     Then visit: http://localhost:3000/admin/setup           ║
║                                                              ║
║  🚀 Quick Deploy:                                            ║
║     npm run deploy                                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`)
  } else {
    console.log(`${colors.green}${colors.bright}
✅ Portfolio CMS is configured and ready!

🚀 Quick Commands:
   npm run dev     - Start development server
   npm run build   - Build for production
   npm run deploy  - Deploy to hosting platform

📊 Admin Dashboard: http://localhost:3000/admin
${colors.reset}`)
  }
}

// Only run if called directly (not during npm install in CI)
if (require.main === module && !process.env.CI) {
  checkSetup()
}

module.exports = checkSetup

#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Orchestrates all testing frameworks and generates unified reports
 */

const { execSync, spawn } = require('child_process')
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

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, skipped: 0 },
      e2e: { passed: 0, failed: 0, skipped: 0 },
      selenium: { passed: 0, failed: 0, skipped: 0 },
      cucumber: { passed: 0, failed: 0, skipped: 0 },
      accessibility: { passed: 0, failed: 0, skipped: 0 },
      performance: { passed: 0, failed: 0, skipped: 0 },
      visual: { passed: 0, failed: 0, skipped: 0 }
    }
    this.startTime = Date.now()
    this.outputDir = 'test-results'
    this.setupOutputDirectory()
  }

  setupOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
    
    // Create subdirectories
    const subdirs = ['unit', 'e2e', 'selenium', 'cucumber', 'accessibility', 'performance', 'visual', 'reports']
    subdirs.forEach(dir => {
      const dirPath = path.join(this.outputDir, dir)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
    })
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`)
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', command], {
        stdio: 'pipe',
        shell: true,
        ...options
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
        if (options.verbose) {
          process.stdout.write(data)
        }
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
        if (options.verbose) {
          process.stderr.write(data)
        }
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code })
        } else {
          reject({ stdout, stderr, code })
        }
      })
    })
  }

  parseTestResults(output, type) {
    // Parse different test output formats
    switch (type) {
      case 'jest':
        return this.parseJestResults(output)
      case 'playwright':
        return this.parsePlaywrightResults(output)
      case 'cucumber':
        return this.parseCucumberResults(output)
      default:
        return { passed: 0, failed: 0, skipped: 0 }
    }
  }

  parseJestResults(output) {
    const passedMatch = output.match(/(\d+) passed/)
    const failedMatch = output.match(/(\d+) failed/)
    const skippedMatch = output.match(/(\d+) skipped/)

    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0
    }
  }

  parsePlaywrightResults(output) {
    const passedMatch = output.match(/(\d+) passed/)
    const failedMatch = output.match(/(\d+) failed/)
    const skippedMatch = output.match(/(\d+) skipped/)

    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0
    }
  }

  parseCucumberResults(output) {
    const scenarioMatch = output.match(/(\d+) scenarios? \(([^)]+)\)/)
    if (!scenarioMatch) return { passed: 0, failed: 0, skipped: 0 }

    const details = scenarioMatch[2]
    const passedMatch = details.match(/(\d+) passed/)
    const failedMatch = details.match(/(\d+) failed/)
    const skippedMatch = details.match(/(\d+) skipped/)

    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0
    }
  }

  async runUnitTests() {
    this.log('\n🧪 Running Unit Tests...', 'cyan')
    try {
      const result = await this.runCommand('test', { verbose: true })
      this.results.unit = this.parseTestResults(result.stdout, 'jest')
      this.log('✅ Unit tests completed', 'green')
      return true
    } catch (error) {
      this.results.unit = this.parseTestResults(error.stdout, 'jest')
      this.log('❌ Unit tests failed', 'red')
      return false
    }
  }

  async runE2ETests() {
    this.log('\n🎭 Running E2E Tests (Playwright)...', 'cyan')
    try {
      const result = await this.runCommand('test:e2e', { verbose: true })
      this.results.e2e = this.parseTestResults(result.stdout, 'playwright')
      this.log('✅ E2E tests completed', 'green')
      return true
    } catch (error) {
      this.results.e2e = this.parseTestResults(error.stdout, 'playwright')
      this.log('❌ E2E tests failed', 'red')
      return false
    }
  }

  async runSeleniumTests() {
    this.log('\n🌐 Running Selenium Tests...', 'cyan')
    try {
      const result = await this.runCommand('test:selenium', { verbose: true })
      this.results.selenium = this.parseTestResults(result.stdout, 'jest')
      this.log('✅ Selenium tests completed', 'green')
      return true
    } catch (error) {
      this.results.selenium = this.parseTestResults(error.stdout, 'jest')
      this.log('❌ Selenium tests failed', 'red')
      return false
    }
  }

  async runCucumberTests() {
    this.log('\n🥒 Running Cucumber Tests...', 'cyan')
    try {
      const result = await this.runCommand('test:cucumber', { verbose: true })
      this.results.cucumber = this.parseCucumberResults(result.stdout, 'cucumber')
      this.log('✅ Cucumber tests completed', 'green')
      return true
    } catch (error) {
      this.results.cucumber = this.parseCucumberResults(error.stdout, 'cucumber')
      this.log('❌ Cucumber tests failed', 'red')
      return false
    }
  }

  async runAccessibilityTests() {
    this.log('\n♿ Running Accessibility Tests...', 'cyan')
    try {
      const result = await this.runCommand('test:accessibility', { verbose: true })
      this.results.accessibility = this.parseTestResults(result.stdout, 'playwright')
      this.log('✅ Accessibility tests completed', 'green')
      return true
    } catch (error) {
      this.results.accessibility = this.parseTestResults(error.stdout, 'playwright')
      this.log('❌ Accessibility tests failed', 'red')
      return false
    }
  }

  async runPerformanceTests() {
    this.log('\n⚡ Running Performance Tests...', 'cyan')
    try {
      const result = await this.runCommand('test:performance', { verbose: true })
      this.results.performance = this.parseTestResults(result.stdout, 'playwright')
      this.log('✅ Performance tests completed', 'green')
      return true
    } catch (error) {
      this.results.performance = this.parseTestResults(error.stdout, 'playwright')
      this.log('❌ Performance tests failed', 'red')
      return false
    }
  }

  async runVisualTests() {
    this.log('\n👁️ Running Visual Regression Tests...', 'cyan')
    try {
      const result = await this.runCommand('test:visual', { verbose: true })
      this.results.visual = this.parseTestResults(result.stdout, 'playwright')
      this.log('✅ Visual tests completed', 'green')
      return true
    } catch (error) {
      this.results.visual = this.parseTestResults(error.stdout, 'playwright')
      this.log('❌ Visual tests failed', 'red')
      return false
    }
  }

  generateUnifiedReport() {
    const endTime = Date.now()
    const duration = endTime - this.startTime
    
    const totalPassed = Object.values(this.results).reduce((sum, result) => sum + result.passed, 0)
    const totalFailed = Object.values(this.results).reduce((sum, result) => sum + result.failed, 0)
    const totalSkipped = Object.values(this.results).reduce((sum, result) => sum + result.skipped, 0)
    const totalTests = totalPassed + totalFailed + totalSkipped

    const report = {
      summary: {
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        passRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0,
        duration: duration,
        timestamp: new Date().toISOString()
      },
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!(process.env.CI || process.env.GITHUB_ACTIONS)
      }
    }

    // Save JSON report
    fs.writeFileSync(
      path.join(this.outputDir, 'reports', 'unified-report.json'),
      JSON.stringify(report, null, 2)
    )

    // Generate HTML report
    this.generateHTMLReport(report)

    return report
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio CMS Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .metric.passed { border-left-color: #28a745; }
        .metric.failed { border-left-color: #dc3545; }
        .metric.skipped { border-left-color: #ffc107; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #6c757d; font-size: 0.9em; }
        .results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .test-category { background: #f8f9fa; border-radius: 8px; padding: 20px; }
        .test-category h3 { margin-top: 0; color: #495057; }
        .test-stats { display: flex; justify-content: space-between; margin-top: 15px; }
        .stat { text-align: center; }
        .stat-value { font-size: 1.5em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Portfolio CMS Test Report</h1>
            <p>Generated on ${new Date(report.summary.timestamp).toLocaleString()}</p>
            <p>Duration: ${(report.summary.duration / 1000).toFixed(2)}s</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="metric">
                    <div class="metric-value">${report.summary.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric passed">
                    <div class="metric-value">${report.summary.passed}</div>
                    <div class="metric-label">Passed</div>
                </div>
                <div class="metric failed">
                    <div class="metric-value">${report.summary.failed}</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric skipped">
                    <div class="metric-value">${report.summary.skipped}</div>
                    <div class="metric-label">Skipped</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${report.summary.passRate}%</div>
                    <div class="metric-label">Pass Rate</div>
                </div>
            </div>
            
            <div class="results-grid">
                ${Object.entries(report.results).map(([category, results]) => `
                    <div class="test-category">
                        <h3>${category.charAt(0).toUpperCase() + category.slice(1)} Tests</h3>
                        <div class="test-stats">
                            <div class="stat">
                                <div class="stat-value passed">${results.passed}</div>
                                <div>Passed</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value failed">${results.failed}</div>
                                <div>Failed</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value skipped">${results.skipped}</div>
                                <div>Skipped</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="footer">
            <p>Portfolio CMS Test Suite | Node.js ${report.environment.nodeVersion} | ${report.environment.platform}</p>
        </div>
    </div>
</body>
</html>`

    fs.writeFileSync(
      path.join(this.outputDir, 'reports', 'unified-report.html'),
      html
    )
  }

  printSummary(report) {
    this.log('\n' + '='.repeat(80), 'cyan')
    this.log('📊 TEST SUMMARY', 'bright')
    this.log('='.repeat(80), 'cyan')
    
    this.log(`\n📈 Overall Results:`, 'bright')
    this.log(`   Total Tests: ${report.summary.totalTests}`)
    this.log(`   ✅ Passed: ${report.summary.passed}`, 'green')
    this.log(`   ❌ Failed: ${report.summary.failed}`, 'red')
    this.log(`   ⏭️  Skipped: ${report.summary.skipped}`, 'yellow')
    this.log(`   📊 Pass Rate: ${report.summary.passRate}%`)
    this.log(`   ⏱️  Duration: ${(report.summary.duration / 1000).toFixed(2)}s`)

    this.log(`\n📋 Test Categories:`, 'bright')
    Object.entries(report.results).forEach(([category, results]) => {
      const total = results.passed + results.failed + results.skipped
      if (total > 0) {
        this.log(`   ${category.padEnd(15)}: ${results.passed}✅ ${results.failed}❌ ${results.skipped}⏭️`)
      }
    })

    this.log(`\n📁 Reports Generated:`, 'bright')
    this.log(`   📄 HTML Report: ${path.join(this.outputDir, 'reports', 'unified-report.html')}`)
    this.log(`   📊 JSON Report: ${path.join(this.outputDir, 'reports', 'unified-report.json')}`)
    
    if (report.summary.failed > 0) {
      this.log(`\n❌ Some tests failed. Check individual test reports for details.`, 'red')
    } else {
      this.log(`\n🎉 All tests passed! Great job!`, 'green')
    }
    
    this.log('\n' + '='.repeat(80), 'cyan')
  }

  async run(options = {}) {
    this.log('🚀 Starting Portfolio CMS Test Suite', 'bright')
    this.log(`📁 Output directory: ${this.outputDir}`, 'blue')

    const testSuites = [
      { name: 'unit', fn: this.runUnitTests.bind(this), enabled: options.unit !== false },
      { name: 'e2e', fn: this.runE2ETests.bind(this), enabled: options.e2e !== false },
      { name: 'selenium', fn: this.runSeleniumTests.bind(this), enabled: options.selenium !== false },
      { name: 'cucumber', fn: this.runCucumberTests.bind(this), enabled: options.cucumber !== false },
      { name: 'accessibility', fn: this.runAccessibilityTests.bind(this), enabled: options.accessibility !== false },
      { name: 'performance', fn: this.runPerformanceTests.bind(this), enabled: options.performance !== false },
      { name: 'visual', fn: this.runVisualTests.bind(this), enabled: options.visual !== false }
    ]

    let allPassed = true

    for (const suite of testSuites) {
      if (suite.enabled) {
        try {
          const passed = await suite.fn()
          if (!passed) allPassed = false
        } catch (error) {
          this.log(`❌ ${suite.name} tests encountered an error: ${error.message}`, 'red')
          allPassed = false
        }
      }
    }

    const report = this.generateUnifiedReport()
    this.printSummary(report)

    return allPassed
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const options = {}

  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--no-')) {
      const testType = arg.replace('--no-', '')
      options[testType] = false
    }
  })

  const runner = new TestRunner()
  runner.run(options)
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Test runner failed:', error)
      process.exit(1)
    })
}

module.exports = TestRunner

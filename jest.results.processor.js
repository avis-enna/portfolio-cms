/**
 * Jest Results Processor
 * Processes test results and generates custom reports
 */

const fs = require('fs')
const path = require('path')

module.exports = (results) => {
  // Create test results directory if it doesn't exist
  const resultsDir = path.join(__dirname, 'test-results')
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true })
  }

  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    testResults: {
      total: results.numTotalTests,
      passed: results.numPassedTests,
      failed: results.numFailedTests,
      pending: results.numPendingTests,
      todo: results.numTodoTests,
    },
    testSuites: {
      total: results.numTotalTestSuites,
      passed: results.numPassedTestSuites,
      failed: results.numFailedTestSuites,
      pending: results.numPendingTestSuites,
    },
    coverage: results.coverageMap ? {
      statements: results.coverageMap.getCoverageSummary().statements,
      branches: results.coverageMap.getCoverageSummary().branches,
      functions: results.coverageMap.getCoverageSummary().functions,
      lines: results.coverageMap.getCoverageSummary().lines,
    } : null,
    performance: {
      startTime: results.startTime,
      duration: Date.now() - results.startTime,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV,
    },
    failedTests: results.testResults
      .filter(testResult => testResult.numFailingTests > 0)
      .map(testResult => ({
        testFilePath: testResult.testFilePath,
        failureMessage: testResult.failureMessage,
        numFailingTests: testResult.numFailingTests,
        failedTests: testResult.testResults
          .filter(test => test.status === 'failed')
          .map(test => ({
            title: test.title,
            fullName: test.fullName,
            duration: test.duration,
            failureMessages: test.failureMessages,
          }))
      }))
  }

  // Write summary to file
  const summaryPath = path.join(resultsDir, 'test-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))

  // Generate markdown report
  const markdownReport = generateMarkdownReport(summary)
  const markdownPath = path.join(resultsDir, 'test-report.md')
  fs.writeFileSync(markdownPath, markdownReport)

  console.log(`📊 Test results saved to: ${resultsDir}`)
  
  return results
}

function generateMarkdownReport(summary) {
  const { testResults, testSuites, coverage, performance, failedTests } = summary
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1)
  const suitePassRate = ((testSuites.passed / testSuites.total) * 100).toFixed(1)
  
  return `# Test Report

## Summary
- **Generated**: ${summary.timestamp}
- **Duration**: ${(performance.duration / 1000).toFixed(2)}s
- **Environment**: ${summary.environment.nodeEnv} (Node ${summary.environment.nodeVersion})

## Test Results
| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Tests** | ${testResults.total} | 100% |
| **Passed** | ${testResults.passed} | ${passRate}% |
| **Failed** | ${testResults.failed} | ${((testResults.failed / testResults.total) * 100).toFixed(1)}% |
| **Pending** | ${testResults.pending} | ${((testResults.pending / testResults.total) * 100).toFixed(1)}% |

## Test Suites
| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Suites** | ${testSuites.total} | 100% |
| **Passed** | ${testSuites.passed} | ${suitePassRate}% |
| **Failed** | ${testSuites.failed} | ${((testSuites.failed / testSuites.total) * 100).toFixed(1)}% |

${coverage ? `## Coverage
| Type | Covered | Total | Percentage |
|------|---------|-------|------------|
| **Statements** | ${coverage.statements.covered} | ${coverage.statements.total} | ${coverage.statements.pct}% |
| **Branches** | ${coverage.branches.covered} | ${coverage.branches.total} | ${coverage.branches.pct}% |
| **Functions** | ${coverage.functions.covered} | ${coverage.functions.total} | ${coverage.functions.pct}% |
| **Lines** | ${coverage.lines.covered} | ${coverage.lines.total} | ${coverage.lines.pct}% |
` : ''}

${failedTests.length > 0 ? `## Failed Tests

${failedTests.map(suite => `### ${path.basename(suite.testFilePath)}

${suite.failedTests.map(test => `#### ${test.title}
- **Duration**: ${test.duration}ms
- **Error**: 
\`\`\`
${test.failureMessages.join('\n')}
\`\`\`
`).join('\n')}
`).join('\n')}` : '## ✅ All Tests Passed!'}

## Performance
- **Start Time**: ${new Date(performance.startTime).toISOString()}
- **Total Duration**: ${(performance.duration / 1000).toFixed(2)} seconds
- **Average Test Duration**: ${(performance.duration / testResults.total).toFixed(2)}ms per test

## Environment Details
- **Node Version**: ${summary.environment.nodeVersion}
- **Platform**: ${summary.environment.platform}
- **Architecture**: ${summary.environment.arch}
- **Environment**: ${summary.environment.nodeEnv}
`
}

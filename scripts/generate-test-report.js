#!/usr/bin/env node

/**
 * Test Report Generator for Prices as Code
 * 
 * This script runs tests and generates a comprehensive test report
 * showing coverage, test results, and areas that need improvement.
 * 
 * Usage:
 *   node scripts/generate-test-report.js [--unit|--integration|--e2e|--all]
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert exec to promise-based
const execAsync = util.promisify(exec);

// Parse arguments
const args = process.argv.slice(2);
const runUnit = args.includes('--unit') || args.includes('--all') || args.length === 0;
const runIntegration = args.includes('--integration') || args.includes('--all');
const runE2e = args.includes('--e2e') || args.includes('--all');
const skipTests = args.includes('--skip-tests');

// Create output directory
const reportDir = path.join(process.cwd(), 'test-reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Report file paths
const reportPath = path.join(reportDir, 'test-report.md');
const summaryPath = path.join(reportDir, 'summary.json');

/**
 * Run tests and collect coverage
 */
async function runTests() {
  console.log('🧪 Running tests with coverage...');
  
  let command = '';
  
  if (runUnit && !runIntegration && !runE2e) {
    command = 'npm run test:unit -- --coverage';
  } else if (runIntegration && !runUnit && !runE2e) {
    command = 'npm run test:integration -- --coverage';
  } else if (runE2e && !runUnit && !runIntegration) {
    command = 'npm run test:e2e -- --coverage';
  } else {
    command = 'npm run test:coverage';
  }
  
  try {
    const { stdout, stderr } = await execAsync(command);
    console.log('✅ Tests completed successfully');
    return { stdout, stderr, success: true };
  } catch (error) {
    console.error('❌ Test run failed:', error.message);
    return { 
      stdout: error.stdout, 
      stderr: error.stderr, 
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse coverage results from lcov-report/index.html
 */
function parseCoverageResults() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'lcov-report', 'index.html');
  
  if (!fs.existsSync(coveragePath)) {
    console.error('❌ Coverage report not found. Tests may have failed to generate coverage data.');
    return null;
  }
  
  const coverageHtml = fs.readFileSync(coveragePath, 'utf8');
  
  // Extract coverage percentages using regex
  const statementMatch = coverageHtml.match(/statements.*?(\d+(?:\.\d+)?)%/i);
  const branchMatch = coverageHtml.match(/branches.*?(\d+(?:\.\d+)?)%/i);
  const functionMatch = coverageHtml.match(/functions.*?(\d+(?:\.\d+)?)%/i);
  const lineMatch = coverageHtml.match(/lines.*?(\d+(?:\.\d+)?)%/i);
  
  return {
    statements: statementMatch ? parseFloat(statementMatch[1]) : 0,
    branches: branchMatch ? parseFloat(branchMatch[1]) : 0,
    functions: functionMatch ? parseFloat(functionMatch[1]) : 0,
    lines: lineMatch ? parseFloat(lineMatch[1]) : 0
  };
}

/**
 * Count test files by category
 */
function countTestFiles() {
  const testsDir = path.join(process.cwd(), 'src', '__tests__');
  const unitDir = path.join(testsDir, 'unit');
  const integrationDir = path.join(testsDir, 'integration');
  const e2eDir = path.join(testsDir, 'e2e');
  
  function countFiles(dir) {
    if (!fs.existsSync(dir)) return 0;
    
    let count = 0;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        count += countFiles(path.join(dir, item.name));
      } else if (item.name.endsWith('.ts') && item.name.includes('test')) {
        count++;
      }
    }
    
    return count;
  }
  
  return {
    unit: countFiles(unitDir),
    integration: countFiles(integrationDir),
    e2e: countFiles(e2eDir),
    total: countFiles(testsDir)
  };
}

/**
 * Generate markdown report
 */
function generateReport(testResult, coverage, testCounts) {
  const timestamp = new Date().toISOString();
  const packageInfo = require(path.join(process.cwd(), 'package.json'));
  
  let report = `# Prices as Code - Test Report\n\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n`;
  report += `**Version:** ${packageInfo.version}\n\n`;
  
  // Test run information
  report += `## Test Run Summary\n\n`;
  report += `- **Status:** ${testResult.success ? '✅ Passed' : '❌ Failed'}\n`;
  report += `- **Test Types Run:**\n`;
  report += `  - Unit Tests: ${runUnit ? '✅' : '❌'}\n`;
  report += `  - Integration Tests: ${runIntegration ? '✅' : '❌'}\n`;
  report += `  - End-to-End Tests: ${runE2e ? '✅' : '❌'}\n\n`;
  
  // Coverage information
  if (coverage) {
    report += `## Coverage Results\n\n`;
    report += `| Metric | Coverage |\n`;
    report += `|--------|----------|\n`;
    report += `| Statements | ${coverage.statements}% |\n`;
    report += `| Branches | ${coverage.branches}% |\n`;
    report += `| Functions | ${coverage.functions}% |\n`;
    report += `| Lines | ${coverage.lines}% |\n\n`;
    
    // Coverage assessment
    const avgCoverage = (coverage.statements + coverage.branches + coverage.functions + coverage.lines) / 4;
    let assessment = '';
    
    if (avgCoverage >= 90) {
      assessment = '✅ Excellent coverage. Maintain this level for high quality.';
    } else if (avgCoverage >= 80) {
      assessment = '✅ Good coverage. Consider improving branch coverage.';
    } else if (avgCoverage >= 70) {
      assessment = '⚠️ Moderate coverage. More tests needed for better reliability.';
    } else {
      assessment = '❌ Low coverage. Significantly more tests are required.';
    }
    
    report += `**Assessment:** ${assessment}\n\n`;
  }
  
  // Test statistics
  report += `## Test Statistics\n\n`;
  report += `- **Total Test Files:** ${testCounts.total}\n`;
  report += `  - Unit Test Files: ${testCounts.unit}\n`;
  report += `  - Integration Test Files: ${testCounts.integration}\n`;
  report += `  - End-to-End Test Files: ${testCounts.e2e}\n\n`;
  
  // Save summary data
  const summary = {
    timestamp,
    version: packageInfo.version,
    success: testResult.success,
    coverage: coverage || null,
    testCounts
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  return report;
}

/**
 * Main function
 */
async function main() {
  console.log('📊 Generating test report...');
  
  // Get test file counts
  const testCounts = countTestFiles();
  
  let testResult = { success: true, stdout: '', stderr: '' };
  
  if (!skipTests) {
    // Run tests
    testResult = await runTests();
  }
  
  // Parse coverage results
  const coverage = parseCoverageResults();
  
  // Generate report
  const report = generateReport(testResult, coverage, testCounts);
  
  // Save report
  fs.writeFileSync(reportPath, report);
  
  console.log(`✅ Test report generated: ${reportPath}`);
}

// Run the main function
main().catch(error => {
  console.error('Error generating test report:', error);
  process.exit(1);
});
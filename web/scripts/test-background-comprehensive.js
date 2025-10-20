#!/usr/bin/env node

/**
 * Comprehensive Background Testing Script
 * 
 * Runs both Jest and Playwright tests continuously in the background
 * while you work on fixing them. Provides real-time feedback and progress tracking.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class ComprehensiveBackgroundTester {
  constructor() {
    this.startTime = Date.now();
    this.activeProcesses = new Map();
    this.testResults = {
      jest: { passed: 0, failed: 0, total: 0, runs: 0 },
      playwright: { passed: 0, failed: 0, total: 0, runs: 0 }
    };
    this.isRunning = false;
    this.watchMode = false;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;
    
    switch (type) {
      case 'success':
        console.log(chalk.green(`${prefix} ✅ ${message}`));
        break;
      case 'error':
        console.log(chalk.red(`${prefix} ❌ ${message}`));
        break;
      case 'warning':
        console.log(chalk.yellow(`${prefix} ⚠️  ${message}`));
        break;
      case 'info':
        console.log(chalk.blue(`${prefix} ℹ️  ${message}`));
        break;
      case 'progress':
        console.log(chalk.cyan(`${prefix} 🚀 ${message}`));
        break;
      case 'background':
        console.log(chalk.magenta(`${prefix} 🔄 ${message}`));
        break;
      case 'jest':
        console.log(chalk.blue(`${prefix} 🧪 ${message}`));
        break;
      case 'playwright':
        console.log(chalk.green(`${prefix} 🎭 ${message}`));
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  displayHeader() {
    console.log(chalk.bold.blue('\n🧪 COMPREHENSIVE BACKGROUND TESTING'));
    console.log(chalk.gray('=' .repeat(60)));
    console.log(chalk.gray(`Started at: ${new Date().toLocaleString()}`));
    console.log(chalk.gray('Running Jest and Playwright tests continuously in the background'));
    console.log(chalk.gray('You can work on fixing tests while they run!'));
    console.log(chalk.gray('=' .repeat(60)));
  }

  displayStats() {
    const duration = Date.now() - this.startTime;
    const jestSuccessRate = this.testResults.jest.total > 0 ? 
      ((this.testResults.jest.passed / this.testResults.jest.total) * 100).toFixed(1) : 0;
    const playwrightSuccessRate = this.testResults.playwright.total > 0 ? 
      ((this.testResults.playwright.passed / this.testResults.playwright.total) * 100).toFixed(1) : 0;
    
    console.log(chalk.bold.blue('\n📊 BACKGROUND TESTING STATISTICS'));
    console.log(chalk.gray('=' .repeat(50)));
    console.log(chalk.gray(`Total Duration: ${(duration / 1000 / 60).toFixed(1)} minutes`));
    
    console.log(chalk.bold('\n🧪 Jest Results:'));
    console.log(chalk.gray(`  Runs: ${this.testResults.jest.runs}`));
    console.log(chalk.gray(`  Passed: ${this.testResults.jest.passed}`));
    console.log(chalk.gray(`  Failed: ${this.testResults.jest.failed}`));
    console.log(chalk.gray(`  Total: ${this.testResults.jest.total}`));
    console.log(chalk.gray(`  Success Rate: ${jestSuccessRate}%`));
    
    console.log(chalk.bold('\n🎭 Playwright Results:'));
    console.log(chalk.gray(`  Runs: ${this.testResults.playwright.runs}`));
    console.log(chalk.gray(`  Passed: ${this.testResults.playwright.passed}`));
    console.log(chalk.gray(`  Failed: ${this.testResults.playwright.failed}`));
    console.log(chalk.gray(`  Total: ${this.testResults.playwright.total}`));
    console.log(chalk.gray(`  Success Rate: ${playwrightSuccessRate}%`));
    
    const totalPassed = this.testResults.jest.passed + this.testResults.playwright.passed;
    const totalFailed = this.testResults.jest.failed + this.testResults.playwright.failed;
    const totalTests = totalPassed + totalFailed;
    const overallSuccessRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(chalk.bold('\n📈 Overall Results:'));
    console.log(chalk.gray(`  Total Tests: ${totalTests}`));
    console.log(chalk.gray(`  Success Rate: ${overallSuccessRate}%`));
    console.log(chalk.gray(`  Passed: ${totalPassed}`));
    console.log(chalk.gray(`  Failed: ${totalFailed}`));
  }

  async runJestBackground(category = 'all') {
    this.log(`Starting Jest background tests for: ${category}`, 'jest');
    
    const command = category === 'all' 
      ? 'npx jest --config=jest.config.background.js'
      : `npx jest --config=jest.config.background.js --testPathPattern=${category}`;

    const process = spawn('npx', command.split(' ').slice(1), {
      stdio: 'pipe',
      shell: true
    });

    this.activeProcesses.set('jest', process);

    process.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('PASS')) {
        this.testResults.jest.passed++;
        this.testResults.jest.total++;
        this.log(`Jest test passed: ${this.extractTestName(text)}`, 'success');
      } else if (text.includes('FAIL')) {
        this.testResults.jest.failed++;
        this.testResults.jest.total++;
        this.log(`Jest test failed: ${this.extractTestName(text)}`, 'error');
      } else if (text.includes('Test Suites:')) {
        this.testResults.jest.runs++;
        this.log(`Jest test run #${this.testResults.jest.runs} completed`, 'jest');
      }
    });

    process.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('error')) {
        this.log(`Jest error: ${text.trim()}`, 'error');
      }
    });

    process.on('close', (code) => {
      this.activeProcesses.delete('jest');
      this.log(`Jest background tests completed with code: ${code}`, 'jest');
      
      // Restart Jest tests if not in watch mode
      if (!this.watchMode && this.isRunning) {
        setTimeout(() => {
          this.log('Restarting Jest background tests...', 'jest');
          this.runJestBackground(category);
        }, 5000);
      }
    });

    return process;
  }

  async runPlaywrightBackground(category = 'all') {
    this.log(`Starting Playwright background tests for: ${category}`, 'playwright');
    
    const command = category === 'all'
      ? 'npx playwright test --config=tests/playwright/configs/playwright.config.inline.ts'
      : `npx playwright test tests/playwright/e2e/${category}/ --config=tests/playwright/configs/playwright.config.inline.ts`;

    const process = spawn('npx', command.split(' ').slice(1), {
      stdio: 'pipe',
      shell: true
    });

    this.activeProcesses.set('playwright', process);

    process.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('✓')) {
        this.testResults.playwright.passed++;
        this.testResults.playwright.total++;
        this.log(`Playwright test passed: ${this.extractTestName(text)}`, 'success');
      } else if (text.includes('✘')) {
        this.testResults.playwright.failed++;
        this.testResults.playwright.total++;
        this.log(`Playwright test failed: ${this.extractTestName(text)}`, 'error');
      } else if (text.includes('Running')) {
        this.testResults.playwright.runs++;
        this.log(`Playwright test run #${this.testResults.playwright.runs} started`, 'playwright');
      }
    });

    process.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('error')) {
        this.log(`Playwright error: ${text.trim()}`, 'error');
      }
    });

    process.on('close', (code) => {
      this.activeProcesses.delete('playwright');
      this.log(`Playwright background tests completed with code: ${code}`, 'playwright');
      
      // Restart Playwright tests if not in watch mode
      if (!this.watchMode && this.isRunning) {
        setTimeout(() => {
          this.log('Restarting Playwright background tests...', 'playwright');
          this.runPlaywrightBackground(category);
        }, 5000);
      }
    });

    return process;
  }

  extractTestName(text) {
    const match = text.match(/(PASS|FAIL|✓|✘)\s+(.+?)(?:\s+\(|$)/);
    return match ? match[2] : 'Unknown test';
  }

  async runComprehensiveBackground(jestCategory = 'all', playwrightCategory = 'all') {
    this.displayHeader();
    this.isRunning = true;
    
    this.log('Starting comprehensive background testing...', 'progress');
    
    // Start Jest background tests
    const jestProcess = await this.runJestBackground(jestCategory);
    
    // Start Playwright background tests
    const playwrightProcess = await this.runPlaywrightBackground(playwrightCategory);
    
    this.log('Both Jest and Playwright tests are running in parallel', 'success');
    this.log('You can work on fixing tests while they run in the background!', 'info');
    
    // Monitor processes
    this.monitorProcesses();
  }

  monitorProcesses() {
    const interval = setInterval(() => {
      // Display stats every 30 seconds
      if (Date.now() - this.startTime > 30000 && (Date.now() - this.startTime) % 30000 < 1000) {
        this.displayStats();
      }
      
      if (!this.isRunning && this.activeProcesses.size === 0) {
        clearInterval(interval);
        this.displayStats();
      }
    }, 1000);

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Stopping all background tests...'));
      this.isRunning = false;
      this.activeProcesses.forEach((process, name) => {
        this.log(`Stopping ${name} tests...`, 'warning');
        process.kill('SIGTERM');
      });
      clearInterval(interval);
      this.displayStats();
      process.exit(0);
    });
  }

  stopAllTests() {
    this.log('Stopping all background tests...', 'warning');
    this.isRunning = false;
    this.activeProcesses.forEach((process, name) => {
      this.log(`Stopping ${name} tests...`, 'warning');
      process.kill('SIGTERM');
    });
    this.activeProcesses.clear();
  }

  showStatus() {
    if (this.isRunning) {
      this.log('Background tests are running', 'success');
      this.displayStats();
    } else {
      this.log('Background tests are not running', 'warning');
    }
  }

  showHelp() {
    console.log(chalk.bold.blue('\n🧪 Comprehensive Background Testing Help'));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.gray('  node scripts/test-background-comprehensive.js                    # Run all tests continuously'));
    console.log(chalk.gray('  node scripts/test-background-comprehensive.js jest unit          # Run Jest unit tests continuously'));
    console.log(chalk.gray('  node scripts/test-background-comprehensive.js playwright core   # Run Playwright core tests continuously'));
    console.log(chalk.gray('  node scripts/test-background-comprehensive.js parallel           # Run both Jest and Playwright in parallel'));
    console.log(chalk.gray('  node scripts/test-background-comprehensive.js --watch           # Run in watch mode'));
    console.log(chalk.gray('  node scripts/test-background-comprehensive.js --stop            # Stop all background tests'));
    console.log(chalk.gray('  node scripts/test-background-comprehensive.js --status          # Show current status'));
    console.log(chalk.gray('\nAvailable Jest categories:'));
    console.log(chalk.gray('  unit, integration, performance, security, accessibility, compatibility, monitoring'));
    console.log(chalk.gray('\nAvailable Playwright categories:'));
    console.log(chalk.gray('  core, features, performance, accessibility, security, compatibility, monitoring'));
    console.log(chalk.gray('\nBackground Testing Features:'));
    console.log(chalk.gray('  • Continuous test execution'));
    console.log(chalk.gray('  • Parallel Jest and Playwright execution'));
    console.log(chalk.gray('  • Real-time progress tracking'));
    console.log(chalk.gray('  • Automatic restart on completion'));
    console.log(chalk.gray('  • Watch mode for file changes'));
    console.log(chalk.gray('  • Performance statistics'));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const tester = new ComprehensiveBackgroundTester();
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    tester.showHelp();
    return;
  }
  
  if (args[0] === '--stop') {
    tester.stopAllTests();
    return;
  }
  
  if (args[0] === '--status') {
    tester.showStatus();
    return;
  }
  
  const command = args[0];
  const jestCategory = args[1] || 'all';
  const playwrightCategory = args[2] || 'all';
  
  // Handle watch mode
  if (args.includes('--watch')) {
    tester.watchMode = true;
  }
  
  switch (command) {
    case 'jest':
      await tester.runJestBackground(jestCategory);
      break;
    case 'playwright':
      await tester.runPlaywrightBackground(playwrightCategory);
      break;
    case 'parallel':
      await tester.runComprehensiveBackground(jestCategory, playwrightCategory);
      break;
    default:
      // Default to parallel execution
      await tester.runComprehensiveBackground(jestCategory, playwrightCategory);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ComprehensiveBackgroundTester };

#!/usr/bin/env node

/**
 * Inline Test Execution Script
 * 
 * Ensures immediate test results without hanging on HTML reports
 * or "you can get results from..." messages.
 */

const { execSync, spawn } = require('child_process');
const chalk = require('chalk');

class InlineTestRunner {
  constructor() {
    this.startTime = Date.now();
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
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  displayHeader() {
    console.log(chalk.bold.blue('\n🧪 CHOICES PLATFORM - INLINE TEST EXECUTION'));
    console.log(chalk.gray('=' .repeat(50)));
    console.log(chalk.gray(`Started at: ${new Date().toLocaleString()}`));
    console.log(chalk.gray('Using inline reporting - NO HANGING REPORTS'));
    console.log(chalk.gray('=' .repeat(50)));
  }

  async runTests(category = 'all') {
    this.displayHeader();
    
    try {
      let command;
      
      if (category === 'all') {
        command = 'npx playwright test --config=tests/playwright/configs/playwright.config.inline.ts';
      } else {
        command = `npx playwright test tests/playwright/e2e/${category}/ --config=tests/playwright/configs/playwright.config.inline.ts`;
      }
      
      this.log(`Executing: ${command}`, 'progress');
      
      // Execute with real-time output
      const result = await this.executeCommand(command);
      const duration = Date.now() - this.startTime;
      
      if (result.exitCode === 0) {
        this.log(`Tests completed successfully in ${(duration / 1000).toFixed(2)}s`, 'success');
      } else {
        this.log(`Tests failed with exit code ${result.exitCode}`, 'error');
      }
      
      this.log(`Total execution time: ${(duration / 1000).toFixed(2)}s`, 'info');
      
    } catch (error) {
      this.log(`Error running tests: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  executeCommand(command) {
    return new Promise((resolve) => {
      const child = spawn('npx', command.split(' ').slice(1), {
        stdio: 'inherit', // This ensures real-time output
        shell: true
      });
      
      child.on('close', (code) => {
        resolve({
          exitCode: code
        });
      });
      
      child.on('error', (error) => {
        resolve({
          exitCode: 1,
          error: error.message
        });
      });
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new InlineTestRunner();
  
  const category = args[0] || 'all';
  
  if (category === '--help' || category === '-h') {
    console.log(chalk.bold.blue('\n🧪 Inline Test Runner'));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.gray('  node scripts/test-inline.js                    # Run all tests'));
    console.log(chalk.gray('  node scripts/test-inline.js core              # Run core tests'));
    console.log(chalk.gray('  node scripts/test-inline.js features          # Run feature tests'));
    console.log(chalk.gray('  node scripts/test-inline.js performance       # Run performance tests'));
    console.log(chalk.gray('\nAvailable categories:'));
    console.log(chalk.gray('  core, features, performance, accessibility, security, compatibility, monitoring'));
    return;
  }
  
  await runner.runTests(category);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { InlineTestRunner };

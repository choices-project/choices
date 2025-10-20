#!/usr/bin/env node

/**
 * Jest Background Testing Script
 * 
 * Runs Jest tests continuously in the background while you work on fixing them.
 * Provides real-time feedback and progress tracking.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class JestBackgroundRunner {
  constructor() {
    this.isRunning = false;
    this.currentRun = null;
    this.testResults = [];
    this.startTime = Date.now();
    this.runCount = 0;
    this.passCount = 0;
    this.failCount = 0;
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
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  displayHeader() {
    console.log(chalk.bold.blue('\n🧪 JEST BACKGROUND TESTING'));
    console.log(chalk.gray('=' .repeat(50)));
    console.log(chalk.gray(`Started at: ${new Date().toLocaleString()}`));
    console.log(chalk.gray('Running tests continuously in the background'));
    console.log(chalk.gray('You can work on fixing tests while they run!'));
    console.log(chalk.gray('=' .repeat(50)));
  }

  displayStats() {
    const duration = Date.now() - this.startTime;
    const successRate = this.runCount > 0 ? ((this.passCount / this.runCount) * 100).toFixed(1) : 0;
    
    console.log(chalk.bold.blue('\n📊 BACKGROUND TESTING STATS'));
    console.log(chalk.gray('=' .repeat(40)));
    console.log(chalk.gray(`Total Runs: ${this.runCount}`));
    console.log(chalk.gray(`Passed: ${this.passCount}`));
    console.log(chalk.gray(`Failed: ${this.failCount}`));
    console.log(chalk.gray(`Success Rate: ${successRate}%`));
    console.log(chalk.gray(`Duration: ${(duration / 1000 / 60).toFixed(1)} minutes`));
    console.log(chalk.gray('=' .repeat(40)));
  }

  async runTests(category = 'all', watchMode = false) {
    this.watchMode = watchMode;
    
    if (this.isRunning) {
      this.log('Tests are already running in the background', 'warning');
      return;
    }

    this.displayHeader();
    this.isRunning = true;

    try {
      let command;
      
      if (watchMode) {
        command = 'npx jest --config=jest.config.background.js --watch --watchAll=false';
        this.log('Starting Jest in watch mode - tests will re-run on file changes', 'background');
      } else {
        if (category === 'all') {
          command = 'npx jest --config=jest.config.background.js';
        } else {
          command = `npx jest --config=jest.config.background.js --testPathPattern=${category}`;
        }
        this.log(`Running Jest tests for category: ${category}`, 'progress');
      }

      this.currentRun = spawn('npx', command.split(' ').slice(1), {
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      let errorOutput = '';

      this.currentRun.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // Parse Jest output for real-time feedback
        if (text.includes('PASS')) {
          this.passCount++;
          this.log(`Test passed: ${this.extractTestName(text)}`, 'success');
        } else if (text.includes('FAIL')) {
          this.failCount++;
          this.log(`Test failed: ${this.extractTestName(text)}`, 'error');
        } else if (text.includes('Test Suites:')) {
          this.log('Test suite completed', 'info');
        } else if (text.includes('Tests:')) {
          this.runCount++;
          this.log(`Test run #${this.runCount} completed`, 'background');
        }
      });

      this.currentRun.stderr.on('data', (data) => {
        errorOutput += data.toString();
        if (data.toString().includes('error')) {
          this.log(`Jest error: ${data.toString().trim()}`, 'error');
        }
      });

      this.currentRun.on('close', (code) => {
        this.isRunning = false;
        this.currentRun = null;
        
        if (code === 0) {
          this.log('Background test run completed successfully', 'success');
        } else {
          this.log(`Background test run failed with exit code ${code}`, 'error');
        }
        
        this.displayStats();
        
        // If not in watch mode, restart after a delay
        if (!watchMode) {
          setTimeout(() => {
            this.log('Restarting background tests...', 'background');
            this.runTests(category, watchMode);
          }, 5000); // 5 second delay between runs
        }
      });

      this.currentRun.on('error', (error) => {
        this.log(`Error running Jest: ${error.message}`, 'error');
        this.isRunning = false;
        this.currentRun = null;
      });

    } catch (error) {
      this.log(`Error starting background tests: ${error.message}`, 'error');
      this.isRunning = false;
    }
  }

  extractTestName(text) {
    // Extract test name from Jest output
    const match = text.match(/(PASS|FAIL)\s+(.+?)(?:\s+\(|$)/);
    return match ? match[2] : 'Unknown test';
  }

  stopTests() {
    if (this.currentRun) {
      this.log('Stopping background tests...', 'warning');
      this.currentRun.kill('SIGTERM');
      this.isRunning = false;
      this.currentRun = null;
    } else {
      this.log('No tests are currently running', 'info');
    }
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
    console.log(chalk.bold.blue('\n🧪 Jest Background Testing Help'));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.gray('  node scripts/jest-background.js                    # Run all tests continuously'));
    console.log(chalk.gray('  node scripts/jest-background.js unit              # Run unit tests continuously'));
    console.log(chalk.gray('  node scripts/jest-background.js integration      # Run integration tests continuously'));
    console.log(chalk.gray('  node scripts/jest-background.js --watch          # Run in watch mode'));
    console.log(chalk.gray('  node scripts/jest-background.js --stop           # Stop background tests'));
    console.log(chalk.gray('  node scripts/jest-background.js --status         # Show current status'));
    console.log(chalk.gray('\nAvailable categories:'));
    console.log(chalk.gray('  unit, integration, performance, security, accessibility, compatibility'));
    console.log(chalk.gray('\nBackground Testing Features:'));
    console.log(chalk.gray('  • Continuous test execution'));
    console.log(chalk.gray('  • Real-time progress tracking'));
    console.log(chalk.gray('  • Automatic restart on completion'));
    console.log(chalk.gray('  • Watch mode for file changes'));
    console.log(chalk.gray('  • Performance statistics'));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new JestBackgroundRunner();
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    runner.showHelp();
    return;
  }
  
  if (args[0] === '--stop') {
    runner.stopTests();
    return;
  }
  
  if (args[0] === '--status') {
    runner.showStatus();
    return;
  }
  
  const category = args[0];
  const watchMode = args.includes('--watch');
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Received SIGINT, stopping background tests...'));
    runner.stopTests();
    process.exit(0);
  });
  
  await runner.runTests(category, watchMode);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { JestBackgroundRunner };

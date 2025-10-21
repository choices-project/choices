#!/usr/bin/env node

/**
 * Playwright Background Test Streamer
 * 
 * Runs Playwright E2E tests in the background and streams output to the assistant
 * so issues can be identified and fixed in real-time.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PlaywrightTestStreamer {
  constructor() {
    this.isRunning = false;
    this.cycleCount = 0;
    this.startTime = Date.now();
    this.pidFile = '/tmp/choices-playwright-test-streamer.pid';
    this.logFile = '/tmp/choices-playwright-test-output.log';
    
    // Playwright test categories to rotate through
    this.testCategories = [
      {
        name: 'Core E2E Tests',
        command: ['npm', 'run', 'test:core'],
        description: 'Core functionality E2E tests'
      },
      {
        name: 'Features E2E Tests',
        command: ['npm', 'run', 'test:features'],
        description: 'Feature-specific E2E tests'
      },
      {
        name: 'Performance Tests',
        command: ['npm', 'run', 'test:performance'],
        description: 'Performance and Core Web Vitals tests'
      },
      {
        name: 'Security Tests',
        command: ['npm', 'run', 'test:security'],
        description: 'Security and authentication tests'
      },
      {
        name: 'Compatibility Tests',
        command: ['npm', 'run', 'test:compatibility'],
        description: 'Cross-browser compatibility tests'
      },
      {
        name: 'Monitoring Tests',
        command: ['npm', 'run', 'test:monitoring'],
        description: 'Monitoring and analytics tests'
      }
    ];
    
    this.currentCategoryIndex = 0;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Playwright background test streamer already running!');
      return;
    }

    console.log('🎭 Starting Playwright Background Test Streamer...');
    console.log('📋 Test categories:');
    this.testCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} - ${cat.description}`);
    });
    
    this.isRunning = true;
    this.cycleCount = 0;
    this.startTime = Date.now();
    
    // Write PID file
    fs.writeFileSync(this.pidFile, process.pid.toString());
    
    console.log('\n✅ Playwright background test streamer started!');
    console.log('📊 Check status: npm run test:playwright:background:status');
    console.log('🛑 Stop tests: npm run test:playwright:background:stop');
    console.log('📄 View logs: tail -f /tmp/choices-playwright-test-output.log\n');
    
    // Start the test cycle
    this.runNextTestCategory();
  }

  runNextTestCategory() {
    if (!this.isRunning) return;
    
    this.cycleCount++;
    const category = this.testCategories[this.currentCategoryIndex];
    
    console.log(`🔄 Playwright Test Cycle #${this.cycleCount} - Running: ${category.name}`);
    console.log(`📝 Description: ${category.description}`);
    
    // Log to file for assistant to read
    const logEntry = `\n=== Playwright Test Cycle #${this.cycleCount} - ${category.name} - ${new Date().toISOString()} ===\n`;
    fs.appendFileSync(this.logFile, logEntry);
    
    const testProcess = spawn(category.command[0], category.command.slice(1), {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let hasResults = false;
    let startTime = Date.now();

    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      const timestamp = new Date().toISOString();
      
      // Log to file for assistant
      fs.appendFileSync(this.logFile, `[${timestamp}] [STDOUT] ${text}`);
      
      // Show key results in console
      if (text.includes('✓') || text.includes('✘') || text.includes('passed') || text.includes('failed') || text.includes('error') || text.includes('Running')) {
        console.log(`[${category.name}] ${text.trim()}`);
        hasResults = true;
      }
    });

    testProcess.stderr.on('data', (data) => {
      const text = data.toString();
      const timestamp = new Date().toISOString();
      
      // Log to file for assistant
      fs.appendFileSync(this.logFile, `[${timestamp}] [STDERR] ${text}`);
      
      // Show errors in console
      if (text.includes('Error') || text.includes('failed') || text.includes('warning') || text.includes('timeout')) {
        console.log(`[${category.name} ERROR] ${text.trim()}`);
      }
    });

    testProcess.on('close', (code) => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const status = code === 0 ? '✅' : '❌';
      const result = `${status} ${category.name} completed in ${duration}s (exit code: ${code})`;
      
      console.log(result);
      
      // Log result to file
      fs.appendFileSync(this.logFile, `\n[${new Date().toISOString()}] [RESULT] ${result}\n`);
      
      if (this.isRunning) {
        // Move to next category
        this.currentCategoryIndex = (this.currentCategoryIndex + 1) % this.testCategories.length;
        
        // Wait before next test (longer wait for performance tests, shorter for others)
        const waitTime = category.name.includes('Performance') ? 60000 : 30000;
        console.log(`⏱️  Waiting ${waitTime/1000}s before next category...\n`);
        
        setTimeout(() => {
          this.runNextTestCategory();
        }, waitTime);
      }
    });

    testProcess.on('error', (error) => {
      const errorMsg = `❌ ${category.name} error: ${error.message}`;
      console.log(errorMsg);
      
      // Log error to file
      fs.appendFileSync(this.logFile, `\n[${new Date().toISOString()}] [ERROR] ${errorMsg}\n`);
      
      if (this.isRunning) {
        // Move to next category on error
        this.currentCategoryIndex = (this.currentCategoryIndex + 1) % this.testCategories.length;
        setTimeout(() => {
          this.runNextTestCategory();
        }, 15000);
      }
    });
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Playwright background test streamer not running.');
      return;
    }

    console.log('🛑 Stopping Playwright background test streamer...');
    this.isRunning = false;
    
    // Remove PID file
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
    
    console.log('✅ Playwright background test streamer stopped.');
  }

  status() {
    const isRunning = fs.existsSync(this.pidFile);
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    const currentCategory = this.testCategories[this.currentCategoryIndex];
    
    console.log('\n🎭 Playwright Background Test Streamer Status');
    console.log(`🔄 Running: ${isRunning ? 'Yes' : 'No'}`);
    console.log(`⏱️  Runtime: ${Math.floor(runtime / 60)}m ${runtime % 60}s`);
    console.log(`🔄 Cycles completed: ${this.cycleCount}`);
    console.log(`📋 Current category: ${currentCategory.name}`);
    console.log(`📝 Next: ${currentCategory.description}`);
    console.log(`📄 Log file: ${this.logFile}`);
    
    if (isRunning) {
      console.log('💡 Playwright tests are streaming output - assistant can monitor and help fix issues!');
    }
  }

  getRecentLogs() {
    if (fs.existsSync(this.logFile)) {
      const logs = fs.readFileSync(this.logFile, 'utf8');
      const lines = logs.split('\n');
      return lines.slice(-50).join('\n'); // Last 50 lines
    }
    return 'No logs available.';
  }
}

// Handle command line arguments
const command = process.argv[2];
const streamer = new PlaywrightTestStreamer();

switch (command) {
  case 'start':
    streamer.start();
    break;
  case 'stop':
    streamer.stop();
    break;
  case 'status':
    streamer.status();
    break;
  case 'logs':
    console.log(streamer.getRecentLogs());
    break;
  default:
    console.log('Usage: node test-playwright-background.js [start|stop|status|logs]');
    process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping Playwright background test streamer...');
  streamer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping Playwright background test streamer...');
  streamer.stop();
  process.exit(0);
});

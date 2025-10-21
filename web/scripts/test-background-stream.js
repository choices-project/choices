#!/usr/bin/env node

/**
 * Background Test Streamer
 * 
 * Runs tests in the background and streams output to the assistant
 * so issues can be identified and fixed in real-time.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestStreamer {
  constructor() {
    this.isRunning = false;
    this.cycleCount = 0;
    this.startTime = Date.now();
    this.pidFile = '/tmp/choices-test-streamer.pid';
    this.logFile = '/tmp/choices-test-output.log';
    
    // Test categories to rotate through
    this.testCategories = [
      {
        name: 'Core Navigation',
        command: ['npx', 'playwright', 'test', './tests/playwright/e2e/core/basic-navigation.spec.ts', '--config=tests/playwright/configs/playwright.config.inline.ts'],
        description: 'Basic navigation and page loading'
      },
      {
        name: 'Jest Unit Tests',
        command: ['npm', 'run', 'test:jest'],
        description: 'Unit tests for components and utilities'
      },
      {
        name: 'Build Check',
        command: ['npm', 'run', 'build'],
        description: 'TypeScript compilation and build verification'
      },
      {
        name: 'Lint Check',
        command: ['npm', 'run', 'lint'],
        description: 'Code quality and style checks'
      }
    ];
    
    this.currentCategoryIndex = 0;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Background test streamer already running!');
      return;
    }

    console.log('📡 Starting Background Test Streamer...');
    console.log('📋 Test categories:');
    this.testCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} - ${cat.description}`);
    });
    
    this.isRunning = true;
    this.cycleCount = 0;
    this.startTime = Date.now();
    
    // Write PID file
    fs.writeFileSync(this.pidFile, process.pid.toString());
    
    console.log('\n✅ Background test streamer started!');
    console.log('📊 Check status: npm run test:background:status');
    console.log('🛑 Stop tests: npm run test:background:stop');
    console.log('📄 View logs: tail -f /tmp/choices-test-output.log\n');
    
    // Start the test cycle
    this.runNextTestCategory();
  }

  runNextTestCategory() {
    if (!this.isRunning) return;
    
    this.cycleCount++;
    const category = this.testCategories[this.currentCategoryIndex];
    
    console.log(`🔄 Test Cycle #${this.cycleCount} - Running: ${category.name}`);
    console.log(`📝 Description: ${category.description}`);
    
    // Log to file for assistant to read
    const logEntry = `\n=== Test Cycle #${this.cycleCount} - ${category.name} - ${new Date().toISOString()} ===\n`;
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
      if (text.includes('✓') || text.includes('✘') || text.includes('passed') || text.includes('failed') || text.includes('error')) {
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
      if (text.includes('Error') || text.includes('failed') || text.includes('warning')) {
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
        
        // Wait before next test (longer wait for build/lint, shorter for tests)
        const waitTime = category.name.includes('Build') || category.name.includes('Lint') ? 30000 : 20000;
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
        }, 10000);
      }
    });
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Background test streamer not running.');
      return;
    }

    console.log('🛑 Stopping background test streamer...');
    this.isRunning = false;
    
    // Remove PID file
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
    
    console.log('✅ Background test streamer stopped.');
  }

  status() {
    const isRunning = fs.existsSync(this.pidFile);
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    const currentCategory = this.testCategories[this.currentCategoryIndex];
    
    console.log('\n📡 Background Test Streamer Status');
    console.log(`🔄 Running: ${isRunning ? 'Yes' : 'No'}`);
    console.log(`⏱️  Runtime: ${Math.floor(runtime / 60)}m ${runtime % 60}s`);
    console.log(`🔄 Cycles completed: ${this.cycleCount}`);
    console.log(`📋 Current category: ${currentCategory.name}`);
    console.log(`📝 Next: ${currentCategory.description}`);
    console.log(`📄 Log file: ${this.logFile}`);
    
    if (isRunning) {
      console.log('💡 Tests are streaming output - assistant can monitor and help fix issues!');
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
const streamer = new TestStreamer();

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
    console.log('Usage: node test-background-stream.js [start|stop|status|logs]');
    process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping background test streamer...');
  streamer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping background test streamer...');
  streamer.stop();
  process.exit(0);
});

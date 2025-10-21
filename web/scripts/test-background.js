#!/usr/bin/env node

/**
 * Background Test Runner
 * 
 * Runs tests continuously in the background while development work continues.
 * Provides real-time feedback and allows fixing errors while tests run.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class BackgroundTestRunner {
  constructor() {
    this.processes = new Map();
    this.isRunning = false;
    this.testResults = {
      jest: { passed: 0, failed: 0, total: 0 },
      playwright: { passed: 0, failed: 0, total: 0 }
    };
    this.startTime = Date.now();
  }

  async start() {
    console.log('🚀 Starting Background Test Runner...\n');
    this.isRunning = true;
    
    // Start Jest tests in background
    this.startJestTests();
    
    // Start Playwright tests in background
    this.startPlaywrightTests();
    
    // Start monitoring
    this.startMonitoring();
    
    console.log('✅ Background tests started! You can continue working while tests run.\n');
    console.log('📊 Check status with: npm run test:background:status');
    console.log('🛑 Stop tests with: npm run test:background:stop\n');
  }

  startJestTests() {
    console.log('🧪 Starting Jest tests in background...');
    
    const jestProcess = spawn('npm', ['run', 'test:jest'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    jestProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('PASS') || output.includes('FAIL')) {
        console.log(`[JEST] ${output.trim()}`);
      }
    });

    jestProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Error') || output.includes('FAIL')) {
        console.log(`[JEST ERROR] ${output.trim()}`);
      }
    });

    jestProcess.on('close', (code) => {
      console.log(`[JEST] Tests completed with code ${code}`);
      if (this.isRunning) {
        // Restart Jest tests after a delay
        setTimeout(() => {
          console.log('🔄 Restarting Jest tests...');
          this.startJestTests();
        }, 5000);
      }
    });

    this.processes.set('jest', jestProcess);
  }

  startPlaywrightTests() {
    console.log('🎭 Starting Playwright tests in background...');
    
    const playwrightProcess = spawn('npm', ['run', 'test:core'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    playwrightProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('✓') || output.includes('✘') || output.includes('passed') || output.includes('failed')) {
        console.log(`[PLAYWRIGHT] ${output.trim()}`);
      }
    });

    playwrightProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Error') || output.includes('failed')) {
        console.log(`[PLAYWRIGHT ERROR] ${output.trim()}`);
      }
    });

    playwrightProcess.on('close', (code) => {
      console.log(`[PLAYWRIGHT] Tests completed with code ${code}`);
      if (this.isRunning) {
        // Restart Playwright tests after a delay
        setTimeout(() => {
          console.log('🔄 Restarting Playwright tests...');
          this.startPlaywrightTests();
        }, 10000);
      }
    });

    this.processes.set('playwright', playwrightProcess);
  }

  startMonitoring() {
    // Monitor test results and provide status updates
    setInterval(() => {
      if (this.isRunning) {
        const runtime = Math.floor((Date.now() - this.startTime) / 1000);
        console.log(`\n📊 Background Tests Status (Running for ${runtime}s)`);
        console.log(`🧪 Jest: ${this.testResults.jest.passed} passed, ${this.testResults.jest.failed} failed`);
        console.log(`🎭 Playwright: ${this.testResults.playwright.passed} passed, ${this.testResults.playwright.failed} failed`);
        console.log('💡 Continue working - tests will restart automatically when complete\n');
      }
    }, 30000); // Status update every 30 seconds
  }

  stop() {
    console.log('🛑 Stopping background tests...');
    this.isRunning = false;
    
    this.processes.forEach((process, name) => {
      console.log(`Stopping ${name} tests...`);
      process.kill('SIGTERM');
    });
    
    this.processes.clear();
    console.log('✅ Background tests stopped.');
  }

  status() {
    console.log('\n📊 Background Test Runner Status');
    console.log(`🔄 Running: ${this.isRunning ? 'Yes' : 'No'}`);
    console.log(`⏱️  Runtime: ${Math.floor((Date.now() - this.startTime) / 1000)}s`);
    console.log(`🧪 Jest: ${this.processes.has('jest') ? 'Running' : 'Stopped'}`);
    console.log(`🎭 Playwright: ${this.processes.has('playwright') ? 'Running' : 'Stopped'}`);
    console.log(`📈 Results: Jest ${this.testResults.jest.passed}/${this.testResults.jest.total}, Playwright ${this.testResults.playwright.passed}/${this.testResults.playwright.total}`);
  }
}

// Handle command line arguments
const command = process.argv[2];
const runner = new BackgroundTestRunner();

switch (command) {
  case 'start':
    runner.start();
    break;
  case 'stop':
    runner.stop();
    break;
  case 'status':
    runner.status();
    break;
  default:
    console.log('Usage: node test-background.js [start|stop|status]');
    process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping background tests...');
  runner.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping background tests...');
  runner.stop();
  process.exit(0);
});

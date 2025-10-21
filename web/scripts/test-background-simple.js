#!/usr/bin/env node

/**
 * Simple Background Test Runner
 * 
 * Runs core tests continuously in the background.
 * Focuses on essential tests while allowing development work.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

const { spawn } = require('child_process');

class SimpleBackgroundRunner {
  constructor() {
    this.processes = new Map();
    this.isRunning = false;
    this.cycleCount = 0;
  }

  async start() {
    console.log('🚀 Starting Simple Background Test Runner...\n');
    this.isRunning = true;
    
    // Start with core Playwright tests
    this.runCoreTests();
    
    console.log('✅ Background tests started! You can continue working.\n');
    console.log('📊 Status: npm run test:background:status');
    console.log('🛑 Stop: npm run test:background:stop\n');
  }

  runCoreTests() {
    if (!this.isRunning) return;
    
    this.cycleCount++;
    console.log(`\n🔄 Test Cycle #${this.cycleCount} - Running core tests...`);
    
    const testProcess = spawn('npx', [
      'playwright', 
      'test', 
      './tests/playwright/e2e/core/basic-navigation.spec.ts',
      '--config=tests/playwright/configs/playwright.config.inline.ts'
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';
    let hasResults = false;

    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Show key results immediately
      if (text.includes('✓') || text.includes('✘') || text.includes('passed') || text.includes('failed')) {
        console.log(`[TEST] ${text.trim()}`);
        hasResults = true;
      }
    });

    testProcess.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Error') || text.includes('failed')) {
        console.log(`[ERROR] ${text.trim()}`);
      }
    });

    testProcess.on('close', (code) => {
      if (hasResults) {
        console.log(`\n✅ Test cycle #${this.cycleCount} completed (exit code: ${code})`);
      } else {
        console.log(`\n⏳ Test cycle #${this.cycleCount} completed (exit code: ${code})`);
      }
      
      if (this.isRunning) {
        // Wait 10 seconds before next cycle
        console.log('⏱️  Waiting 10 seconds before next cycle...\n');
        setTimeout(() => {
          this.runCoreTests();
        }, 10000);
      }
    });

    this.processes.set('core', testProcess);
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
    console.log(`🔄 Cycles completed: ${this.cycleCount}`);
    console.log(`🧪 Core tests: ${this.processes.has('core') ? 'Running' : 'Stopped'}`);
  }
}

// Handle command line arguments
const command = process.argv[2];
const runner = new SimpleBackgroundRunner();

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
    console.log('Usage: node test-background-simple.js [start|stop|status]');
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

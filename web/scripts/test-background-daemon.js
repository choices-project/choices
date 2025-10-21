#!/usr/bin/env node

/**
 * Background Test Daemon
 * 
 * Runs tests continuously in the background with minimal output.
 * Perfect for development work while tests run.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');

class TestDaemon {
  constructor() {
    this.isRunning = false;
    this.cycleCount = 0;
    this.startTime = Date.now();
    this.pidFile = '/tmp/choices-test-daemon.pid';
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Background tests already running!');
      return;
    }

    console.log('🚀 Starting Background Test Daemon...');
    this.isRunning = true;
    this.cycleCount = 0;
    this.startTime = Date.now();
    
    // Write PID file
    fs.writeFileSync(this.pidFile, process.pid.toString());
    
    console.log('✅ Background tests started!');
    console.log('💡 You can continue working while tests run in the background.');
    console.log('📊 Check status: npm run test:background:status');
    console.log('🛑 Stop tests: npm run test:background:stop\n');
    
    // Start the test cycle
    this.runTestCycle();
  }

  runTestCycle() {
    if (!this.isRunning) return;
    
    this.cycleCount++;
    console.log(`🔄 Test Cycle #${this.cycleCount} - Running core tests...`);
    
    const testProcess = spawn('npx', [
      'playwright', 
      'test', 
      './tests/playwright/e2e/core/basic-navigation.spec.ts',
      '--config=tests/playwright/configs/playwright.config.inline.ts'
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let hasResults = false;

    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('✓') || text.includes('✘') || text.includes('passed') || text.includes('failed')) {
        console.log(`[TEST] ${text.trim()}`);
        hasResults = true;
      }
    });

    testProcess.on('close', (code) => {
      const status = code === 0 ? '✅' : '❌';
      console.log(`${status} Test cycle #${this.cycleCount} completed (exit code: ${code})`);
      
      if (this.isRunning) {
        // Wait 15 seconds before next cycle
        console.log('⏱️  Waiting 15 seconds before next cycle...\n');
        setTimeout(() => {
          this.runTestCycle();
        }, 15000);
      }
    });

    testProcess.on('error', (error) => {
      console.log(`❌ Test error: ${error.message}`);
      if (this.isRunning) {
        setTimeout(() => {
          this.runTestCycle();
        }, 30000); // Wait longer on error
      }
    });
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Background tests not running.');
      return;
    }

    console.log('🛑 Stopping background tests...');
    this.isRunning = false;
    
    // Remove PID file
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
    
    console.log('✅ Background tests stopped.');
  }

  status() {
    const isRunning = fs.existsSync(this.pidFile);
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    
    console.log('\n📊 Background Test Daemon Status');
    console.log(`🔄 Running: ${isRunning ? 'Yes' : 'No'}`);
    console.log(`⏱️  Runtime: ${Math.floor(runtime / 60)}m ${runtime % 60}s`);
    console.log(`🔄 Cycles completed: ${this.cycleCount}`);
    
    if (isRunning) {
      console.log('💡 Tests are running in the background - continue your work!');
    }
  }
}

// Handle command line arguments
const command = process.argv[2];
const daemon = new TestDaemon();

switch (command) {
  case 'start':
    daemon.start();
    break;
  case 'stop':
    daemon.stop();
    break;
  case 'status':
    daemon.status();
    break;
  default:
    console.log('Usage: node test-background-daemon.js [start|stop|status]');
    process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping background tests...');
  daemon.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping background tests...');
  daemon.stop();
  process.exit(0);
});

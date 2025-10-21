#!/usr/bin/env node

/**
 * Smart Background Test Runner
 * 
 * Runs different test categories in rotation to provide comprehensive coverage
 * while you work on specific areas. Avoids running the same tests repeatedly.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

const { spawn } = require('child_process');
const fs = require('fs');

class SmartBackgroundRunner {
  constructor() {
    this.isRunning = false;
    this.cycleCount = 0;
    this.startTime = Date.now();
    this.pidFile = '/tmp/choices-smart-test-daemon.pid';
    
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
      console.log('⚠️  Smart background tests already running!');
      return;
    }

    console.log('🧠 Starting Smart Background Test Runner...');
    console.log('📋 Test categories:');
    this.testCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} - ${cat.description}`);
    });
    
    this.isRunning = true;
    this.cycleCount = 0;
    this.startTime = Date.now();
    
    // Write PID file
    fs.writeFileSync(this.pidFile, process.pid.toString());
    
    console.log('\n✅ Smart background tests started!');
    console.log('💡 Tests will rotate through different categories automatically.');
    console.log('📊 Check status: npm run test:background:status');
    console.log('🛑 Stop tests: npm run test:background:stop\n');
    
    // Start the test cycle
    this.runNextTestCategory();
  }

  runNextTestCategory() {
    if (!this.isRunning) return;
    
    this.cycleCount++;
    const category = this.testCategories[this.currentCategoryIndex];
    
    console.log(`🔄 Test Cycle #${this.cycleCount} - Running: ${category.name}`);
    console.log(`📝 Description: ${category.description}`);
    
    const testProcess = spawn(category.command[0], category.command.slice(1), {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let hasResults = false;
    let startTime = Date.now();

    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('✓') || text.includes('✘') || text.includes('passed') || text.includes('failed') || text.includes('error')) {
        console.log(`[${category.name}] ${text.trim()}`);
        hasResults = true;
      }
    });

    testProcess.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Error') || text.includes('failed') || text.includes('warning')) {
        console.log(`[${category.name} ERROR] ${text.trim()}`);
      }
    });

    testProcess.on('close', (code) => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const status = code === 0 ? '✅' : '❌';
      console.log(`${status} ${category.name} completed in ${duration}s (exit code: ${code})`);
      
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
      console.log(`❌ ${category.name} error: ${error.message}`);
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
      console.log('⚠️  Smart background tests not running.');
      return;
    }

    console.log('🛑 Stopping smart background tests...');
    this.isRunning = false;
    
    // Remove PID file
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
    
    console.log('✅ Smart background tests stopped.');
  }

  status() {
    const isRunning = fs.existsSync(this.pidFile);
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    const currentCategory = this.testCategories[this.currentCategoryIndex];
    
    console.log('\n🧠 Smart Background Test Runner Status');
    console.log(`🔄 Running: ${isRunning ? 'Yes' : 'No'}`);
    console.log(`⏱️  Runtime: ${Math.floor(runtime / 60)}m ${runtime % 60}s`);
    console.log(`🔄 Cycles completed: ${this.cycleCount}`);
    console.log(`📋 Current category: ${currentCategory.name}`);
    console.log(`📝 Next: ${currentCategory.description}`);
    
    if (isRunning) {
      console.log('💡 Tests are rotating through categories - continue your work!');
    }
  }
}

// Handle command line arguments
const command = process.argv[2];
const runner = new SmartBackgroundRunner();

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
    console.log('Usage: node test-background-smart.js [start|stop|status]');
    process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping smart background tests...');
  runner.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping smart background tests...');
  runner.stop();
  process.exit(0);
});

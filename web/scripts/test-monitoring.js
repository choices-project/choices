#!/usr/bin/env node

/**
 * Comprehensive Test Monitoring Script
 * 
 * Provides visual feedback and progress tracking for all test categories
 * with real-time monitoring and performance analysis.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Test categories and their configurations
const TEST_CATEGORIES = {
  core: {
    name: 'Core Functionality',
    description: 'Essential app functionality (auth, navigation, onboarding)',
    path: 'tests/playwright/e2e/core/',
    color: 'blue',
    priority: 'high'
  },
  features: {
    name: 'Feature Tests',
    description: 'Main application features (UnifiedFeed, polls, voting)',
    path: 'tests/playwright/e2e/features/',
    color: 'green',
    priority: 'high'
  },
  performance: {
    name: 'Performance Tests',
    description: 'Speed, efficiency, and Core Web Vitals',
    path: 'tests/playwright/e2e/performance/',
    color: 'yellow',
    priority: 'high'
  },
  accessibility: {
    name: 'Accessibility Tests',
    description: 'WCAG compliance and screen reader support',
    path: 'tests/playwright/e2e/accessibility/',
    color: 'magenta',
    priority: 'medium'
  },
  security: {
    name: 'Security Tests',
    description: 'Authentication, API security, and vulnerability testing',
    path: 'tests/playwright/e2e/security/',
    color: 'red',
    priority: 'high'
  },
  compatibility: {
    name: 'Compatibility Tests',
    description: 'Cross-browser and responsive design testing',
    path: 'tests/playwright/e2e/compatibility/',
    color: 'cyan',
    priority: 'medium'
  },
  monitoring: {
    name: 'Monitoring Tests',
    description: 'Error handling, data integrity, and system health',
    path: 'tests/playwright/e2e/monitoring/',
    color: 'gray',
    priority: 'low'
  }
};

class TestMonitor {
  constructor() {
    this.startTime = Date.now();
    this.results = {};
    this.currentCategory = null;
    this.totalTests = 0;
    this.completedTests = 0;
    this.failedTests = 0;
  }

  log(message, category = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;
    
    switch (category) {
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
    console.log(chalk.bold.blue('\n🧪 CHOICES PLATFORM - COMPREHENSIVE TEST MONITORING'));
    console.log(chalk.gray('=' .repeat(60)));
    console.log(chalk.gray(`Started at: ${new Date().toLocaleString()}`));
    console.log(chalk.gray(`Node.js: ${process.version}`));
    console.log(chalk.gray(`Platform: ${process.platform}`));
    console.log(chalk.gray('=' .repeat(60)));
  }

  displayCategoryHeader(category) {
    const config = TEST_CATEGORIES[category];
    const color = config.color;
    const emoji = this.getCategoryEmoji(category);
    
    console.log(chalk.bold[color](`\n${emoji} ${config.name.toUpperCase()}`));
    console.log(chalk.gray(`  ${config.description}`));
    console.log(chalk.gray(`  Priority: ${config.priority.toUpperCase()}`));
    console.log(chalk.gray(`  Path: ${config.path}`));
    console.log(chalk.gray('-'.repeat(50)));
  }

  getCategoryEmoji(category) {
    const emojis = {
      core: '🔧',
      features: '⭐',
      performance: '⚡',
      accessibility: '♿',
      security: '🔒',
      compatibility: '🌐',
      monitoring: '📊'
    };
    return emojis[category] || '🧪';
  }

  async runCategory(category) {
    const config = TEST_CATEGORIES[category];
    this.currentCategory = category;
    
    this.displayCategoryHeader(category);
    this.log(`Starting ${config.name} tests...`, 'progress');
    
    const startTime = Date.now();
    
    try {
      // Check if test directory exists
      const testPath = path.join(process.cwd(), config.path);
      if (!fs.existsSync(testPath)) {
        this.log(`Test directory not found: ${testPath}`, 'warning');
        return { status: 'skipped', duration: 0, tests: 0 };
      }

      // Count test files
      const testFiles = fs.readdirSync(testPath).filter(f => f.endsWith('.spec.ts') || f.endsWith('.test.ts'));
      const testCount = testFiles.length;
      
      if (testCount === 0) {
        this.log(`No test files found in ${config.path}`, 'warning');
        return { status: 'skipped', duration: 0, tests: 0 };
      }

      this.log(`Found ${testCount} test file(s)`, 'info');
      
      // Run tests with progress tracking
      const command = `npx playwright test ${config.path} --reporter=list`;
      this.log(`Executing: ${command}`, 'info');
      
      const result = await this.executeCommand(command);
      const duration = Date.now() - startTime;
      
      // Parse results
      const status = result.exitCode === 0 ? 'passed' : 'failed';
      this.log(`${config.name} tests ${status} in ${(duration / 1000).toFixed(2)}s`, status === 'passed' ? 'success' : 'error');
      
      return {
        status,
        duration,
        tests: testCount,
        exitCode: result.exitCode,
        output: result.output
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`Error running ${config.name} tests: ${error.message}`, 'error');
      return {
        status: 'error',
        duration,
        tests: 0,
        error: error.message
      };
    }
  }

  executeCommand(command) {
    return new Promise((resolve) => {
      const child = spawn('npx', command.split(' ').slice(1), {
        stdio: 'pipe',
        shell: true
      });
      
      let output = '';
      let errorOutput = '';
      
      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        // Show progress in real-time
        if (text.includes('Running') || text.includes('✓') || text.includes('✗')) {
          process.stdout.write(text);
        }
      });
      
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      child.on('close', (code) => {
        resolve({
          exitCode: code,
          output: output + errorOutput
        });
      });
    });
  }

  displaySummary() {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = Object.values(this.results).reduce((sum, result) => sum + (result.tests || 0), 0);
    const passedCategories = Object.values(this.results).filter(r => r.status === 'passed').length;
    const totalCategories = Object.keys(this.results).length;
    
    console.log(chalk.bold.blue('\n📊 TEST EXECUTION SUMMARY'));
    console.log(chalk.gray('=' .repeat(50)));
    console.log(chalk.gray(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`));
    console.log(chalk.gray(`Total Test Files: ${totalTests}`));
    console.log(chalk.gray(`Categories Passed: ${passedCategories}/${totalCategories}`));
    
    console.log(chalk.bold('\n📋 CATEGORY RESULTS:'));
    Object.entries(this.results).forEach(([category, result]) => {
      const config = TEST_CATEGORIES[category];
      const status = result.status === 'passed' ? 
        chalk.green('✅ PASSED') : 
        result.status === 'failed' ? 
        chalk.red('❌ FAILED') : 
        chalk.yellow('⚠️  SKIPPED');
      
      console.log(`  ${this.getCategoryEmoji(category)} ${config.name}: ${status} (${(result.duration / 1000).toFixed(2)}s, ${result.tests || 0} tests)`);
    });
    
    // Recommendations
    this.displayRecommendations();
  }

  displayRecommendations() {
    const failedCategories = Object.entries(this.results).filter(([_, result]) => result.status === 'failed');
    
    if (failedCategories.length > 0) {
      console.log(chalk.bold.yellow('\n💡 RECOMMENDATIONS:'));
      failedCategories.forEach(([category, result]) => {
        const config = TEST_CATEGORIES[category];
        console.log(chalk.yellow(`  • Fix failing tests in ${config.name} (${category})`));
      });
    }
    
    const slowCategories = Object.entries(this.results).filter(([_, result]) => result.duration > 30000);
    if (slowCategories.length > 0) {
      console.log(chalk.yellow(`  • Optimize slow test categories: ${slowCategories.map(([cat]) => cat).join(', ')}`));
    }
    
    console.log(chalk.green('\n🎉 Test monitoring complete!'));
    console.log(chalk.gray('Run "npm run test:monitoring:report" to view detailed dashboard'));
  }

  async runAllCategories() {
    this.displayHeader();
    
    const categories = Object.keys(TEST_CATEGORIES);
    
    for (const category of categories) {
      this.results[category] = await this.runCategory(category);
      
      // Small delay between categories
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.displaySummary();
  }

  async runSpecificCategories(categoryNames) {
    this.displayHeader();
    
    for (const category of categoryNames) {
      if (!TEST_CATEGORIES[category]) {
        this.log(`Unknown category: ${category}`, 'error');
        continue;
      }
      
      this.results[category] = await this.runCategory(category);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.displaySummary();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const monitor = new TestMonitor();
  
  if (args.length === 0) {
    // Run all categories
    await monitor.runAllCategories();
  } else if (args[0] === '--help' || args[0] === '-h') {
    console.log(chalk.bold.blue('\n🧪 Test Monitoring Script'));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.gray('  node scripts/test-monitoring.js                    # Run all test categories'));
    console.log(chalk.gray('  node scripts/test-monitoring.js core features     # Run specific categories'));
    console.log(chalk.gray('\nAvailable categories:'));
    Object.entries(TEST_CATEGORIES).forEach(([key, config]) => {
      console.log(chalk.gray(`  ${key.padEnd(12)} - ${config.name}`));
    });
  } else {
    // Run specific categories
    await monitor.runSpecificCategories(args);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TestMonitor, TEST_CATEGORIES };

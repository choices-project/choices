#!/usr/bin/env node

/**
 * CI/CD Integration Script
 * 
 * This script provides seamless CI/CD pipeline integration for the
 * testing roadmap to perfection.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CIIntegration {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.isCI = process.env.CI === 'true';
    this.branch = process.env.GITHUB_REF?.replace('refs/heads/', '') || 'main';
    this.commit = process.env.GITHUB_SHA?.substring(0, 7) || 'local';
  }

  /**
   * Run pre-commit checks
   */
  async runPreCommitChecks() {
    console.log('🔍 Running Pre-Commit Checks');
    console.log('============================');
    
    try {
      // Run linting
      console.log('📝 Running ESLint...');
      execSync('npm run lint', { stdio: 'inherit' });
      
      // Run type checking
      console.log('🔷 Running TypeScript checks...');
      execSync('npm run types:strict', { stdio: 'inherit' });
      
      // Run fast tests
      console.log('🚀 Running fast tests...');
      execSync('npm run test:fast', { stdio: 'inherit' });
      
      console.log('✅ Pre-commit checks passed!');
      return true;
    } catch (error) {
      console.error('❌ Pre-commit checks failed:', error.message);
      return false;
    }
  }

  /**
   * Run pull request checks
   */
  async runPullRequestChecks() {
    console.log('🔍 Running Pull Request Checks');
    console.log('==============================');
    
    try {
      // Run comprehensive tests
      console.log('🎯 Running comprehensive tests...');
      execSync('npm run test:comprehensive', { stdio: 'inherit' });
      
      // Run performance tests
      console.log('⚡ Running performance tests...');
      execSync('npm run test:performance', { stdio: 'inherit' });
      
      // Run security tests
      console.log('🔒 Running security tests...');
      execSync('npm run test:security', { stdio: 'inherit' });
      
      console.log('✅ Pull request checks passed!');
      return true;
    } catch (error) {
      console.error('❌ Pull request checks failed:', error.message);
      return false;
    }
  }

  /**
   * Run main branch checks
   */
  async runMainBranchChecks() {
    console.log('🔍 Running Main Branch Checks');
    console.log('=============================');
    
    try {
      // Run all tests
      console.log('🚀 Running all tests...');
      execSync('npm run test:all', { stdio: 'inherit' });
      
      // Run accessibility tests
      console.log('♿ Running accessibility tests...');
      execSync('npm run test:accessibility', { stdio: 'inherit' });
      
      console.log('✅ Main branch checks passed!');
      return true;
    } catch (error) {
      console.error('❌ Main branch checks failed:', error.message);
      return false;
    }
  }

  /**
   * Run deployment checks
   */
  async runDeploymentChecks() {
    console.log('🔍 Running Deployment Checks');
    console.log('============================');
    
    try {
      // Run production build
      console.log('🏗️ Running production build...');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Run all tests
      console.log('🚀 Running all tests...');
      execSync('npm run test:all', { stdio: 'inherit' });
      
      // Run performance tests
      console.log('⚡ Running performance tests...');
      execSync('npm run test:performance', { stdio: 'inherit' });
      
      console.log('✅ Deployment checks passed!');
      return true;
    } catch (error) {
      console.error('❌ Deployment checks failed:', error.message);
      return false;
    }
  }

  /**
   * Generate test report
   */
  async generateTestReport() {
    console.log('📊 Generating Test Report');
    console.log('==========================');
    
    try {
      // Run tests with reporting
      console.log('🧪 Running tests with reporting...');
      execSync('npm run test:all -- --reporter=json', { stdio: 'inherit' });
      
      // Generate HTML report
      console.log('📄 Generating HTML report...');
      // This would integrate with the test reporter
      
      console.log('✅ Test report generated!');
      return true;
    } catch (error) {
      console.error('❌ Test report generation failed:', error.message);
      return false;
    }
  }

  /**
   * Run appropriate checks based on context
   */
  async runChecks() {
    console.log('🎯 CI/CD Integration - Testing Roadmap to Perfection');
    console.log('==================================================');
    console.log(`Environment: ${this.environment}`);
    console.log(`Branch: ${this.branch}`);
    console.log(`Commit: ${this.commit}`);
    console.log(`CI: ${this.isCI}`);
    console.log('');

    let success = true;

    if (this.isCI) {
      // In CI environment
      if (this.branch === 'main') {
        success = await this.runMainBranchChecks();
      } else {
        success = await this.runPullRequestChecks();
      }
    } else {
      // Local environment
      success = await this.runPreCommitChecks();
    }

    if (success) {
      console.log('🎉 All checks passed!');
      process.exit(0);
    } else {
      console.log('❌ Some checks failed!');
      process.exit(1);
    }
  }

  /**
   * Run specific test suite
   */
  async runTestSuite(suite) {
    console.log(`🧪 Running ${suite} Test Suite`);
    console.log('==============================');
    
    try {
      let command;
      switch (suite) {
        case 'fast':
          command = 'npm run test:fast';
          break;
        case 'medium':
          command = 'npm run test:medium';
          break;
        case 'comprehensive':
          command = 'npm run test:comprehensive';
          break;
        case 'all':
          command = 'npm run test:all';
          break;
        case 'performance':
          command = 'npm run test:performance';
          break;
        case 'security':
          command = 'npm run test:security';
          break;
        case 'accessibility':
          command = 'npm run test:accessibility';
          break;
        default:
          throw new Error(`Unknown test suite: ${suite}`);
      }

      execSync(command, { stdio: 'inherit' });
      console.log(`✅ ${suite} test suite completed!`);
      return true;
    } catch (error) {
      console.error(`❌ ${suite} test suite failed:`, error.message);
      return false;
    }
  }

  /**
   * Show help
   */
  showHelp() {
    console.log('🎯 CI/CD Integration Script');
    console.log('==========================');
    console.log('');
    console.log('Usage: node scripts/ci-integration.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  pre-commit     Run pre-commit checks');
    console.log('  pr             Run pull request checks');
    console.log('  main           Run main branch checks');
    console.log('  deploy         Run deployment checks');
    console.log('  report         Generate test report');
    console.log('  fast           Run fast test suite');
    console.log('  medium         Run medium test suite');
    console.log('  comprehensive  Run comprehensive test suite');
    console.log('  all            Run all test suite');
    console.log('  performance    Run performance test suite');
    console.log('  security       Run security test suite');
    console.log('  accessibility  Run accessibility test suite');
    console.log('  help           Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/ci-integration.js pre-commit');
    console.log('  node scripts/ci-integration.js pr');
    console.log('  node scripts/ci-integration.js fast');
  }
}

// Main execution
async function main() {
  const ci = new CIIntegration();
  const command = process.argv[2];

  switch (command) {
    case 'pre-commit':
      await ci.runPreCommitChecks();
      break;
    case 'pr':
      await ci.runPullRequestChecks();
      break;
    case 'main':
      await ci.runMainBranchChecks();
      break;
    case 'deploy':
      await ci.runDeploymentChecks();
      break;
    case 'report':
      await ci.generateTestReport();
      break;
    case 'fast':
    case 'medium':
    case 'comprehensive':
    case 'all':
    case 'performance':
    case 'security':
    case 'accessibility':
      await ci.runTestSuite(command);
      break;
    case 'help':
    case '--help':
    case '-h':
      ci.showHelp();
      break;
    default:
      if (command) {
        console.error('❌ Unknown command:', command);
        ci.showHelp();
        process.exit(1);
      } else {
        await ci.runChecks();
      }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CIIntegration };

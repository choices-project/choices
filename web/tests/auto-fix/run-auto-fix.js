#!/usr/bin/env node

/**
 * Automated Error Fixing Test Runner
 * 
 * This script runs the auto-fix pipeline and then runs tests to verify
 * that errors have been resolved automatically.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

class AutoFixTestRunner {
  constructor() {
    this.maxIterations = 3;
    this.currentIteration = 0;
  }

  async run() {
    console.log('🚀 Starting Automated Error Fixing Test Runner');
    console.log('================================================');
    
    try {
      // Step 1: Run initial diagnostics
      await this.runDiagnostics('Initial State');
      
      // Step 2: Run auto-fix pipeline iteratively
      let hasErrors = true;
      while (hasErrors && this.currentIteration < this.maxIterations) {
        this.currentIteration++;
        console.log(`\n🔄 Iteration ${this.currentIteration}/${this.maxIterations}`);
        
        // Run auto-fix pipeline
        await this.runAutoFixPipeline();
        
        // Check if errors remain
        hasErrors = await this.hasRemainingErrors();
        
        if (hasErrors) {
          console.log(`⚠️  Errors still present after iteration ${this.currentIteration}`);
        } else {
          console.log(`✅ All errors fixed after iteration ${this.currentIteration}`);
        }
      }
      
      // Step 3: Final verification
      await this.runDiagnostics('Final State');
      
      // Step 4: Run comprehensive test suite
      await this.runComprehensiveTests();
      
      console.log('\n🎉 Automated error fixing completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Auto-fix test runner failed:', error.message);
      process.exit(1);
    }
  }

  async runDiagnostics(phase) {
    console.log(`\n📊 ${phase} Diagnostics:`);
    console.log('----------------------------------------');
    
    // Check ESLint
    try {
      const lintOutput = execSync('npm run lint:gradual', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      const lintErrors = this.countErrors(lintOutput);
      console.log(`  📝 ESLint: ${lintErrors} issues`);
    } catch (error) {
      const lintErrors = this.countErrors(error.stdout || '');
      console.log(`  📝 ESLint: ${lintErrors} issues`);
    }
    
    // Check TypeScript
    try {
      const tsOutput = execSync('npm run types:strict', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      const tsErrors = this.countTypeScriptErrors(tsOutput);
      console.log(`  🔷 TypeScript: ${tsErrors} errors`);
    } catch (error) {
      const tsErrors = this.countTypeScriptErrors(error.stdout || '');
      console.log(`  🔷 TypeScript: ${tsErrors} errors`);
    }
    
    // Check Tests
    try {
      const testOutput = execSync('npm run test:jest', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      const testErrors = this.countTestErrors(testOutput);
      console.log(`  🧪 Tests: ${testErrors} failures`);
    } catch (error) {
      const testErrors = this.countTestErrors(error.stdout || '');
      console.log(`  🧪 Tests: ${testErrors} failures`);
    }
  }

  async runAutoFixPipeline() {
    console.log('🔧 Running auto-fix pipeline...');
    
    try {
      // Import and run the auto-fix pipeline
      const { AutoFixPipeline } = await import('./auto-fix-pipeline.ts');
      const pipeline = new AutoFixPipeline();
      await pipeline.runAutoFix();
    } catch (error) {
      console.error('❌ Auto-fix pipeline failed:', error.message);
      throw error;
    }
  }

  async hasRemainingErrors() {
    let hasErrors = false;
    
    // Check ESLint
    try {
      execSync('npm run lint:gradual', { stdio: 'pipe' });
    } catch (error) {
      hasErrors = true;
    }
    
    // Check TypeScript
    try {
      execSync('npm run types:strict', { stdio: 'pipe' });
    } catch (error) {
      hasErrors = true;
    }
    
    // Check Tests
    try {
      execSync('npm run test:jest', { stdio: 'pipe' });
    } catch (error) {
      hasErrors = true;
    }
    
    return hasErrors;
  }

  async runComprehensiveTests() {
    console.log('\n🧪 Running Comprehensive Test Suite:');
    console.log('----------------------------------------');
    
    const testSuites = [
      { name: 'Unit Tests', command: 'npm run test:jest' },
      { name: 'E2E Tests', command: 'npm run test:playwright' },
      { name: 'Linting', command: 'npm run lint:gradual' },
      { name: 'TypeScript', command: 'npm run types:strict' }
    ];
    
    for (const suite of testSuites) {
      try {
        console.log(`  🔄 Running ${suite.name}...`);
        execSync(suite.command, { stdio: 'pipe' });
        console.log(`  ✅ ${suite.name} passed`);
      } catch (error) {
        console.log(`  ❌ ${suite.name} failed`);
        console.log(`     Command: ${suite.command}`);
      }
    }
  }

  countErrors(output) {
    const lines = output.split('\n');
    return lines.filter(line => 
      line.includes('error') || 
      line.includes('warning') ||
      line.includes('✖')
    ).length;
  }

  countTypeScriptErrors(output) {
    const lines = output.split('\n');
    return lines.filter(line => 
      line.includes('error TS') ||
      line.includes('Property') ||
      line.includes('Cannot find')
    ).length;
  }

  countTestErrors(output) {
    const lines = output.split('\n');
    return lines.filter(line => 
      line.includes('FAIL') ||
      line.includes('Error:') ||
      line.includes('ReferenceError')
    ).length;
  }
}

// Run the auto-fix test runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new AutoFixTestRunner();
  runner.run().catch(console.error);
}

export { AutoFixTestRunner };

#!/usr/bin/env node

/**
 * E2E Dependency Tracker
 * 
 * Tracks all files, APIs, and database interactions during E2E testing
 * to identify what needs to be updated for the new schema
 * 
 * Created: October 24, 2025
 * Status: ACTIVE
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class E2EDependencyTracker {
  constructor() {
    this.projectRoot = process.cwd();
    this.webDir = path.join(this.projectRoot, 'web');
    this.trackingData = {
      touchedFiles: new Set(),
      apiCalls: new Set(),
      databaseQueries: new Set(),
      imports: new Set(),
      errors: [],
      schemaMismatches: []
    };
  }

  /**
   * Start tracking by setting up file watchers
   */
  startTracking() {
    console.log('🔍 Starting E2E dependency tracking...');
    
    // Create tracking log file
    this.logFile = path.join(this.projectRoot, 'e2e-dependency-track.log');
    fs.writeFileSync(this.logFile, `E2E Dependency Tracking Started: ${new Date().toISOString()}\n`);
    
    console.log(`📝 Tracking log: ${this.logFile}`);
  }

  /**
   * Log a file that was touched during testing
   */
  logTouchedFile(filePath, reason = '') {
    const relativePath = path.relative(this.webDir, filePath);
    this.trackingData.touchedFiles.add(relativePath);
    
    const logEntry = `[${new Date().toISOString()}] FILE: ${relativePath} - ${reason}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  /**
   * Log an API call made during testing
   */
  logApiCall(endpoint, method = 'GET', status = 'unknown') {
    this.trackingData.apiCalls.add(`${method} ${endpoint}`);
    
    const logEntry = `[${new Date().toISOString()}] API: ${method} ${endpoint} - Status: ${status}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  /**
   * Log a database query made during testing
   */
  logDatabaseQuery(table, operation = 'SELECT') {
    this.trackingData.databaseQueries.add(`${operation} ${table}`);
    
    const logEntry = `[${new Date().toISOString()}] DB: ${operation} ${table}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  /**
   * Log an import dependency
   */
  logImport(fromFile, toFile) {
    const fromRelative = path.relative(this.webDir, fromFile);
    const toRelative = path.relative(this.webDir, toFile);
    this.trackingData.imports.add(`${fromRelative} -> ${toRelative}`);
    
    const logEntry = `[${new Date().toISOString()}] IMPORT: ${fromRelative} -> ${toRelative}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  /**
   * Log an error encountered during testing
   */
  logError(error, context = '') {
    this.trackingData.errors.push({
      error: error.message || error,
      context,
      timestamp: new Date().toISOString()
    });
    
    const logEntry = `[${new Date().toISOString()}] ERROR: ${error.message || error} - ${context}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  /**
   * Log a schema mismatch
   */
  logSchemaMismatch(expected, actual, file) {
    this.trackingData.schemaMismatches.push({
      expected,
      actual,
      file,
      timestamp: new Date().toISOString()
    });
    
    const logEntry = `[${new Date().toISOString()}] SCHEMA MISMATCH: Expected ${expected}, got ${actual} in ${file}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  /**
   * Analyze the dependency tree and generate report
   */
  generateDependencyReport() {
    console.log('📊 Generating dependency analysis report...');
    
    const report = {
      summary: {
        totalFilesTouched: this.trackingData.touchedFiles.size,
        totalApiCalls: this.trackingData.apiCalls.size,
        totalDatabaseQueries: this.trackingData.databaseQueries.size,
        totalImports: this.trackingData.imports.size,
        totalErrors: this.trackingData.errors.length,
        totalSchemaMismatches: this.trackingData.schemaMismatches.length
      },
      touchedFiles: Array.from(this.trackingData.touchedFiles).sort(),
      apiCalls: Array.from(this.trackingData.apiCalls).sort(),
      databaseQueries: Array.from(this.trackingData.databaseQueries).sort(),
      imports: Array.from(this.trackingData.imports).sort(),
      errors: this.trackingData.errors,
      schemaMismatches: this.trackingData.schemaMismatches,
      recommendations: this.generateRecommendations()
    };

    // Save report
    const reportPath = path.join(this.projectRoot, 'e2e-dependency-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Dependency report saved to: ${reportPath}`);
    
    return report;
  }

  /**
   * Generate actionable recommendations based on tracking data
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Files that need schema updates
    const filesNeedingUpdates = Array.from(this.trackingData.touchedFiles).filter(file => 
      file.includes('store') || 
      file.includes('api') || 
      file.includes('hook') ||
      file.includes('service')
    );
    
    if (filesNeedingUpdates.length > 0) {
      recommendations.push({
        type: 'SCHEMA_UPDATE',
        priority: 'HIGH',
        description: `${filesNeedingUpdates.length} files need schema updates`,
        files: filesNeedingUpdates,
        action: 'Update these files to use the new database schema'
      });
    }
    
    // API endpoints that need updates
    const apisNeedingUpdates = Array.from(this.trackingData.apiCalls).filter(api => 
      api.includes('/api/') && !api.includes('200')
    );
    
    if (apisNeedingUpdates.length > 0) {
      recommendations.push({
        type: 'API_UPDATE',
        priority: 'MEDIUM',
        description: `${apisNeedingUpdates.length} API endpoints need updates`,
        endpoints: apisNeedingUpdates,
        action: 'Update these API endpoints for the new schema'
      });
    }
    
    // Database tables that need to be created
    const missingTables = Array.from(this.trackingData.databaseQueries).filter(query => 
      query.includes('SELECT') && !query.includes('user_profiles')
    );
    
    if (missingTables.length > 0) {
      recommendations.push({
        type: 'DATABASE_CREATION',
        priority: 'HIGH',
        description: `${missingTables.length} database tables need to be created`,
        tables: missingTables,
        action: 'Create these missing tables in the database'
      });
    }
    
    return recommendations;
  }

  /**
   * Stop tracking and generate final report
   */
  stopTracking() {
    console.log('🛑 Stopping E2E dependency tracking...');
    
    const report = this.generateDependencyReport();
    
    console.log('\n📊 E2E DEPENDENCY TRACKING RESULTS');
    console.log('=====================================');
    console.log(`📁 Files touched: ${report.summary.totalFilesTouched}`);
    console.log(`🌐 API calls made: ${report.summary.totalApiCalls}`);
    console.log(`🗄️  Database queries: ${report.summary.totalDatabaseQueries}`);
    console.log(`📦 Import dependencies: ${report.summary.totalImports}`);
    console.log(`❌ Errors encountered: ${report.summary.totalErrors}`);
    console.log(`🔧 Schema mismatches: ${report.summary.totalSchemaMismatches}`);
    
    console.log('\n🎯 TOP RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.type} (${rec.priority} Priority)`);
      console.log(`   ${rec.description}`);
      console.log(`   Action: ${rec.action}`);
    });
    
    return report;
  }
}

// Export for use in tests
module.exports = E2EDependencyTracker;

// Run if called directly
if (require.main === module) {
  const tracker = new E2EDependencyTracker();
  tracker.startTracking();
  
  // Keep running until interrupted
  process.on('SIGINT', () => {
    console.log('\n🛑 Received interrupt signal...');
    tracker.stopTracking();
    process.exit(0);
  });
}

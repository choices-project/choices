#!/usr/bin/env node

/**
 * System Audit Tracker
 * 
 * Comprehensive system audit during E2E testing to:
 * 1. Track all dependencies and interactions
 * 2. Identify schema mismatches and needed updates
 * 3. Update documentation in real-time
 * 4. Map the complete system architecture
 * 
 * Created: October 24, 2025
 * Status: ACTIVE
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SystemAuditTracker {
  constructor() {
    this.projectRoot = process.cwd();
    this.webDir = path.join(this.projectRoot, 'web');
    this.docsDir = path.join(this.projectRoot, 'docs');
    
    this.auditData = {
      // System Architecture
      components: new Map(),
      apis: new Map(),
      stores: new Map(),
      hooks: new Map(),
      
      // Database Schema
      tablesUsed: new Set(),
      tablesMissing: new Set(),
      schemaMismatches: [],
      
      // Dependencies
      fileDependencies: new Map(),
      importChains: new Map(),
      
      // Errors & Issues
      errors: [],
      warnings: [],
      recommendations: [],
      
      // Documentation Updates
      docsToUpdate: new Set(),
      newInsights: []
    };
  }

  /**
   * Start comprehensive system audit
   */
  startAudit() {
    console.log('🔍 Starting comprehensive system audit...');
    
    // Create audit log
    this.auditLog = path.join(this.projectRoot, 'system-audit.log');
    fs.writeFileSync(this.auditLog, `System Audit Started: ${new Date().toISOString()}\n`);
    
    // Initialize documentation tracking
    this.initializeDocumentationTracking();
    
    console.log(`📝 Audit log: ${this.auditLog}`);
  }

  /**
   * Track a component interaction
   */
  trackComponent(componentPath, interaction, context = '') {
    const relativePath = path.relative(this.webDir, componentPath);
    
    if (!this.auditData.components.has(relativePath)) {
      this.auditData.components.set(relativePath, {
        path: relativePath,
        interactions: [],
        dependencies: new Set(),
        errors: [],
        lastUsed: new Date().toISOString()
      });
    }
    
    const component = this.auditData.components.get(relativePath);
    component.interactions.push({
      type: interaction,
      context,
      timestamp: new Date().toISOString()
    });
    component.lastUsed = new Date().toISOString();
    
    this.logAuditEvent('COMPONENT', `${relativePath} - ${interaction}`, context);
  }

  /**
   * Track an API interaction
   */
  trackApi(endpoint, method, status, responseTime = null) {
    const apiKey = `${method} ${endpoint}`;
    
    if (!this.auditData.apis.has(apiKey)) {
      this.auditData.apis.set(apiKey, {
        endpoint,
        method,
        calls: 0,
        errors: 0,
        avgResponseTime: 0,
        lastUsed: new Date().toISOString()
      });
    }
    
    const api = this.auditData.apis.get(apiKey);
    api.calls++;
    if (status >= 400) api.errors++;
    if (responseTime) {
      api.avgResponseTime = (api.avgResponseTime + responseTime) / 2;
    }
    api.lastUsed = new Date().toISOString();
    
    this.logAuditEvent('API', `${apiKey} - Status: ${status}`, `Response time: ${responseTime}ms`);
  }

  /**
   * Track a store interaction
   */
  trackStore(storePath, action, data = null) {
    const relativePath = path.relative(this.webDir, storePath);
    
    if (!this.auditData.stores.has(relativePath)) {
      this.auditData.stores.set(relativePath, {
        path: relativePath,
        actions: [],
        dataStructures: new Set(),
        dependencies: new Set(),
        lastUsed: new Date().toISOString()
      });
    }
    
    const store = this.auditData.stores.get(relativePath);
    store.actions.push({
      action,
      data: data ? Object.keys(data) : null,
      timestamp: new Date().toISOString()
    });
    store.lastUsed = new Date().toISOString();
    
    this.logAuditEvent('STORE', `${relativePath} - ${action}`, data ? Object.keys(data).join(', ') : '');
  }

  /**
   * Track a database interaction
   */
  trackDatabase(table, operation, success = true, error = null) {
    if (success) {
      this.auditData.tablesUsed.add(table);
    } else {
      this.auditData.tablesMissing.add(table);
      this.auditData.schemaMismatches.push({
        table,
        operation,
        error: error?.message || error,
        timestamp: new Date().toISOString()
      });
    }
    
    this.logAuditEvent('DATABASE', `${operation} ${table}`, success ? 'SUCCESS' : `ERROR: ${error}`);
  }

  /**
   * Track a file dependency
   */
  trackDependency(fromFile, toFile, type = 'import') {
    const fromRelative = path.relative(this.webDir, fromFile);
    const toRelative = path.relative(this.webDir, toFile);
    
    if (!this.auditData.fileDependencies.has(fromRelative)) {
      this.auditData.fileDependencies.set(fromRelative, new Set());
    }
    
    this.auditData.fileDependencies.get(fromRelative).add({
      file: toRelative,
      type,
      timestamp: new Date().toISOString()
    });
    
    this.logAuditEvent('DEPENDENCY', `${fromRelative} -> ${toRelative}`, type);
  }

  /**
   * Track an error
   */
  trackError(error, context, severity = 'error') {
    const errorData = {
      message: error.message || error,
      context,
      severity,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };
    
    if (severity === 'error') {
      this.auditData.errors.push(errorData);
    } else {
      this.auditData.warnings.push(errorData);
    }
    
    this.logAuditEvent('ERROR', errorData.message, `${context} (${severity})`);
  }

  /**
   * Log audit event
   */
  logAuditEvent(type, message, context = '') {
    const logEntry = `[${new Date().toISOString()}] ${type}: ${message}${context ? ` - ${context}` : ''}\n`;
    fs.appendFileSync(this.auditLog, logEntry);
  }

  /**
   * Initialize documentation tracking
   */
  initializeDocumentationTracking() {
    // Track which docs need updates
    const docFiles = [
      'docs/core/SYSTEM_ARCHITECTURE.md',
      'docs/core/DEVELOPMENT_STATUS.md',
      'docs/features/DATABASE.md',
      'docs/features/AUTH.md',
      'docs/features/POLLS.md',
      'docs/features/HASHTAGS.md'
    ];
    
    docFiles.forEach(doc => {
      this.auditData.docsToUpdate.add(doc);
    });
  }

  /**
   * Generate comprehensive audit report
   */
  generateAuditReport() {
    console.log('📊 Generating comprehensive system audit report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        componentsAnalyzed: this.auditData.components.size,
        apisAnalyzed: this.auditData.apis.size,
        storesAnalyzed: this.auditData.stores.size,
        tablesUsed: this.auditData.tablesUsed.size,
        tablesMissing: this.auditData.tablesMissing.size,
        errorsFound: this.auditData.errors.length,
        warningsFound: this.auditData.warnings.length,
        docsToUpdate: this.auditData.docsToUpdate.size
      },
      components: Object.fromEntries(this.auditData.components),
      apis: Object.fromEntries(this.auditData.apis),
      stores: Object.fromEntries(this.auditData.stores),
      database: {
        tablesUsed: Array.from(this.auditData.tablesUsed),
        tablesMissing: Array.from(this.auditData.tablesMissing),
        schemaMismatches: this.auditData.schemaMismatches
      },
      dependencies: Object.fromEntries(this.auditData.fileDependencies),
      errors: this.auditData.errors,
      warnings: this.auditData.warnings,
      recommendations: this.generateRecommendations(),
      documentationUpdates: this.generateDocumentationUpdates()
    };

    // Save report
    const reportPath = path.join(this.projectRoot, 'system-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 System audit report saved to: ${reportPath}`);
    
    return report;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Schema updates needed
    if (this.auditData.tablesMissing.size > 0) {
      recommendations.push({
        type: 'SCHEMA_UPDATE',
        priority: 'HIGH',
        description: `${this.auditData.tablesMissing.size} database tables need to be created`,
        tables: Array.from(this.auditData.tablesMissing),
        action: 'Create missing tables in database schema'
      });
    }
    
    // Component updates needed
    const componentsWithErrors = Array.from(this.auditData.components.entries())
      .filter(([_, comp]) => comp.errors.length > 0);
    
    if (componentsWithErrors.length > 0) {
      recommendations.push({
        type: 'COMPONENT_FIX',
        priority: 'HIGH',
        description: `${componentsWithErrors.length} components have errors`,
        components: componentsWithErrors.map(([path, _]) => path),
        action: 'Fix component errors and update for new schema'
      });
    }
    
    // API updates needed
    const apisWithErrors = Array.from(this.auditData.apis.entries())
      .filter(([_, api]) => api.errors > 0);
    
    if (apisWithErrors.length > 0) {
      recommendations.push({
        type: 'API_FIX',
        priority: 'MEDIUM',
        description: `${apisWithErrors.length} APIs have errors`,
        apis: apisWithErrors.map(([endpoint, _]) => endpoint),
        action: 'Fix API errors and update for new schema'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate documentation updates
   */
  generateDocumentationUpdates() {
    const updates = [];
    
    // System architecture updates
    updates.push({
      file: 'docs/core/SYSTEM_ARCHITECTURE.md',
      updates: [
        'Update component interaction map',
        'Update API endpoint documentation',
        'Update store architecture',
        'Update database schema documentation'
      ]
    });
    
    // Development status updates
    updates.push({
      file: 'docs/core/DEVELOPMENT_STATUS.md',
      updates: [
        'Update current system status',
        'Update error tracking',
        'Update performance metrics',
        'Update schema migration status'
      ]
    });
    
    return updates;
  }

  /**
   * Update documentation based on audit findings
   */
  async updateDocumentation() {
    console.log('📝 Updating documentation based on audit findings...');
    
    // Update system architecture
    await this.updateSystemArchitecture();
    
    // Update development status
    await this.updateDevelopmentStatus();
    
    // Update feature documentation
    await this.updateFeatureDocumentation();
    
    console.log('✅ Documentation updated successfully');
  }

  /**
   * Update system architecture documentation
   */
  async updateSystemArchitecture() {
    const archDoc = path.join(this.docsDir, 'core', 'SYSTEM_ARCHITECTURE.md');
    
    if (!fs.existsSync(archDoc)) {
      console.log('⚠️  System architecture doc not found, skipping...');
      return;
    }
    
    // Read current content
    let content = fs.readFileSync(archDoc, 'utf8');
    
    // Add audit findings
    const auditSection = `
## 🔍 System Audit Findings

**Last Updated:** ${new Date().toISOString()}

### Components Analyzed
- **Total Components:** ${this.auditData.components.size}
- **Components with Errors:** ${Array.from(this.auditData.components.values()).filter(c => c.errors.length > 0).length}

### APIs Analyzed  
- **Total APIs:** ${this.auditData.apis.size}
- **APIs with Errors:** ${Array.from(this.auditData.apis.values()).filter(a => a.errors > 0).length}

### Database Schema
- **Tables Used:** ${this.auditData.tablesUsed.size}
- **Tables Missing:** ${this.auditData.tablesMissing.size}

### Dependencies
- **File Dependencies:** ${this.auditData.fileDependencies.size}
- **Import Chains:** ${this.auditData.importChains.size}
`;
    
    // Append or update audit section
    if (content.includes('## 🔍 System Audit Findings')) {
      content = content.replace(/## 🔍 System Audit Findings[\s\S]*?(?=##|$)/, auditSection.trim());
    } else {
      content += auditSection;
    }
    
    fs.writeFileSync(archDoc, content);
    console.log('✅ System architecture documentation updated');
  }

  /**
   * Update development status documentation
   */
  async updateDevelopmentStatus() {
    const statusDoc = path.join(this.docsDir, 'core', 'DEVELOPMENT_STATUS.md');
    
    if (!fs.existsSync(statusDoc)) {
      console.log('⚠️  Development status doc not found, skipping...');
      return;
    }
    
    // Read current content
    let content = fs.readFileSync(statusDoc, 'utf8');
    
    // Add current audit status
    const auditStatus = `
## 🔍 Current System Audit Status

**Last Updated:** ${new Date().toISOString()}

### System Health
- **Components:** ${this.auditData.components.size} analyzed
- **APIs:** ${this.auditData.apis.size} analyzed  
- **Stores:** ${this.auditData.stores.size} analyzed
- **Database Tables:** ${this.auditData.tablesUsed.size} used, ${this.auditData.tablesMissing.size} missing

### Issues Found
- **Errors:** ${this.auditData.errors.length}
- **Warnings:** ${this.auditData.warnings.length}
- **Schema Mismatches:** ${this.auditData.schemaMismatches.length}

### Next Steps
${this.generateRecommendations().map(rec => `- **${rec.type}:** ${rec.description}`).join('\n')}
`;
    
    // Append or update audit status
    if (content.includes('## 🔍 Current System Audit Status')) {
      content = content.replace(/## 🔍 Current System Audit Status[\s\S]*?(?=##|$)/, auditStatus.trim());
    } else {
      content += auditStatus;
    }
    
    fs.writeFileSync(statusDoc, content);
    console.log('✅ Development status documentation updated');
  }

  /**
   * Update feature documentation
   */
  async updateFeatureDocumentation() {
    // Update database documentation
    const dbDoc = path.join(this.docsDir, 'features', 'DATABASE.md');
    if (fs.existsSync(dbDoc)) {
      let content = fs.readFileSync(dbDoc, 'utf8');
      
      const dbStatus = `
## 🔍 Database Audit Status

**Last Updated:** ${new Date().toISOString()}

### Tables in Use
${Array.from(this.auditData.tablesUsed).map(table => `- ${table}`).join('\n')}

### Missing Tables
${Array.from(this.auditData.tablesMissing).map(table => `- ${table}`).join('\n')}

### Schema Mismatches
${this.auditData.schemaMismatches.map(mismatch => `- **${mismatch.table}:** ${mismatch.error}`).join('\n')}
`;
      
      if (content.includes('## 🔍 Database Audit Status')) {
        content = content.replace(/## 🔍 Database Audit Status[\s\S]*?(?=##|$)/, dbStatus.trim());
      } else {
        content += dbStatus;
      }
      
      fs.writeFileSync(dbDoc, content);
      console.log('✅ Database documentation updated');
    }
  }

  /**
   * Stop audit and generate final report
   */
  async stopAudit() {
    console.log('🛑 Stopping system audit...');
    
    const report = this.generateAuditReport();
    
    console.log('\n📊 SYSTEM AUDIT RESULTS');
    console.log('========================');
    console.log(`📁 Components analyzed: ${report.summary.componentsAnalyzed}`);
    console.log(`🌐 APIs analyzed: ${report.summary.apisAnalyzed}`);
    console.log(`🗄️  Database tables used: ${report.summary.tablesUsed}`);
    console.log(`❌ Tables missing: ${report.summary.tablesMissing}`);
    console.log(`🚨 Errors found: ${report.summary.errorsFound}`);
    console.log(`⚠️  Warnings found: ${report.summary.warningsFound}`);
    
    console.log('\n🎯 TOP RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.type} (${rec.priority} Priority)`);
      console.log(`   ${rec.description}`);
      console.log(`   Action: ${rec.action}`);
    });
    
    // Update documentation
    await this.updateDocumentation();
    
    return report;
  }
}

// Export for use in tests
module.exports = SystemAuditTracker;

// Run if called directly
if (require.main === module) {
  const tracker = new SystemAuditTracker();
  tracker.startAudit();
  
  // Keep running until interrupted
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received interrupt signal...');
    await tracker.stopAudit();
    process.exit(0);
  });
}

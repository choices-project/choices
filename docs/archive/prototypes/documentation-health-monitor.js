#!/usr/bin/env node

/**
 * Documentation Health Monitor
 * 
 * A universal tool for maintaining healthy, up-to-date documentation.
 * Works with any project structure and documentation format.
 * 
 * Usage:
 *   npx doc-health --check
 *   npx doc-health --remind
 *   npx doc-health --config .doc-health.json
 */

const fs = require('fs');
const path = require('path');

class DocumentationHealthMonitor {
  constructor(config = {}) {
    this.config = {
      documentationFiles: config.documentationFiles || [
        'README.md',
        'docs/**/*.md',
        '*.md'
      ],
      timestampPattern: config.timestampPattern || /(\*\*Last Updated\*\*|Last Updated|Updated|Modified)/i,
      createdPattern: config.createdPattern || /(\*\*Created\*\*|Created|Date)/i,
      requiredSections: config.requiredSections || [],
      ignorePatterns: config.ignorePatterns || [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**'
      ],
      ...config
    };
  }

  /**
   * Show documentation update reminder
   */
  showReminder() {
    console.log('📚 DOCUMENTATION HEALTH REMINDER');
    console.log('================================\n');
    
    console.log('🎯 Remember: "Every successful change requires a documentation update."\n');
    
    console.log('📋 Documentation Update Checklist:');
    console.log('  ✅ Update relevant documentation files');
    console.log('  ✅ Update timestamps (Last Updated field)');
    console.log('  ✅ Add change notes if significant');
    console.log('  ✅ Update any affected guides or examples');
    console.log('  ✅ Verify documentation accuracy');
    console.log('  ✅ Commit documentation changes with code changes\n');
    
    this.showDocumentationFiles();
    this.showTimestampFormat();
    
    console.log('🚀 Happy documenting! 📖');
  }

  /**
   * Check documentation health
   */
  checkHealth() {
    console.log('🔍 Checking Documentation Health...\n');
    
    const files = this.getDocumentationFiles();
    const results = {
      total: files.length,
      healthy: 0,
      issues: [],
      missing: []
    };

    files.forEach(file => {
      const health = this.checkFileHealth(file);
      if (health.healthy) {
        results.healthy++;
        console.log(`✅ ${file} - ${health.message}`);
      } else {
        results.issues.push({ file, ...health });
        console.log(`⚠️  ${file} - ${health.message}`);
      }
    });

    this.showHealthSummary(results);
    return results;
  }

  /**
   * Get all documentation files
   */
  getDocumentationFiles() {
    const files = [];
    
    this.config.documentationFiles.forEach(pattern => {
      if (pattern.includes('**')) {
        // Handle glob patterns
        const glob = require('glob');
        const matches = glob.sync(pattern, { 
          ignore: this.config.ignorePatterns,
          nodir: true 
        });
        files.push(...matches);
      } else {
        // Handle simple patterns
        if (fs.existsSync(pattern)) {
          files.push(pattern);
        }
      }
    });

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Check health of a single file
   */
  checkFileHealth(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          healthy: false,
          message: 'File not found',
          type: 'missing'
        };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const issues = [];

      // Check for timestamps
      if (!this.config.timestampPattern.test(content)) {
        issues.push('Missing timestamp information');
      }

      if (!this.config.createdPattern.test(content)) {
        issues.push('Missing creation date');
      }

      // Check for required sections
      this.config.requiredSections.forEach(section => {
        if (!content.includes(section)) {
          issues.push(`Missing required section: ${section}`);
        }
      });

      if (issues.length > 0) {
        return {
          healthy: false,
          message: issues.join(', '),
          type: 'formatting',
          issues
        };
      }

      return {
        healthy: true,
        message: 'Timestamps present and properly formatted'
      };

    } catch (error) {
      return {
        healthy: false,
        message: `Error reading file: ${error.message}`,
        type: 'error'
      };
    }
  }

  /**
   * Show documentation files
   */
  showDocumentationFiles() {
    console.log('📁 Key Documentation Files:');
    const files = this.getDocumentationFiles();
    
    files.forEach(file => {
      const exists = fs.existsSync(file) ? '✅' : '❌';
      console.log(`  ${exists} ${file}`);
    });
    
    if (files.length === 0) {
      console.log('  ⚠️  No documentation files found');
    }
  }

  /**
   * Show timestamp format
   */
  showTimestampFormat() {
    console.log('\n📝 Recommended Timestamp Format:');
    console.log('```markdown');
    console.log('**Created**: YYYY-MM-DD');
    console.log('**Last Updated**: YYYY-MM-DD (Updated with [change description])');
    console.log('```\n');
  }

  /**
   * Show health summary
   */
  showHealthSummary(results) {
    console.log('\n📊 Documentation Health Summary:');
    console.log(`Total Files: ${results.total}`);
    console.log(`Healthy: ${results.healthy}`);
    console.log(`Issues: ${results.issues.length}`);
    
    if (results.healthy === results.total) {
      console.log('✅ All documentation files are properly formatted');
    } else {
      console.log('⚠️  Some documentation files need attention');
      
      if (results.issues.length > 0) {
        console.log('\n🔧 Issues to Fix:');
        results.issues.forEach(issue => {
          console.log(`  - ${issue.file}: ${issue.message}`);
        });
      }
    }
  }

  /**
   * Generate health report
   */
  generateReport() {
    const results = this.checkHealth();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.total,
        healthy: results.healthy,
        issues: results.issues.length,
        healthPercentage: results.total > 0 ? (results.healthy / results.total) * 100 : 0
      },
      details: results.issues,
      recommendations: this.generateRecommendations(results)
    };

    return report;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (results.issues.length > 0) {
      recommendations.push('Update documentation files with proper timestamps');
    }

    if (results.total === 0) {
      recommendations.push('Create initial documentation files');
    }

    if (results.healthy < results.total * 0.8) {
      recommendations.push('Consider implementing automated documentation checks');
    }

    return recommendations;
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  
  // Load config if provided
  let config = {};
  const configIndex = args.indexOf('--config');
  if (configIndex !== -1 && args[configIndex + 1]) {
    const configPath = args[configIndex + 1];
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error loading config:', error.message);
      process.exit(1);
    }
  }

  const monitor = new DocumentationHealthMonitor(config);

  if (args.includes('--check') || args.includes('-c')) {
    monitor.checkHealth();
  } else if (args.includes('--report') || args.includes('-r')) {
    const report = monitor.generateReport();
    console.log(JSON.stringify(report, null, 2));
  } else {
    monitor.showReminder();
  }
}

// Export for use as module
module.exports = DocumentationHealthMonitor;

// Run if called directly
if (require.main === module) {
  main();
}

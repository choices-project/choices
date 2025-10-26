#!/usr/bin/env node

/**
 * Documentation Timestamp Update Script
 * Automatically updates timestamps in documentation files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOCS_DIR = path.join(__dirname, '../docs');
const CURRENT_DATE = new Date().toISOString().split('T')[0];
const CURRENT_DATETIME = new Date().toISOString();

class DocumentationTimestampUpdater {
  constructor() {
    this.updatedFiles = [];
    this.skippedFiles = [];
    this.errors = [];
  }

  async updateAllTimestamps() {
    console.log('🕒 Updating documentation timestamps...\n');
    
    try {
      await this.updateDirectory(DOCS_DIR);
      await this.generateReport();
      
      console.log('\n✅ Timestamp update completed!');
    } catch (error) {
      console.error('❌ Error updating timestamps:', error.message);
      process.exit(1);
    }
  }

  async updateDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('archive')) {
        await this.updateDirectory(itemPath);
      } else if (item.endsWith('.md')) {
        await this.updateFileTimestamps(itemPath);
      }
    }
  }

  async updateFileTimestamps(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;
      
      // Update various timestamp formats
      const timestampPatterns = [
        { pattern: /\*\*Last Updated:\*\*\s*\d{4}-\d{2}-\d{2}/g, replacement: `**Last Updated:** ${CURRENT_DATE}` },
        { pattern: /\*Last Updated:\*\s*\d{4}-\d{2}-\d{2}/g, replacement: `*Last Updated:* ${CURRENT_DATE}` },
        { pattern: /\*\*Updated:\*\*\s*\d{4}-\d{2}-\d{2}/g, replacement: `**Updated:** ${CURRENT_DATE}` },
        { pattern: /\*Updated:\*\s*\d{4}-\d{2}-\d{2}/g, replacement: `*Updated:* ${CURRENT_DATE}` },
        { pattern: /\*\*Date:\*\*\s*\d{4}-\d{2}-\d{2}/g, replacement: `**Date:** ${CURRENT_DATE}` },
        { pattern: /\*Date:\*\s*\d{4}-\d{2}-\d{2}/g, replacement: `*Date:* ${CURRENT_DATE}` },
        { pattern: /Date:\s*\d{4}-\d{2}-\d{2}/g, replacement: `Date: ${CURRENT_DATE}` },
        { pattern: /Last Updated:\s*\d{4}-\d{2}-\d{2}/g, replacement: `Last Updated: ${CURRENT_DATE}` },
        { pattern: /Updated:\s*\d{4}-\d{2}-\d{2}/g, replacement: `Updated: ${CURRENT_DATE}` }
      ];
      
      // Update ISO datetime patterns
      const datetimePatterns = [
        { pattern: /\*\*Last Updated:\*\*\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, replacement: `**Last Updated:** ${CURRENT_DATETIME}` },
        { pattern: /\*Last Updated:\*\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, replacement: `*Last Updated:* ${CURRENT_DATETIME}` }
      ];
      
      // Apply date patterns
      for (const { pattern, replacement } of timestampPatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          updated = true;
        }
      }
      
      // Apply datetime patterns
      for (const { pattern, replacement } of datetimePatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          updated = true;
        }
      }
      
      // Add timestamp if none exists and file is substantial
      if (!content.includes('Last Updated:') && !content.includes('Updated:') && content.length > 100) {
        const headerPattern = /^(# .+)$/m;
        if (headerPattern.test(content)) {
          content = content.replace(headerPattern, `$1\n\n**Last Updated:** ${CURRENT_DATE}`);
          updated = true;
        }
      }
      
      if (updated) {
        fs.writeFileSync(filePath, content);
        this.updatedFiles.push(path.relative(DOCS_DIR, filePath));
        console.log(`✅ Updated: ${path.relative(DOCS_DIR, filePath)}`);
      } else {
        this.skippedFiles.push(path.relative(DOCS_DIR, filePath));
      }
      
    } catch (error) {
      this.errors.push(`${filePath}: ${error.message}`);
      console.log(`❌ Error updating ${path.relative(DOCS_DIR, filePath)}: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 Timestamp Update Report');
    console.log('============================');
    console.log(`Updated Files: ${this.updatedFiles.length}`);
    console.log(`Skipped Files: ${this.skippedFiles.length}`);
    console.log(`Errors: ${this.errors.length}`);
    
    if (this.updatedFiles.length > 0) {
      console.log('\n✅ Updated Files:');
      this.updatedFiles.forEach(file => console.log(`  - ${file}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
  }
}

// Run timestamp update
const updater = new DocumentationTimestampUpdater();
updater.updateAllTimestamps();

#!/usr/bin/env node

/**
 * Documentation Archiving Script
 * Automatically archives outdated documentation
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOCS_DIR = path.join(__dirname, '../docs');
const ARCHIVE_DIR = path.join(DOCS_DIR, 'archive/outdated');
const CURRENT_DATE = new Date();
const OUTDATED_THRESHOLD_DAYS = 90; // Files older than 90 days

class DocumentationArchiver {
  constructor() {
    this.archivedFiles = [];
    this.skippedFiles = [];
    this.errors = [];
  }

  async archiveOutdatedDocs() {
    console.log('📦 Archiving outdated documentation...\n');
    
    try {
      // Ensure archive directory exists
      if (!fs.existsSync(ARCHIVE_DIR)) {
        fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
      }
      
      await this.scanForOutdatedFiles(DOCS_DIR);
      await this.generateReport();
      
      console.log('\n✅ Documentation archiving completed!');
    } catch (error) {
      console.error('❌ Error archiving documentation:', error.message);
      process.exit(1);
    }
  }

  async scanForOutdatedFiles(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('archive')) {
        await this.scanForOutdatedFiles(itemPath);
      } else if (item.endsWith('.md') && this.isOutdated(itemPath, stat)) {
        await this.archiveFile(itemPath);
      }
    }
  }

  isOutdated(filePath, stat) {
    const fileAge = (CURRENT_DATE - stat.mtime) / (1000 * 60 * 60 * 24);
    return fileAge > OUTDATED_THRESHOLD_DAYS;
  }

  async archiveFile(filePath) {
    try {
      const relativePath = path.relative(DOCS_DIR, filePath);
      const archivePath = path.join(ARCHIVE_DIR, relativePath);
      
      // Create archive directory structure
      const archiveDir = path.dirname(archivePath);
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }
      
      // Copy file to archive
      fs.copyFileSync(filePath, archivePath);
      
      // Add archive notice to original file
      const content = fs.readFileSync(filePath, 'utf8');
      const archiveNotice = `\n\n---\n\n> ⚠️ **ARCHIVED**: This documentation has been archived due to age. Please check the [archive directory](archive/outdated/${relativePath}) for the latest version.\n> **Archived on**: ${CURRENT_DATE.toISOString().split('T')[0]}`;
      
      fs.writeFileSync(filePath, content + archiveNotice);
      
      this.archivedFiles.push(relativePath);
      console.log(`📦 Archived: ${relativePath}`);
      
    } catch (error) {
      this.errors.push(`${filePath}: ${error.message}`);
      console.log(`❌ Error archiving ${path.relative(DOCS_DIR, filePath)}: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 Documentation Archiving Report');
    console.log('==================================');
    console.log(`Archived Files: ${this.archivedFiles.length}`);
    console.log(`Skipped Files: ${this.skippedFiles.length}`);
    console.log(`Errors: ${this.errors.length}`);
    
    if (this.archivedFiles.length > 0) {
      console.log('\n📦 Archived Files:');
      this.archivedFiles.forEach(file => console.log(`  - ${file}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
  }
}

// Run archiving
const archiver = new DocumentationArchiver();
archiver.archiveOutdatedDocs();

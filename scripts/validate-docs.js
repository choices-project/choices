#!/usr/bin/env node

/**
 * Documentation Validation Script
 * Validates documentation structure, completeness, and quality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DOCS_DIR = path.join(__dirname, '../docs');
const REQUIRED_FILES = [
  'README.md',
  'core/DATABASE_SCHEMA_DOCUMENTATION.md',
  'core/API_ENDPOINTS_DOCUMENTATION.md',
  'core/SYSTEM_ARCHITECTURE_DOCUMENTATION.md',
  'features/AUTH.md',
  'features/POLLS.md',
  'features/ANALYTICS.md',
  'features/CIVICS.md',
  'features/PWA.md'
];

const REQUIRED_SECTIONS = {
  'README.md': ['# ', '## 🎯', '## 📋', '## 🚀'],
  'core/DATABASE_SCHEMA_DOCUMENTATION.md': ['# ', '## 📊', '## 🔧'],
  'core/API_ENDPOINTS_DOCUMENTATION.md': ['# ', '## 📡', '## 🔗'],
  'features/AUTH.md': ['# ', '## 🔐', '## 🛡️']
};

class DocumentationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      missingFiles: 0
    };
  }

  async validate() {
    console.log('🔍 Starting documentation validation...\n');
    
    try {
      await this.validateRequiredFiles();
      await this.validateFileStructure();
      await this.validateContent();
      await this.validateLinks();
      await this.generateReport();
      
      if (this.errors.length > 0) {
        console.log('\n❌ Documentation validation failed!');
        process.exit(1);
      } else {
        console.log('\n✅ Documentation validation passed!');
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Validation error:', error.message);
      process.exit(1);
    }
  }

  async validateRequiredFiles() {
    console.log('📋 Checking required files...');
    
    for (const file of REQUIRED_FILES) {
      const filePath = path.join(DOCS_DIR, file);
      this.stats.totalFiles++;
      
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing required file: ${file}`);
        this.stats.missingFiles++;
        console.log(`❌ Missing: ${file}`);
      } else {
        this.stats.validFiles++;
        console.log(`✅ Found: ${file}`);
      }
    }
  }

  async validateFileStructure() {
    console.log('\n🏗️ Validating file structure...');
    
    const coreFiles = fs.readdirSync(path.join(DOCS_DIR, 'core'));
    const featureFiles = fs.readdirSync(path.join(DOCS_DIR, 'features'));
    
    // Check for essential core files
    const essentialCore = ['DATABASE_SCHEMA_DOCUMENTATION.md', 'API_ENDPOINTS_DOCUMENTATION.md'];
    for (const file of essentialCore) {
      if (!coreFiles.includes(file)) {
        this.warnings.push(`Missing essential core file: ${file}`);
      }
    }
    
    // Check for essential feature files
    const essentialFeatures = ['AUTH.md', 'POLLS.md', 'ANALYTICS.md'];
    for (const file of essentialFeatures) {
      if (!featureFiles.includes(file)) {
        this.warnings.push(`Missing essential feature file: ${file}`);
      }
    }
  }

  async validateContent() {
    console.log('\n📝 Validating content quality...');
    
    for (const file of REQUIRED_FILES) {
      const filePath = path.join(DOCS_DIR, file);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        await this.validateFileContent(file, content);
      }
    }
  }

  async validateFileContent(filename, content) {
    // Check for required sections
    if (REQUIRED_SECTIONS[filename]) {
      for (const section of REQUIRED_SECTIONS[filename]) {
        if (!content.includes(section)) {
          this.warnings.push(`Missing section in ${filename}: ${section}`);
        }
      }
    }
    
    // Check for minimum content length
    if (content.length < 500) {
      this.warnings.push(`File ${filename} is too short (${content.length} chars)`);
    }
    
    // Check for last updated timestamp
    if (!content.includes('Last Updated:') && !content.includes('Updated:')) {
      this.warnings.push(`File ${filename} missing last updated timestamp`);
    }
    
    // Check for proper markdown structure
    if (!content.includes('# ')) {
      this.warnings.push(`File ${filename} missing main heading`);
    }
  }

  async validateLinks() {
    console.log('\n🔗 Validating internal links...');
    
    try {
      // Use markdown-link-check if available
      execSync('npx markdown-link-check docs/**/*.md --quiet', { stdio: 'pipe' });
      console.log('✅ All links are valid');
    } catch (error) {
      this.warnings.push('Some links may be broken - check manually');
    }
  }

  async generateReport() {
    console.log('\n📊 Documentation Validation Report');
    console.log('=====================================');
    console.log(`Total Files: ${this.stats.totalFiles}`);
    console.log(`Valid Files: ${this.stats.validFiles}`);
    console.log(`Missing Files: ${this.stats.missingFiles}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
  }
}

// Run validation
const validator = new DocumentationValidator();
validator.validate();

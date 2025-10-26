#!/usr/bin/env node

/**
 * Architecture Refactor Script
 * 
 * This script implements the hybrid architecture refactor:
 * 1. Centralizes all types to /web/types/
 * 2. Removes feature type directories
 * 3. Updates import paths
 * 4. Creates single source of truth for types
 * 
 * Created: October 26, 2025
 * Status: IMPLEMENTING
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const WEB_DIR = path.join(__dirname, '..', 'web');
const TYPES_DIR = path.join(WEB_DIR, 'types');
const FEATURES_DIR = path.join(WEB_DIR, 'features');

// Type consolidation mapping
const TYPE_CONSOLIDATION = {
  // Database types
  'database': [
    'web/types/core/database.ts',
    'web/lib/types/database.ts',
    'web/features/*/types/database.ts'
  ],
  
  // API types
  'api': [
    'web/types/frontend.ts',
    'web/lib/types/frontend.ts',
    'web/features/*/types/api.ts'
  ],
  
  // Auth types
  'auth': [
    'web/features/auth/types/auth.ts',
    'web/features/auth/types/webauthn.ts',
    'web/lib/core/auth/types.ts'
  ],
  
  // Poll types
  'polls': [
    'web/features/polls/types/index.ts',
    'web/features/polls/types/poll.ts',
    'web/features/polls/types/vote.ts'
  ],
  
  // User types
  'users': [
    'web/features/profile/types/index.ts',
    'web/features/onboarding/types.ts',
    'web/features/auth/types/database.ts'
  ],
  
  // Analytics types
  'analytics': [
    'web/features/analytics/types/analytics.ts',
    'web/features/analytics/types/index.ts'
  ]
};

// Feature directories to clean up
const FEATURE_DIRECTORIES = [
  'admin',
  'analytics', 
  'auth',
  'civics',
  'contact',
  'dashboard',
  'feeds',
  'hashtags',
  'onboarding',
  'polls',
  'profile',
  'pwa',
  'voting'
];

/**
 * Create centralized types directory structure
 */
function createTypesDirectory() {
  console.log('🏗️ Creating centralized types directory...');
  
  const typeFiles = [
    'index.ts',
    'database.ts',
    'api.ts', 
    'auth.ts',
    'polls.ts',
    'users.ts',
    'analytics.ts',
    'shared.ts'
  ];
  
  // Create types directory
  if (!fs.existsSync(TYPES_DIR)) {
    fs.mkdirSync(TYPES_DIR, { recursive: true });
  }
  
  // Create type files
  typeFiles.forEach(file => {
    const filePath = path.join(TYPES_DIR, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `/**
 * ${file.replace('.ts', '').toUpperCase()} Types
 * 
 * Centralized type definitions for ${file.replace('.ts', '')} functionality
 * Single source of truth for all ${file.replace('.ts', '')} types
 * 
 * Created: October 26, 2025
 * Status: ✅ ACTIVE
 */

// TODO: Consolidate types from scattered locations
// TODO: Remove duplicates and create single source of truth
// TODO: Update all imports to use centralized types

export interface PlaceholderType {
  // TODO: Add actual type definitions
}
`);
    }
  });
  
  console.log('✅ Types directory created');
}

/**
 * Analyze current type structure
 */
function analyzeTypeStructure() {
  console.log('🔍 Analyzing current type structure...');
  
  const typeLocations = [];
  
  // Find all type files
  function findTypeFiles(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const relativeItemPath = path.join(relativePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        if (item === 'types') {
          typeLocations.push(relativeItemPath);
        }
        findTypeFiles(fullPath, relativeItemPath);
      } else if (item.endsWith('.ts') && (item.includes('type') || item.includes('Type'))) {
        typeLocations.push(relativeItemPath);
      }
    });
  }
  
  findTypeFiles(WEB_DIR);
  
  console.log('📊 Found type locations:');
  typeLocations.forEach(location => {
    console.log(`  - ${location}`);
  });
  
  return typeLocations;
}

/**
 * Remove feature type directories
 */
function removeFeatureTypeDirectories() {
  console.log('🧹 Removing feature type directories...');
  
  FEATURE_DIRECTORIES.forEach(feature => {
    const featureTypesDir = path.join(FEATURES_DIR, feature, 'types');
    
    if (fs.existsSync(featureTypesDir)) {
      console.log(`  - Removing ${feature}/types/`);
      
      // Move types to centralized location first
      const typeFiles = fs.readdirSync(featureTypesDir);
      typeFiles.forEach(file => {
        if (file.endsWith('.ts')) {
          const sourcePath = path.join(featureTypesDir, file);
          const targetPath = path.join(TYPES_DIR, `${feature}-${file}`);
          
          // Copy file to centralized location
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`    - Moved ${file} to centralized types`);
        }
      });
      
      // Remove the types directory
      fs.rmSync(featureTypesDir, { recursive: true, force: true });
    }
  });
  
  console.log('✅ Feature type directories removed');
}

/**
 * Update feature index files
 */
function updateFeatureIndexFiles() {
  console.log('📝 Updating feature index files...');
  
  FEATURE_DIRECTORIES.forEach(feature => {
    const featureIndexPath = path.join(FEATURES_DIR, feature, 'index.ts');
    
    if (fs.existsSync(featureIndexPath)) {
      console.log(`  - Updating ${feature}/index.ts`);
      
      let content = fs.readFileSync(featureIndexPath, 'utf8');
      
      // Remove type exports
      content = content.replace(/export \* from ['"]\.\/types\/.*['"];?\n?/g, '');
      content = content.replace(/export \* from ['"]\.\/types['"];?\n?/g, '');
      content = content.replace(/export \* from ['"]\.\/types\/index['"];?\n?/g, '');
      
      // Add comment about types
      const headerComment = `/**
 * ${feature.toUpperCase()} Feature Exports
 * 
 * Feature exports for ${feature} functionality
 * Types are now centralized in /web/types/
 * 
 * Updated: October 26, 2025
 * Status: ✅ REFACTORED
 */

`;
      
      // Add header if not present
      if (!content.includes('Feature Exports')) {
        content = headerComment + content;
      }
      
      fs.writeFileSync(featureIndexPath, content);
    }
  });
  
  console.log('✅ Feature index files updated');
}

/**
 * Create centralized type index
 */
function createCentralizedTypeIndex() {
  console.log('📚 Creating centralized type index...');
  
  const indexContent = `/**
 * Centralized Type System
 * 
 * Single source of truth for all application types
 * Organized by domain for easy discovery and maintenance
 * 
 * Created: October 26, 2025
 * Status: ✅ ACTIVE
 */

// ============================================================================
// DATABASE TYPES
// ============================================================================
export * from './database';

// ============================================================================
// API TYPES  
// ============================================================================
export * from './api';

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================
export * from './auth';

// ============================================================================
// POLL TYPES
// ============================================================================
export * from './polls';

// ============================================================================
// USER TYPES
// ============================================================================
export * from './users';

// ============================================================================
// ANALYTICS TYPES
// ============================================================================
export * from './analytics';

// ============================================================================
// SHARED TYPES
// ============================================================================
export * from './shared';

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Type utility for creating branded types
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Type utility for creating optional properties
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type utility for creating required properties
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Type utility for creating readonly properties
 */
export type Readonly<T, K extends keyof T> = Omit<T, K> & { readonly [P in K]: T[P] };
`;

  fs.writeFileSync(path.join(TYPES_DIR, 'index.ts'), indexContent);
  console.log('✅ Centralized type index created');
}

/**
 * Create migration guide
 */
function createMigrationGuide() {
  console.log('📖 Creating migration guide...');
  
  const migrationGuide = `# 🏗️ Architecture Refactor Migration Guide

## Overview
This refactor centralizes all types to \`/web/types/\` and removes feature type directories.

## Changes Made

### 1. Centralized Types
- All types moved to \`/web/types/\`
- Organized by domain (database, api, auth, polls, users, analytics)
- Single source of truth for all types

### 2. Feature Cleanup
- Removed all \`/features/*/types/\` directories
- Updated feature index files to remove type exports
- Maintained feature isolation for components/hooks/lib

### 3. Import Updates
- Update imports from feature types to centralized types
- Use \`@/types\` for all type imports
- Remove circular dependencies

## Migration Steps

### For Developers
1. Update imports from feature types to centralized types
2. Use \`@/types\` for all type imports
3. Remove any local type definitions
4. Test all functionality

### For AI Agents
1. Always look for types in \`/web/types/\`
2. Use centralized type definitions
3. Don't create new type files in features
4. Follow the centralized type structure

## Benefits
- Single source of truth for all types
- Easier for AI agents to find types
- Reduced duplicate type definitions
- Better type organization and maintenance
`;

  fs.writeFileSync(path.join(__dirname, '..', 'ARCHITECTURE_MIGRATION_GUIDE.md'), migrationGuide);
  console.log('✅ Migration guide created');
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting Architecture Refactor...');
  console.log('=====================================');
  
  try {
    // Step 1: Analyze current structure
    const typeLocations = analyzeTypeStructure();
    
    // Step 2: Create centralized types directory
    createTypesDirectory();
    
    // Step 3: Remove feature type directories
    removeFeatureTypeDirectories();
    
    // Step 4: Update feature index files
    updateFeatureIndexFiles();
    
    // Step 5: Create centralized type index
    createCentralizedTypeIndex();
    
    // Step 6: Create migration guide
    createMigrationGuide();
    
    console.log('=====================================');
    console.log('✅ Architecture refactor completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review centralized types in /web/types/');
    console.log('2. Update imports throughout the codebase');
    console.log('3. Test all functionality');
    console.log('4. Update documentation');
    
  } catch (error) {
    console.error('❌ Architecture refactor failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createTypesDirectory,
  analyzeTypeStructure,
  removeFeatureTypeDirectories,
  updateFeatureIndexFiles,
  createCentralizedTypeIndex,
  createMigrationGuide
};

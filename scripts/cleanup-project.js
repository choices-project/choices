#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Files to remove
  backupPatterns: [
    '*.backup',
    '*.bak',
    '*~',
    '*.tmp',
    '*.orig',
    '*.rej'
  ],
  
  // Test files to remove (temporary development files)
  testFilesToRemove: [
    'scripts/test-cleanup.js',
    'scripts/test-fix.js',
    'scripts/safe-cleanup.js',
    'scripts/careful-cleanup.js'
  ],
  
  // Directories to exclude
  excludeDirs: [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.vercel'
  ],
  
  // File extensions to process
  includeExtensions: ['.js', '.jsx', '.ts', '.tsx', '.md', '.json', '.html', '.css', '.scss']
};

function shouldExcludeDir(dirPath) {
  return CONFIG.excludeDirs.some(excludeDir => 
    dirPath.includes(excludeDir)
  );
}

function isBackupFile(filename) {
  return CONFIG.backupPatterns.some(pattern => {
    const regex = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(regex).test(filename);
  });
}

function findBackupFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!shouldExcludeDir(fullPath)) {
        findBackupFiles(fullPath, files);
      }
    } else if (isBackupFile(item)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function removeFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`Error removing ${filePath}:`, error.message);
    return false;
  }
}

function cleanupProject() {
  console.log('🧹 Starting project cleanup...\n');
  
  // Find and remove backup files
  console.log('📁 Scanning for backup files...');
  const backupFiles = findBackupFiles('.');
  console.log(`Found ${backupFiles.length} backup files`);
  
  let removedBackups = 0;
  for (const file of backupFiles) {
    if (removeFile(file)) {
      removedBackups++;
      console.log(`✅ Removed: ${file}`);
    }
  }
  
  // Remove specific test files
  console.log('\n🧪 Removing temporary test files...');
  let removedTests = 0;
  for (const testFile of CONFIG.testFilesToRemove) {
    if (fs.existsSync(testFile)) {
      if (removeFile(testFile)) {
        removedTests++;
        console.log(`✅ Removed: ${testFile}`);
      }
    }
  }
  
  // Summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Backup files removed: ${removedBackups}`);
  console.log(`   Test files removed: ${removedTests}`);
  console.log(`   Total files removed: ${removedBackups + removedTests}`);
  
  if (removedBackups + removedTests > 0) {
    console.log('\n✨ Project cleanup completed successfully!');
  } else {
    console.log('\n✨ No files to clean up - project is already clean!');
  }
}

// Run cleanup
if (require.main === module) {
  cleanupProject();
}

module.exports = { cleanupProject, findBackupFiles };

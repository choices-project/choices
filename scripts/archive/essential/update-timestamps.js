#!/usr/bin/env node

/**
 * Timestamp Update Utility
 * 
 * Automatically updates timestamps in files when they are modified.
 * This ensures all documentation and code comments reflect accurate dates.
 * 
 * @fileoverview Automatic timestamp management for project files
 * @author Choices Platform Team
 * @created 2025-10-24
 * @updated 2025-10-24
 * @status ACTIVE
 * @version 1.0.0
 * 
 * @requires fs
 * @requires path
 * 
 * @example
 * // Update timestamps in a specific file
 * node scripts/update-timestamps.js path/to/file.js
 */

const fs = require('fs');
const path = require('path');

/**
 * Get current timestamp in ISO format
 * @returns {string} Current timestamp
 */
function getCurrentTimestamp() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Update timestamps in a file ONLY if it has been modified
 * @param {string} filePath - Path to the file to update
 * @param {string} [newTimestamp] - New timestamp (defaults to current date)
 * @param {boolean} [forceUpdate] - Force update even if file wasn't modified (default: false)
 */
function updateFileTimestamps(filePath, newTimestamp = getCurrentTimestamp(), forceUpdate = false) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return;
    }

    // Check if file was actually modified recently (within last 5 minutes)
    const stats = fs.statSync(filePath);
    const now = new Date();
    const fileModified = new Date(stats.mtime);
    const timeDiff = now - fileModified;
    const recentlyModified = timeDiff < 5 * 60 * 1000; // 5 minutes

    if (!recentlyModified && !forceUpdate) {
      console.log(`ℹ️  File not recently modified, skipping: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Update various timestamp patterns
    const timestampPatterns = [
      // JSDoc @created patterns
      { pattern: /@created\s+\d{4}-\d{2}-\d{2}/g, replacement: `@created ${newTimestamp}` },
      { pattern: /@updated\s+\d{4}-\d{2}-\d{2}/g, replacement: `@updated ${newTimestamp}` },
      { pattern: /@modified\s+\d{4}-\d{2}-\d{2}/g, replacement: `@modified ${newTimestamp}` },
      
      // Comment patterns
      { pattern: /\/\*\*[\s\S]*?Created:\s+\d{4}-\d{2}-\d{2}[\s\S]*?\*\//g, 
        replacement: (match) => match.replace(/\d{4}-\d{2}-\d{2}/, newTimestamp) },
      { pattern: /\/\*\*[\s\S]*?Updated:\s+\d{4}-\d{2}-\d{2}[\s\S]*?\*\//g,
        replacement: (match) => match.replace(/\d{4}-\d{2}-\d{2}/, newTimestamp) },
      
      // Markdown patterns
      { pattern: /\*\*Created:\*\*\s+\d{4}-\d{2}-\d{2}/g, replacement: `**Created:** ${newTimestamp}` },
      { pattern: /\*\*Updated:\*\*\s+\d{4}-\d{2}-\d{2}/g, replacement: `**Updated:** ${newTimestamp}` },
      { pattern: /\*\*Last Updated:\*\*\s+\d{4}-\d{2}-\d{2}/g, replacement: `**Last Updated:** ${newTimestamp}` },
      
      // ISO timestamp patterns
      { pattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, replacement: new Date().toISOString() }
    ];

    // Apply all patterns
    timestampPatterns.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    // If no existing timestamps found, add a basic updated timestamp
    if (!modified && (content.includes('@created') || content.includes('Created:') || content.includes('Updated:'))) {
      // Add updated timestamp to existing documentation
      if (content.includes('@created') && !content.includes('@updated')) {
        content = content.replace(/(@created\s+\d{4}-\d{2}-\d{2})/, `$1\n * @updated ${newTimestamp}`);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated timestamps in: ${filePath}`);
    } else {
      console.log(`ℹ️  No timestamps to update in: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error updating timestamps in ${filePath}:`, error.message);
  }
}

/**
 * Update timestamps in multiple files
 * @param {string[]} filePaths - Array of file paths to update
 * @param {boolean} [forceUpdate] - Force update all files
 */
function updateMultipleFiles(filePaths, forceUpdate = false) {
  console.log(`🔄 Updating timestamps in ${filePaths.length} files...`);
  
  filePaths.forEach(filePath => {
    updateFileTimestamps(filePath, getCurrentTimestamp(), forceUpdate);
  });
  
  console.log('✅ Timestamp update complete');
}

/**
 * Update timestamps for files modified in Git
 * @param {string} [since] - Git reference to check since (default: 'HEAD~1')
 */
function updateModifiedFiles(since = 'HEAD~1') {
  try {
    console.log(`🔍 Checking for files modified since ${since}...`);
    
    // Get list of modified files from Git
    const { execSync } = require('child_process');
    const modifiedFiles = execSync(`git diff --name-only ${since}`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(file => file && file.match(/\.(js|ts|tsx|jsx|md)$/));
    
    if (modifiedFiles.length === 0) {
      console.log('ℹ️  No modified files found');
      return;
    }
    
    console.log(`📝 Found ${modifiedFiles.length} modified files:`);
    modifiedFiles.forEach(file => console.log(`  - ${file}`));
    
    // Update timestamps for modified files
    modifiedFiles.forEach(file => {
      updateFileTimestamps(file, getCurrentTimestamp(), true);
    });
    
    console.log('✅ Updated timestamps for all modified files');
    
  } catch (error) {
    console.error('❌ Error checking Git status:', error.message);
    console.log('ℹ️  Falling back to manual file list...');
  }
}

/**
 * Find all files that might need timestamp updates
 * @param {string} directory - Directory to search
 * @returns {string[]} Array of file paths
 */
function findFilesNeedingUpdates(directory) {
  const files = [];
  
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git', '.next', 'dist'].includes(item)) {
        scanDir(fullPath);
      } else if (item.match(/\.(js|ts|tsx|jsx|md)$/)) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(directory);
  return files;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📝 Timestamp Update Utility');
    console.log('Usage: node scripts/update-timestamps.js [file1] [file2] ...');
    console.log('       node scripts/update-timestamps.js --modified');
    console.log('       node scripts/update-timestamps.js --all');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/update-timestamps.js web/app/page.tsx');
    console.log('  node scripts/update-timestamps.js --modified');
    console.log('  node scripts/update-timestamps.js --all');
    process.exit(0);
  }
  
  if (args[0] === '--modified') {
    updateModifiedFiles();
  } else if (args[0] === '--all') {
    console.log('🔍 Finding all files that might need timestamp updates...');
    const files = findFilesNeedingUpdates(process.cwd());
    updateMultipleFiles(files, true);
  } else {
    updateMultipleFiles(args);
  }
}

module.exports = {
  updateFileTimestamps,
  updateMultipleFiles,
  updateModifiedFiles,
  getCurrentTimestamp
};

#!/usr/bin/env node

/**
 * Reorganization Script
 * 
 * Implements the expert's refined reorganization plan with enhanced safety features.
 * This script moves files to their new locations and updates imports accordingly.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, unlinkSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry');
const isVerbose = args.includes('--verbose');

// Read reorganization plan
const planPath = join(__dirname, 'plan.json');
const plan = JSON.parse(readFileSync(planPath, 'utf8'));

console.log('🚀 Starting reorganization...\n');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No files will be moved\n');
}

// Safety checks
console.log('🛡️ Running safety checks...\n');

// Check for uncommitted changes
try {
  const gitStatus = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.error('❌ Uncommitted changes detected. Please commit or stash before reorganization.');
    console.error('Uncommitted files:');
    console.error(gitStatus);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to check git status:', error.message);
  process.exit(1);
}

console.log('✅ No uncommitted changes found');

// Check if we're on a feature branch
try {
  const currentBranch = execSync('git branch --show-current', { cwd: projectRoot, encoding: 'utf8' }).trim();
  if (currentBranch === 'main' || currentBranch === 'master') {
    console.log('⚠️  Warning: You are on the main branch. Consider creating a feature branch first.');
  } else {
    console.log(`✅ On feature branch: ${currentBranch}`);
  }
} catch (error) {
  console.error('❌ Failed to check current branch:', error.message);
  process.exit(1);
}

// Create safety branch if not in dry run
if (!isDryRun) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safetyBranch = `reorg-safety-${timestamp}`;
    execSync(`git checkout -b ${safetyBranch}`, { cwd: projectRoot });
    console.log(`✅ Created safety branch: ${safetyBranch}`);
  } catch (error) {
    console.error('❌ Failed to create safety branch:', error.message);
    process.exit(1);
  }
}

console.log('\n📋 Reorganization Plan:');
console.log(`  - ${plan.reorganization.moves.length} files to move`);
console.log(`  - ${plan.reorganization.importUpdates.length} import patterns to update`);
console.log(`  - ${plan.reorganization.barrelExports.length} barrel exports to create`);

if (isDryRun) {
  console.log('\n🔍 DRY RUN - Files that would be moved:');
  plan.reorganization.moves.forEach((move, index) => {
    console.log(`  ${index + 1}. ${move.from} → ${move.to}`);
    console.log(`     Reason: ${move.reason}`);
  });
  
  console.log('\n🔍 DRY RUN - Import patterns that would be updated:');
  plan.reorganization.importUpdates.forEach((update, index) => {
    console.log(`  ${index + 1}. ${update.pattern} → ${update.replacement}`);
  });
  
  console.log('\n🔍 DRY RUN - Barrel exports that would be created:');
  plan.reorganization.barrelExports.forEach((barrel, index) => {
    console.log(`  ${index + 1}. ${barrel.file}`);
    barrel.exports.forEach(exportLine => {
      console.log(`     ${exportLine}`);
    });
  });
  
  console.log('\n✅ Dry run complete. Use without --dry to execute.');
  process.exit(0);
}

// Execute reorganization
console.log('\n🔄 Executing reorganization...\n');

// Step 1: Create directory structure
console.log('📁 Creating directory structure...');
const directories = new Set();
plan.reorganization.moves.forEach(move => {
  const targetDir = dirname(join(projectRoot, move.to));
  directories.add(targetDir);
});

directories.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`  ✅ Created: ${dir}`);
  }
});

// Step 2: Move files
console.log('\n📦 Moving files...');
plan.reorganization.moves.forEach((move, index) => {
  const sourcePath = join(projectRoot, move.from);
  const targetPath = join(projectRoot, move.to);
  
  if (!existsSync(sourcePath)) {
    console.log(`  ⚠️  Source not found: ${move.from}`);
    return;
  }
  
  try {
    copyFileSync(sourcePath, targetPath);
    unlinkSync(sourcePath);
    console.log(`  ✅ ${index + 1}. ${move.from} → ${move.to}`);
  } catch (error) {
    console.error(`  ❌ Failed to move ${move.from}:`, error.message);
  }
});

// Step 3: Update imports
console.log('\n🔄 Updating imports...');
const importUpdateCount = updateImports(plan.reorganization.importUpdates);
console.log(`  ✅ Updated ${importUpdateCount} import statements`);

// Step 4: Create barrel exports
console.log('\n📦 Creating barrel exports...');
plan.reorganization.barrelExports.forEach((barrel, index) => {
  const barrelPath = join(projectRoot, barrel.file);
  const barrelContent = barrel.exports.join('\n') + '\n';
  
  try {
    writeFileSync(barrelPath, barrelContent);
    console.log(`  ✅ ${index + 1}. Created: ${barrel.file}`);
  } catch (error) {
    console.error(`  ❌ Failed to create ${barrel.file}:`, error.message);
  }
});

// Step 5: Update tsconfig.json
console.log('\n⚙️  Updating tsconfig.json...');
updateTsconfig();

console.log('\n✅ Reorganization complete!');
console.log('\n📋 Next steps:');
console.log('  1. Run: node scripts/verify-aliases.mjs');
console.log('  2. Run: npm run type-check:strict');
console.log('  3. Run: npm run lint:strict');
console.log('  4. Run: npm run build');
console.log('  5. Run: npm run test:unit');

/**
 * Update import statements in all TypeScript/JavaScript files
 */
function updateImports(importUpdates) {
  let totalUpdates = 0;
  
  // Find all TypeScript and JavaScript files
  const files = findTsFiles(projectRoot);
  
  files.forEach(filePath => {
    try {
      const content = readFileSync(filePath, 'utf8');
      let updatedContent = content;
      let fileUpdates = 0;
      
      importUpdates.forEach(update => {
        const pattern = new RegExp(update.pattern.replace(/\*/g, '\\*'), 'g');
        const matches = updatedContent.match(pattern);
        if (matches) {
          updatedContent = updatedContent.replace(pattern, update.replacement);
          fileUpdates += matches.length;
        }
      });
      
      if (fileUpdates > 0) {
        writeFileSync(filePath, updatedContent);
        totalUpdates += fileUpdates;
        if (isVerbose) {
          console.log(`    Updated ${fileUpdates} imports in: ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`    ❌ Failed to update imports in ${filePath}:`, error.message);
    }
  });
  
  return totalUpdates;
}

/**
 * Find all TypeScript and JavaScript files
 */
function findTsFiles(dir) {
  const files = [];
  
  try {
    const entries = execSync(`find "${dir}" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx"`, { 
      cwd: projectRoot, 
      encoding: 'utf8' 
    });
    
    entries.split('\n').forEach(file => {
      if (file.trim() && !file.includes('node_modules') && !file.includes('.next')) {
        files.push(file.trim());
      }
    });
  } catch (error) {
    console.error('❌ Failed to find TypeScript files:', error.message);
  }
  
  return files;
}

/**
 * Update tsconfig.json with minimal alias set
 */
function updateTsconfig() {
  const tsconfigPath = join(projectRoot, 'tsconfig.json');
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
  
  // Set minimal alias set
  tsconfig.compilerOptions.paths = {
    '@/*': ['./*'],
    '@/lib/*': ['./lib/*'],
    '@/utils/supabase/server': ['./utils/supabase/server'],
    '@/lib/supabase/server': ['./utils/supabase/server']
  };
  
  // Add expert's recommended TypeScript settings
  tsconfig.compilerOptions.strict = true;
  tsconfig.compilerOptions.noUncheckedIndexedAccess = true;
  tsconfig.compilerOptions.noImplicitOverride = true;
  tsconfig.compilerOptions.exactOptionalPropertyTypes = true;
  tsconfig.compilerOptions.moduleDetection = 'force';
  tsconfig.compilerOptions.verbatimModuleSyntax = true;
  
  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  console.log('  ✅ Updated tsconfig.json with minimal aliases and strict settings');
}

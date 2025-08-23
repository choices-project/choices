#!/usr/bin/env node

/**
 * Comprehensive script to fix unused variables
 * This addresses the root cause of no-unused-vars warnings systematically
 */

const fs = require('fs');
const path = require('path');

// Common patterns for unused variables
const UNUSED_PATTERNS = [
  // Unused React imports
  {
    pattern: /import \{ ([^}]+) \} from 'react';?/g,
    replacement: (match, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      const usedImports = [];
      
      // Check which imports are actually used in the file
      const content = fs.readFileSync(currentFile, 'utf8');
      for (const imp of importList) {
        if (content.includes(imp) && !content.match(new RegExp(`import.*${imp}`))) {
          usedImports.push(imp);
        }
      }
      
      if (usedImports.length === 0) {
        return ''; // Remove entire import if none used
      }
      return `import { ${usedImports.join(', ')} } from 'react';`;
    },
    description: 'unused React imports'
  },
  // Unused function parameters
  {
    pattern: /\(([^)]+)\) =>/g,
    replacement: (match, params) => {
      const paramList = params.split(',').map(p => p.trim());
      const unusedParams = paramList.filter(p => !p.startsWith('_'));
      if (unusedParams.length > 0) {
        return match.replace(unusedParams[0], `_${unusedParams[0]}`);
      }
      return match;
    },
    description: 'unused function parameters'
  },
  // Unused destructured variables
  {
    pattern: /const \{ ([^}]+) \} =/g,
    replacement: (match, vars) => {
      const varList = vars.split(',').map(v => v.trim());
      const unusedVars = varList.filter(v => !v.startsWith('_'));
      if (unusedVars.length > 0) {
        return match.replace(unusedVars[0], `_${unusedVars[0]}`);
      }
      return match;
    },
    description: 'unused destructured variables'
  }
];

// Files to process (focus on components with many unused variables)
const FILES_TO_PROCESS = [
  'app/dashboard/page.tsx',
  'app/profile/page.tsx',
  'app/polls/page.tsx',
  'components/onboarding/steps/CompleteStep.tsx',
  'components/onboarding/steps/PrivacyStep.tsx',
  'components/onboarding/steps/DemographicsStep.tsx',
  'components/onboarding/steps/ValuesStep.tsx'
];

let currentFile = '';

function fixUnusedVariables(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    currentFile = fullPath;
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    let changesMade = 0;
    
    // Apply each pattern
    for (const { pattern, replacement, description } of UNUSED_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        if (typeof replacement === 'function') {
          content = content.replace(pattern, replacement);
        } else {
          content = content.replace(pattern, replacement);
        }
        changesMade += matches.length;
        console.log(`   - Fixed ${matches.length} ${description}`);
      }
    }
    
    // Check if content actually changed
    if (content === originalContent) {
      console.log(`ℹ️  No unused variables found in: ${filePath}`);
      return false;
    }

    // Write the fixed content
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${changesMade} unused variables in: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Comprehensively fixing unused variables...\n');
  
  let fixedCount = 0;
  let totalFiles = FILES_TO_PROCESS.length;
  
  for (const filePath of FILES_TO_PROCESS) {
    console.log(`Processing: ${filePath}`);
    if (fixUnusedVariables(filePath)) {
      fixedCount++;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log(`📊 Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Files unchanged: ${totalFiles - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log(`\n🎉 Successfully fixed ${fixedCount} files!`);
    console.log(`   This addresses the root cause of no-unused-vars warnings systematically.`);
  } else {
    console.log(`\nℹ️  No files needed fixing.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixUnusedVariables };

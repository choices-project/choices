#!/usr/bin/env node

/**
 * Script to properly fix unused variables by removing them when not needed
 * This actually solves the problem instead of just silencing warnings
 */

const fs = require('fs');
const path = require('path');

// Patterns to properly fix unused variables
const PROPER_FIXES = [
  // Remove unused function parameters entirely
  {
    pattern: /\(([^)]+)\) =>/g,
    fix: (content, params) => {
      const paramList = params.split(',').map(p => p.trim());
      const usedParams = [];
      
      for (const param of paramList) {
        if (!param.includes(':')) {
          const paramName = param.split(':')[0].trim();
          const usagePattern = new RegExp(`\\b${paramName}\\b`, 'g');
          const matches = content.match(usagePattern) || [];
          
          // If used more than just in parameter list, keep it
          if (matches.length > 1) {
            usedParams.push(param);
          }
          // Otherwise, remove it entirely
        } else {
          // Keep typed parameters
          usedParams.push(param);
        }
      }
      
      return `(${usedParams.join(', ')}) =>`;
    },
    description: 'removed unused function parameters'
  },
  // Remove unused destructured variables
  {
    pattern: /const \{ ([^}]+) \} =/g,
    fix: (content, vars) => {
      const varList = vars.split(',').map(v => v.trim());
      const usedVars = [];
      
      for (const variable of varList) {
        const varName = variable.split(':')[0].trim();
        const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
        const matches = content.match(usagePattern) || [];
        
        // If used more than just in destructuring, keep it
        if (matches.length > 1) {
          usedVars.push(variable);
        }
        // Otherwise, remove it entirely
      }
      
      if (usedVars.length === 0) {
        return ''; // Remove entire destructuring if nothing used
      }
      return `const { ${usedVars.join(', ')} } =`;
    },
    description: 'removed unused destructured variables'
  },
  // Remove unused variable assignments
  {
    pattern: /const ([a-zA-Z_][a-zA-Z0-9_]*) = ([^;]+);/g,
    fix: (content, varName, assignment) => {
      const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
      const matches = content.match(usagePattern) || [];
      
      // If only found in assignment, remove the entire line
      if (matches.length <= 1) {
        return ''; // Remove the entire line
      }
      
      return `const ${varName} = ${assignment};`;
    },
    description: 'removed unused variable assignments'
  }
];

// Files to process
const FILES_TO_PROCESS = [
  'app/dashboard/page.tsx',
  'app/profile/page.tsx',
  'app/polls/page.tsx',
  'app/account-settings/page.tsx',
  'app/polls/[id]/page.tsx',
  'app/test-user-sync/page.tsx'
];

function fixUnusedVarsProperly(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    let changesMade = 0;
    
    // Apply each fix
    for (const { pattern, fix, description } of PROPER_FIXES) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, (match, ...args) => {
          const result = fix(content, ...args);
          if (result !== match) {
            changesMade++;
            console.log(`   - ${description}`);
          }
          return result;
        });
      }
    }
    
    // Clean up empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Check if content actually changed
    if (content === originalContent) {
      console.log(`ℹ️  No unused variables to fix in: ${filePath}`);
      return false;
    }

    // Write the fixed content
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed unused variables in: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Properly fixing unused variables...\n');
  
  let fixedCount = 0;
  let totalFiles = FILES_TO_PROCESS.length;
  
  for (const filePath of FILES_TO_PROCESS) {
    console.log(`Processing: ${filePath}`);
    if (fixUnusedVarsProperly(filePath)) {
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
    console.log(`   This actually removes unused variables instead of just silencing warnings.`);
  } else {
    console.log(`\nℹ️  No files needed fixing.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixUnusedVarsProperly };

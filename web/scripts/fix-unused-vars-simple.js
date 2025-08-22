#!/usr/bin/env node

/**
 * Simple script to fix straightforward unused variable patterns
 * Only addresses the most basic cases to avoid introducing new problems
 */

const fs = require('fs');
const path = require('path');

// Simple patterns that are safe to fix
const SIMPLE_PATTERNS = [
  // Fix unused function parameters (prefix with underscore)
  {
    pattern: /\(([^)]+)\) =>/g,
    checkUsage: (content, params) => {
      const paramList = params.split(',').map(p => p.trim());
      let newParams = params;
      
      for (const param of paramList) {
        if (!param.startsWith('_') && !param.includes(':')) {
          // Check if this parameter is actually used
          const paramName = param.split(':')[0].trim();
          const usagePattern = new RegExp(`\\b${paramName}\\b`, 'g');
          const matches = content.match(usagePattern) || [];
          
          // If only found in parameter list, it's unused
          if (matches.length <= 1) {
            newParams = newParams.replace(param, `_${param}`);
          }
        }
      }
      
      return `(${newParams}) =>`;
    },
    description: 'unused function parameters'
  },
  // Fix unused destructured variables (prefix with underscore)
  {
    pattern: /const \{ ([^}]+) \} =/g,
    checkUsage: (content, vars) => {
      const varList = vars.split(',').map(v => v.trim());
      let newVars = vars;
      
      for (const variable of varList) {
        if (!variable.startsWith('_')) {
          const varName = variable.split(':')[0].trim();
          const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
          const matches = content.match(usagePattern) || [];
          
          // If only found in destructuring, it's unused
          if (matches.length <= 1) {
            newVars = newVars.replace(variable, `_${variable}`);
          }
        }
      }
      
      return `const { ${newVars} } =`;
    },
    description: 'unused destructured variables'
  }
];

// Files to process (focus on files with many unused variables)
const FILES_TO_PROCESS = [
  'app/dashboard/page.tsx',
  'app/profile/page.tsx',
  'app/polls/page.tsx',
  'app/account-settings/page.tsx',
  'app/polls/[id]/page.tsx',
  'app/test-user-sync/page.tsx',
  'components/onboarding/steps/CompleteStep.tsx',
  'components/onboarding/steps/PrivacyStep.tsx',
  'components/onboarding/steps/DemographicsStep.tsx',
  'components/onboarding/steps/ValuesStep.tsx',
  'components/onboarding/OnboardingFlow.tsx',
  'components/EnhancedFeedbackWidget.tsx',
  'components/polls/PollResults.tsx'
];

function fixUnusedVarsSimple(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    let changesMade = 0;
    
    // Apply each pattern
    for (const { pattern, checkUsage, description } of SIMPLE_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, (match, ...args) => {
          const result = checkUsage(content, args[0]);
          if (result !== match) {
            changesMade++;
            console.log(`   - Fixed ${description}`);
          }
          return result;
        });
      }
    }
    
    // Check if content actually changed
    if (content === originalContent) {
      console.log(`ℹ️  No simple unused variables found in: ${filePath}`);
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
  console.log('🔧 Simple fixing of unused variables...\n');
  
  let fixedCount = 0;
  let totalFiles = FILES_TO_PROCESS.length;
  
  for (const filePath of FILES_TO_PROCESS) {
    console.log(`Processing: ${filePath}`);
    if (fixUnusedVarsSimple(filePath)) {
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
    console.log(`   This addresses simple unused variable patterns safely.`);
  } else {
    console.log(`\nℹ️  No files needed fixing.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixUnusedVarsSimple };

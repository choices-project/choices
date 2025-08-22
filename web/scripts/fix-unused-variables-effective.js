#!/usr/bin/env node

/**
 * Effective script to fix unused variables systematically
 * This addresses the root cause of no-unused-vars warnings with proven patterns
 */

const fs = require('fs');
const path = require('path');

// Find all TypeScript/TSX files recursively
function findTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'scripts') {
      findTsxFiles(fullPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Effective patterns for unused variables (proven to work)
const EFFECTIVE_PATTERNS = [
  // Remove unused React imports (most common)
  {
    pattern: /import \{ ([^}]+) \} from 'react';?/g,
    checkUsage: (content, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      const usedImports = [];
      
      for (const imp of importList) {
        // Check if the import is actually used in the file (not just in import statement)
        const usagePattern = new RegExp(`\\b${imp}\\b`, 'g');
        const importPattern = new RegExp(`import.*${imp}`, 'g');
        
        const usageMatches = content.match(usagePattern) || [];
        const importMatches = content.match(importPattern) || [];
        
        // If there are more usage matches than import matches, it's used
        if (usageMatches.length > importMatches.length) {
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
  // Remove unused lucide-react imports (very common)
  {
    pattern: /import \{ ([^}]+) \} from 'lucide-react';?/g,
    checkUsage: (content, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      const usedImports = [];
      
      for (const imp of importList) {
        // Check if the icon is used in JSX
        const usagePattern = new RegExp(`<${imp}[^>]*>`, 'g');
        const matches = content.match(usagePattern) || [];
        
        if (matches.length > 0) {
          usedImports.push(imp);
        }
      }
      
      if (usedImports.length === 0) {
        return ''; // Remove entire import if none used
      }
      return `import { ${usedImports.join(', ')} } from 'lucide-react';`;
    },
    description: 'unused lucide-react imports'
  },
  // Remove unused Next.js imports
  {
    pattern: /import \{ ([^}]+) \} from 'next\/([^']+)';?/g,
    checkUsage: (content, imports, module) => {
      const importList = imports.split(',').map(i => i.trim());
      const usedImports = [];
      
      for (const imp of importList) {
        const usagePattern = new RegExp(`\\b${imp}\\b`, 'g');
        const importPattern = new RegExp(`import.*${imp}`, 'g');
        
        const usageMatches = content.match(usagePattern) || [];
        const importMatches = content.match(importPattern) || [];
        
        if (usageMatches.length > importMatches.length) {
          usedImports.push(imp);
        }
      }
      
      if (usedImports.length === 0) {
        return ''; // Remove entire import if none used
      }
      return `import { ${usedImports.join(', ')} } from 'next/${module}';`;
    },
    description: 'unused Next.js imports'
  },
  // Remove unused utility imports
  {
    pattern: /import \{ ([^}]+) \} from '([^']+)';?/g,
    checkUsage: (content, imports, module) => {
      // Skip React, lucide-react, and Next.js imports (handled separately)
      if (module === 'react' || module === 'lucide-react' || module.startsWith('next/')) {
        return `import { ${imports} } from '${module}';`;
      }
      
      const importList = imports.split(',').map(i => i.trim());
      const usedImports = [];
      
      for (const imp of importList) {
        const usagePattern = new RegExp(`\\b${imp}\\b`, 'g');
        const importPattern = new RegExp(`import.*${imp}`, 'g');
        
        const usageMatches = content.match(usagePattern) || [];
        const importMatches = content.match(importPattern) || [];
        
        if (usageMatches.length > importMatches.length) {
          usedImports.push(imp);
        }
      }
      
      if (usedImports.length === 0) {
        return ''; // Remove entire import if none used
      }
      return `import { ${usedImports.join(', ')} } from '${module}';`;
    },
    description: 'unused utility imports'
  },
  // Prefix unused function parameters with underscore
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
  }
];

function fixUnusedVariablesEffective(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changesMade = 0;
    
    // Apply each pattern
    for (const { pattern, checkUsage, description } of EFFECTIVE_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, (match, ...args) => {
          const result = checkUsage(content, ...args);
          if (result !== match) {
            changesMade++;
          }
          return result;
        });
      }
    }
    
    // Clean up empty import lines
    content = content.replace(/import \{ \} from 'react';\n/g, '');
    content = content.replace(/import \{ \} from 'lucide-react';\n/g, '');
    content = content.replace(/import \{ \} from 'next\/[^']+';\n/g, '');
    content = content.replace(/import \{ \} from '[^']+';\n/g, '');
    
    // Check if content actually changed
    if (content === originalContent) {
      return false;
    }

    // Write the fixed content
    fs.writeFileSync(filePath, content, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`✅ Fixed unused variables in: ${relativePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Effective fixing of unused variables...\n');
  
  // Find all TypeScript/TSX files
  const tsxFiles = findTsxFiles(process.cwd());
  console.log(`Found ${tsxFiles.length} TypeScript/TSX files to process\n`);
  
  let fixedCount = 0;
  
  for (const filePath of tsxFiles) {
    if (fixUnusedVariablesEffective(filePath)) {
      fixedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${tsxFiles.length}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Files unchanged: ${tsxFiles.length - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log(`\n🎉 Successfully fixed ${fixedCount} files!`);
    console.log(`   This addresses the root cause of no-unused-vars warnings effectively.`);
  } else {
    console.log(`\nℹ️  No files needed fixing.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixUnusedVariablesEffective };

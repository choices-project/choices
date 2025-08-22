#!/usr/bin/env node

/**
 * Script to fix unused React imports
 * This addresses the root cause of unused variable warnings by removing unnecessary React imports
 */

const fs = require('fs');
const path = require('path');

// Files to process (components with unused React imports)
const FILES_TO_PROCESS = [
  'app/polls/page.tsx',
  'app/polls/test-spa/page.tsx',
  'components/DemographicVisualization.tsx',
  'components/FancyCharts.tsx',
  'components/TopicAnalysis.tsx'
];

function analyzeReactImports(content) {
  const imports = {
    useState: false,
    useEffect: false,
    useCallback: false,
    createContext: false,
    useContext: false
  };
  
  // Check what's imported
  const importMatch = content.match(/import \{ ([^}]+) \} from 'react';?/);
  if (importMatch) {
    const importedItems = importMatch[1].split(',').map(item => item.trim());
    importedItems.forEach(item => {
      if (imports.hasOwnProperty(item)) {
        imports[item] = true;
      }
    });
  }
  
  // Check what's actually used
  const usedItems = {
    useState: /useState/g.test(content),
    useEffect: /useEffect/g.test(content),
    useCallback: /useCallback/g.test(content),
    createContext: /createContext/g.test(content),
    useContext: /useContext/g.test(content)
  };
  
  return { imports, usedItems };
}

function fixReactImports(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const { imports, usedItems } = analyzeReactImports(content);
    
    // Find unused imports
    const unusedImports = [];
    for (const [hook, isImported] of Object.entries(imports)) {
      if (isImported && !usedItems[hook]) {
        unusedImports.push(hook);
      }
    }
    
    if (unusedImports.length === 0) {
      console.log(`ℹ️  No unused React imports found in: ${filePath}`);
      return false;
    }
    
    console.log(`   - Unused imports: ${unusedImports.join(', ')}`);
    
    // Create new import statement with only used imports
    const usedImports = [];
    for (const [hook, isUsed] of Object.entries(usedItems)) {
      if (isUsed) {
        usedImports.push(hook);
      }
    }
    
    let newImportStatement;
    if (usedImports.length === 0) {
      // Remove the entire import line if no React hooks are used
      newImportStatement = '';
    } else {
      newImportStatement = `import { ${usedImports.join(', ')} } from 'react';`;
    }
    
    // Replace the import statement
    let fixedContent = content.replace(
      /import \{ [^}]+ \} from 'react';?\n?/g,
      newImportStatement + (newImportStatement ? '\n' : '')
    );
    
    // Clean up double newlines
    fixedContent = fixedContent.replace(/\n\n\n/g, '\n\n');
    
    // Check if content actually changed
    if (content === fixedContent) {
      console.log(`ℹ️  No changes needed in: ${filePath}`);
      return false;
    }

    // Write the fixed content
    fs.writeFileSync(fullPath, fixedContent, 'utf8');
    console.log(`✅ Fixed React imports in: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing unused React imports...\n');
  
  let fixedCount = 0;
  let totalFiles = FILES_TO_PROCESS.length;
  
  for (const filePath of FILES_TO_PROCESS) {
    console.log(`Processing: ${filePath}`);
    if (fixReactImports(filePath)) {
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
    console.log(`   This addresses the root cause of unused variable warnings by removing unnecessary React imports.`);
  } else {
    console.log(`\nℹ️  No files needed fixing.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixReactImports };

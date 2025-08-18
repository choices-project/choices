#!/usr/bin/env node

/**
 * Careful Cleanup Script - Conservative Approach
 * 
 * This script carefully removes only truly unused imports and variables
 */

const fs = require('fs');
const path = require('path');

// Import the analysis functions from the main script
const { analyzeUnusedImports, analyzeUnusedVariables, analyzeConsoleStatements } = require('./cleanup-code.js');

// Files to skip (too complex or risky)
const SKIP_FILES = [
  'public/workbox-2efeac47.js', // Generated file
  'lib/comprehensive-testing-runner.ts', // Too complex
  'lib/pwa-auth-integration.ts', // Too complex
  'lib/pwa-utils.ts', // Too complex
  'modules/advanced-privacy/', // Skip entire directory
];

/**
 * Check if a file should be skipped
 */
function shouldSkipFile(filePath) {
  return SKIP_FILES.some(skipPath => filePath.includes(skipPath));
}

/**
 * More careful unused import detection
 */
function analyzeUnusedImportsCareful(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  // Find import statements
  const importLines = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.startsWith('import '));
  
  for (const { line, index } of importLines) {
    // Only handle destructured imports
    const match = line.match(/import\s*{([^}]+)}\s*from/);
    if (match) {
      const imports = match[1]
        .split(',')
        .map(item => item.trim())
        .filter(item => item && !item.startsWith('//'));
      
      // Check if each import is used
      for (const importItem of imports) {
        const cleanImport = importItem.replace(/\s+as\s+\w+/, ''); // Remove "as" aliases
        
        // More conservative usage detection
        const isUsed = content.includes(`<${cleanImport}`) || 
                      content.includes(`${cleanImport}(`) ||
                      content.includes(`${cleanImport}.`) ||
                      content.includes(`${cleanImport} `) ||
                      content.includes(`${cleanImport}\n`) ||
                      content.includes(`${cleanImport}`) && !line.includes(cleanImport) ||
                      // Check for JSX usage
                      content.includes(`${cleanImport}>`) ||
                      content.includes(`</${cleanImport}>`) ||
                      // Check for type usage
                      content.includes(`: ${cleanImport}`) ||
                      content.includes(`: ${cleanImport}[`) ||
                      content.includes(`: ${cleanImport}<`) ||
                      content.includes(`: ${cleanImport}(`) ||
                      // Check for interface/type usage
                      content.includes(`extends ${cleanImport}`) ||
                      content.includes(`implements ${cleanImport}`);
        
        if (!isUsed) {
          issues.push({
            type: 'unused_import',
            line: index + 1,
            import: cleanImport,
            fullLine: line
          });
        }
      }
    }
  }
  
  return issues;
}

/**
 * More careful unused variable detection
 */
function analyzeUnusedVariablesCareful(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  // Find variable declarations
  const varPatterns = [
    /const\s+(\w+)\s*=/,
    /let\s+(\w+)\s*=/,
    /var\s+(\w+)\s*=/,
    /const\s*{\s*([^}]+)\s*}\s*=/,
    /let\s*{\s*([^}]+)\s*}\s*=/,
    /var\s*{\s*([^}]+)\s*}\s*=/,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of varPatterns) {
      const match = line.match(pattern);
      if (match) {
        const vars = match[1].split(',').map(v => v.trim());
        
        for (const varName of vars) {
          const cleanVar = varName.split(':')[0].trim(); // Remove type annotations
          if (cleanVar && !cleanVar.startsWith('_')) {
            // More conservative usage detection
            const isUsed = content.includes(`${cleanVar}(`) ||
                          content.includes(`${cleanVar}.`) ||
                          content.includes(`${cleanVar} `) ||
                          content.includes(`${cleanVar}\n`) ||
                          content.includes(`${cleanVar}`) && !line.includes(cleanVar) ||
                          // Check for destructuring usage
                          content.includes(`{ ${cleanVar} }`) ||
                          content.includes(`{${cleanVar}}`) ||
                          // Check for return statements
                          content.includes(`return ${cleanVar}`) ||
                          // Check for JSX props
                          content.includes(`${cleanVar}=`) ||
                          content.includes(` ${cleanVar} `);
            
            if (!isUsed) {
              issues.push({
                type: 'unused_variable',
                line: i + 1,
                variable: cleanVar,
                fullLine: line
              });
            }
          }
        }
      }
    }
  }
  
  return issues;
}

/**
 * Fix unused imports carefully
 */
function fixUnusedImportsCareful(filePath, issues) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  
  // Group issues by line number
  const issuesByLine = {};
  issues.filter(issue => issue.type === 'unused_import').forEach(issue => {
    if (!issuesByLine[issue.line]) {
      issuesByLine[issue.line] = [];
    }
    issuesByLine[issue.line].push(issue);
  });
  
  // Process each line with unused imports
  for (const [lineNum, lineIssues] of Object.entries(issuesByLine)) {
    const lineIndex = parseInt(lineNum) - 1;
    const line = lines[lineIndex];
    
    if (line.includes('import {') && line.includes('} from')) {
      const match = line.match(/import\s*{([^}]+)}\s*from/);
      if (match) {
        const imports = match[1]
          .split(',')
          .map(item => item.trim())
          .filter(item => item && !item.startsWith('//'));
        
        // Remove unused imports
        const unusedImports = lineIssues.map(issue => issue.import);
        const usedImports = imports.filter(importItem => {
          const cleanImport = importItem.replace(/\s+as\s+\w+/, '');
          return !unusedImports.includes(cleanImport);
        });
        
        if (usedImports.length !== imports.length && usedImports.length > 0) {
          // Reconstruct the import line
          const newImportLine = `import { ${usedImports.join(', ')} } from '${line.match(/from\s+['"]([^'"]+)['"]/)[1]}'`;
          lines[lineIndex] = newImportLine;
          modified = true;
          console.log(`   ✅ Removed unused imports: ${unusedImports.join(', ')}`);
        }
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
  }
  
  return modified;
}

/**
 * Fix console statements by replacing with devLog
 */
function fixConsoleStatements(filePath, issues) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  
  // Check if devLog is already imported
  const hasDevLogImport = content.includes("import { devLog }") || content.includes("import {devLog}");
  
  // Process console statements
  issues.filter(issue => issue.type === 'console_statement').forEach(issue => {
    const lineIndex = issue.line - 1;
    const line = lines[lineIndex];
    
    if (line.includes('console.log(')) {
      const newLine = line.replace(/console\.log\(/g, 'devLog(');
      lines[lineIndex] = newLine;
      modified = true;
    } else if (line.includes('console.error(')) {
      const newLine = line.replace(/console\.error\(/g, 'devLog(');
      lines[lineIndex] = newLine;
      modified = true;
    } else if (line.includes('console.warn(')) {
      const newLine = line.replace(/console\.warn\(/g, 'devLog(');
      lines[lineIndex] = newLine;
      modified = true;
    }
  });
  
  // Add devLog import if needed and console statements were replaced
  if (modified && !hasDevLogImport) {
    // Find the first import statement
    let importIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        importIndex = i;
        break;
      }
    }
    
    if (importIndex >= 0) {
      // Add devLog import after the first import
      const devLogImport = "import { devLog } from '@/lib/logger';";
      lines.splice(importIndex + 1, 0, devLogImport);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
  }
  
  return modified;
}

function carefulCleanup() {
  console.log('🛡️ Running careful cleanup...\n');
  
  const sourcePath = path.join(process.cwd(), 'web');
  const files = getFiles(sourcePath);
  
  let totalFixed = 0;
  let totalIssues = 0;
  
  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    if (shouldSkipFile(relativePath)) {
      console.log(`⏭️ Skipping: ${relativePath}`);
      continue;
    }
    
    console.log(`📁 Processing: ${relativePath}`);
    
    // Create backup
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    
    // Analyze the file
    const issues = [
      ...analyzeUnusedImportsCareful(filePath),
      ...analyzeUnusedVariablesCareful(filePath),
      ...analyzeConsoleStatements(filePath)
    ];
    
    totalIssues += issues.length;
    
    if (issues.length === 0) {
      console.log(`   ℹ️ No issues found\n`);
      continue;
    }
    
    console.log(`   🔍 Found ${issues.length} issues`);
    
    // Apply fixes
    let modified = false;
    modified |= fixUnusedImportsCareful(filePath, issues);
    modified |= fixConsoleStatements(filePath, issues);
    
    if (modified) {
      totalFixed++;
      console.log(`   ✅ Fixed issues\n`);
    } else {
      console.log(`   ℹ️ No fixes applied\n`);
    }
  }
  
  console.log('📊 Careful Cleanup Summary:');
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Total issues found: ${totalIssues}`);
  console.log(`   Files modified: ${totalFixed}`);
  
  console.log('\n✅ Careful cleanup completed');
  console.log('💡 Run "npm run lint" to verify the fixes');
}

/**
 * Get all TypeScript/JavaScript files recursively
 */
function getFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', 'dist', 'build'].includes(item)) {
        getFiles(fullPath, files);
      }
    } else if (['.tsx', '.ts', '.jsx', '.js'].includes(path.extname(item))) {
      if (stat.size < 1024 * 1024) { // 1MB
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

carefulCleanup();

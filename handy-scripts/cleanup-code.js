#!/usr/bin/env node

/**
 * Code Cleanup Script
 * 
 * This script helps identify and fix common code quality issues:
 * - Unused imports
 * - Unused variables
 * - Console statements
 * - Unescaped entities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  sourceDir: '.', // Changed from 'web' to '.' since we run from web directory
  fileExtensions: ['.tsx', '.ts', '.jsx', '.js'],
  excludeDirs: ['node_modules', '.next', 'dist', 'build'],
  maxFileSize: 1024 * 1024, // 1MB
};

// Statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  unusedImportsRemoved: 0,
  unusedVariablesRemoved: 0,
  consoleStatementsReplaced: 0,
  unescapedEntitiesFixed: 0,
};

/**
 * Get all TypeScript/JavaScript files recursively
 */
function getFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!CONFIG.excludeDirs.includes(item)) {
        getFiles(fullPath, files);
      }
    } else if (CONFIG.fileExtensions.includes(path.extname(item))) {
      if (stat.size < CONFIG.maxFileSize) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Analyze a file for unused imports
 */
function analyzeUnusedImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  // Find import statements
  const importLines = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.startsWith('import '));
  
  for (const { line, index } of importLines) {
    // Extract imported items
    const match = line.match(/import\s*{([^}]+)}\s*from/);
    if (match) {
      const imports = match[1]
        .split(',')
        .map(item => item.trim())
        .filter(item => item && !item.startsWith('//'));
      
      // Check if each import is used
      for (const importItem of imports) {
        const cleanImport = importItem.replace(/\s+as\s+\w+/, ''); // Remove "as" aliases
        const isUsed = content.includes(`<${cleanImport}`) || 
                      content.includes(`${cleanImport}(`) ||
                      content.includes(`${cleanImport}.`) ||
                      content.includes(`${cleanImport} `) ||
                      content.includes(`${cleanImport}\n`) ||
                      content.includes(`${cleanImport}`) && !line.includes(cleanImport);
        
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
 * Analyze a file for unused variables
 */
function analyzeUnusedVariables(filePath) {
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
            // Check if variable is used
            const isUsed = content.includes(`${cleanVar}(`) ||
                          content.includes(`${cleanVar}.`) ||
                          content.includes(`${cleanVar} `) ||
                          content.includes(`${cleanVar}\n`) ||
                          content.includes(`${cleanVar}`) && !line.includes(cleanVar);
            
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
 * Analyze a file for console statements
 */
function analyzeConsoleStatements(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('console.log(') || line.includes('console.error(') || line.includes('console.warn(')) {
      issues.push({
        type: 'console_statement',
        line: i + 1,
        fullLine: line
      });
    }
  }
  
  return issues;
}

/**
 * Generate a report of all issues
 */
function generateReport(allIssues) {
  console.log('\n🔍 Code Cleanup Analysis Report');
  console.log('================================\n');
  
  let totalIssues = 0;
  
  for (const [filePath, issues] of Object.entries(allIssues)) {
    if (issues.length > 0) {
      console.log(`📁 ${filePath}`);
      console.log(`   ${issues.length} issues found:\n`);
      
      for (const issue of issues) {
        console.log(`   Line ${issue.line}: ${issue.type}`);
        if (issue.import) console.log(`      Unused import: ${issue.import}`);
        if (issue.variable) console.log(`      Unused variable: ${issue.variable}`);
        console.log(`      ${issue.fullLine.trim()}\n`);
        totalIssues++;
      }
    }
  }
  
  console.log(`\n📊 Summary: ${totalIssues} total issues found across ${Object.keys(allIssues).length} files`);
  
  return totalIssues;
}

/**
 * Fix unused imports by removing them from import statements
 */
function fixUnusedImports(filePath, issues) {
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
        
        if (usedImports.length !== imports.length) {
          // Reconstruct the import line
          const newImportLine = `import { ${usedImports.join(', ')} } from '${line.match(/from\s+['"]([^'"]+)['"]/)[1]}'`;
          lines[lineIndex] = newImportLine;
          modified = true;
          stats.unusedImportsRemoved += imports.length - usedImports.length;
        }
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
    stats.filesModified++;
  }
  
  return modified;
}

/**
 * Fix unused variables by removing them from destructuring assignments
 */
function fixUnusedVariables(filePath, issues) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  
  // Group issues by line number
  const issuesByLine = {};
  issues.filter(issue => issue.type === 'unused_variable').forEach(issue => {
    if (!issuesByLine[issue.line]) {
      issuesByLine[issue.line] = [];
    }
    issuesByLine[issue.line].push(issue);
  });
  
  // Process each line with unused variables
  for (const [lineNum, lineIssues] of Object.entries(issuesByLine)) {
    const lineIndex = parseInt(lineNum) - 1;
    const line = lines[lineIndex];
    
    // Handle destructuring assignments
    const destructuringMatch = line.match(/(const|let|var)\s*{\s*([^}]+)\s*}\s*=/);
    if (destructuringMatch) {
      const vars = destructuringMatch[2]
        .split(',')
        .map(v => v.trim())
        .filter(v => v);
      
      const unusedVars = lineIssues.map(issue => issue.variable);
      const usedVars = vars.filter(v => {
        const cleanVar = v.split(':')[0].trim();
        return !unusedVars.includes(cleanVar);
      });
      
      if (usedVars.length !== vars.length) {
        // Reconstruct the destructuring line
        const newLine = line.replace(
          /{\s*[^}]+\s*}/,
          `{ ${usedVars.join(', ')} }`
        );
        lines[lineIndex] = newLine;
        modified = true;
        stats.unusedVariablesRemoved += vars.length - usedVars.length;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
    stats.filesModified++;
  }
  
  return modified;
}

/**
 * Fix console statements by replacing them with devLog
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
      stats.consoleStatementsReplaced++;
    } else if (line.includes('console.error(')) {
      const newLine = line.replace(/console\.error\(/g, 'devLog(');
      lines[lineIndex] = newLine;
      modified = true;
      stats.consoleStatementsReplaced++;
    } else if (line.includes('console.warn(')) {
      const newLine = line.replace(/console\.warn\(/g, 'devLog(');
      lines[lineIndex] = newLine;
      modified = true;
      stats.consoleStatementsReplaced++;
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
    stats.filesModified++;
  }
  
  return modified;
}

/**
 * Auto-fix all issues in a file
 */
function autoFixFile(filePath, issues) {
  let modified = false;
  
  modified |= fixUnusedImports(filePath, issues);
  modified |= fixUnusedVariables(filePath, issues);
  modified |= fixConsoleStatements(filePath, issues);
  
  return modified;
}

/**
 * Main function
 */
function main() {
  console.log('🧹 Starting code cleanup analysis...\n');
  
  const sourcePath = path.join(process.cwd(), CONFIG.sourceDir);
  const files = getFiles(sourcePath);
  
  console.log(`📂 Found ${files.length} files to analyze\n`);
  
  const allIssues = {};
  
  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);
    const issues = [
      ...analyzeUnusedImports(filePath),
      ...analyzeUnusedVariables(filePath),
      ...analyzeConsoleStatements(filePath)
    ];
    
    if (issues.length > 0) {
      allIssues[relativePath] = issues;
    }
    
    stats.filesProcessed++;
  }
  
  const totalIssues = generateReport(allIssues);
  
  // Auto-fix if requested
  if (process.argv.includes('--fix')) {
    console.log('\n🔧 Starting auto-fix...\n');
    
    for (const [filePath, issues] of Object.entries(allIssues)) {
      const fullPath = path.join(process.cwd(), filePath);
      const modified = autoFixFile(fullPath, issues);
      
      if (modified) {
        console.log(`✅ Fixed issues in ${filePath}`);
      }
    }
    
    console.log('\n📊 Fix Summary:');
    console.log(`   Files modified: ${stats.filesModified}`);
    console.log(`   Unused imports removed: ${stats.unusedImportsRemoved}`);
    console.log(`   Unused variables removed: ${stats.unusedVariablesRemoved}`);
    console.log(`   Console statements replaced: ${stats.consoleStatementsReplaced}`);
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Review the issues above');
  console.log('2. Run: npm run cleanup:fix (to auto-fix issues)');
  console.log('3. Or manually fix the issues file by file');
  
  return totalIssues;
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, analyzeUnusedImports, analyzeUnusedVariables, analyzeConsoleStatements };

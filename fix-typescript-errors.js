#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common fixes for TypeScript errors
const fixes = [
  // Fix NextRequest imports
  {
    pattern: /import \{ NextResponse \} from 'next\/server'/g,
    replacement: "import { NextRequest, NextResponse } from 'next/server'"
  },
  // Fix missing devLog imports
  {
    pattern: /devLog\(/g,
    replacement: "console.log(",
    condition: (content) => !content.includes("import { devLog }")
  },
  // Add missing React imports
  {
    pattern: /import \{ ([^}]+) \} from 'react'/g,
    replacement: (match, imports) => {
      const needed = ['useState', 'useEffect', 'useCallback', 'createContext', 'useContext'];
      const current = imports.split(',').map(i => i.trim());
      const missing = needed.filter(n => !current.includes(n));
      if (missing.length > 0) {
        return `import { ${current.concat(missing).join(', ')} } from 'react'`;
      }
      return match;
    }
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    fixes.forEach(fix => {
      if (fix.condition && !fix.condition(content)) {
        return;
      }
      
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fixFile(filePath);
    }
  });
}

console.log('🔧 Fixing TypeScript errors...');
walkDir('./web');
console.log('✅ TypeScript error fixes completed!');

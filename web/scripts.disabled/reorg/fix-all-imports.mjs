#!/usr/bin/env node

/**
 * Fix All Import Issues
 * 
 * Comprehensive fix for all remaining import path issues after reorganization.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

// Comprehensive import fixes
const importFixes = [
  // Auth imports
  {
    pattern: /from ['"]@\/lib\/auth\/server-actions['"]/g,
    replacement: "from '@/lib/core/auth/server-actions'"
  },
  {
    pattern: /from ['"]@\/lib\/auth\/session-cookies['"]/g,
    replacement: "from '@/lib/core/auth/session-cookies'"
  },
  {
    pattern: /from ['"]@\/lib\/auth-middleware['"]/g,
    replacement: "from '@/lib/core/auth/middleware'"
  },
  {
    pattern: /from ['"]@\/lib\/auth\/auth['"]/g,
    replacement: "from '@/lib/core/auth/auth'"
  },
  {
    pattern: /from ['"]@\/lib\/auth\/utils['"]/g,
    replacement: "from '@/lib/core/auth/utils'"
  },
  {
    pattern: /from ['"]@\/lib\/auth\/device-flow['"]/g,
    replacement: "from '@/lib/core/auth/device-flow'"
  },
  {
    pattern: /from ['"]@\/lib\/auth\/idempotency['"]/g,
    replacement: "from '@/lib/core/auth/idempotency'"
  },
  
  // Security imports
  {
    pattern: /from ['"]@\/lib\/security\/config['"]/g,
    replacement: "from '@/lib/core/security/config'"
  },
  {
    pattern: /from ['"]@\/lib\/rate-limit['"]/g,
    replacement: "from '@/lib/core/security/rate-limit'"
  },
  
  // Services imports
  {
    pattern: /from ['"]@\/lib\/services\/AnalyticsService['"]/g,
    replacement: "from '@/lib/core/services/analytics'"
  },
  {
    pattern: /from ['"]@\/lib\/real-time-news-service['"]/g,
    replacement: "from '@/lib/core/services/real-time-news'"
  },
  {
    pattern: /from ['"]@\/lib\/hybrid-voting-service['"]/g,
    replacement: "from '@/lib/core/services/hybrid-voting'"
  },
  
  // Database imports
  {
    pattern: /from ['"]@\/lib\/database-optimizer['"]/g,
    replacement: "from '@/lib/core/database/optimizer'"
  },
  
  // Types imports
  {
    pattern: /from ['"]@\/lib\/types\/guards['"]/g,
    replacement: "from '@/lib/core/types/guards'"
  },
  
  // Shared imports
  {
    pattern: /from ['"]@\/lib\/webauthn['"]/g,
    replacement: "from '@/lib/shared/webauthn'"
  },
  {
    pattern: /from ['"]@\/components\/PWAComponents['"]/g,
    replacement: "from '@/lib/shared/pwa-components'"
  },
  
  // Feature flags
  {
    pattern: /from ['"]@\/lib\/feature-flags['"]/g,
    replacement: "from '@/lib/core/feature-flags'"
  },
  
  // Admin imports
  {
    pattern: /from ['"]@\/lib\/feedback-tracker['"]/g,
    replacement: "from '@/lib/admin/feedback-tracker'"
  },
  
  // Component imports that might be missing
  {
    pattern: /from ['"]@\/components\/auth\/BiometricSetup['"]/g,
    replacement: "from '@/features/webauthn/components/BiometricSetup'"
  },
  
  // Relative imports in admin files
  {
    pattern: /from ['"]\.\/admin-store['"]/g,
    replacement: "from './store'"
  },
  {
    pattern: /from ['"]\.\/admin-hooks['"]/g,
    replacement: "from './hooks'"
  }
];

console.log('🔧 Fixing all remaining import issues...\n');

let totalFixes = 0;
let filesFixed = 0;

// Recursively find all TypeScript/JavaScript files
function findTsFiles(dir) {
  const files = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, and other build directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry)) {
          files.push(...findTsFiles(fullPath));
        }
      } else if (stat.isFile()) {
        const ext = entry.split('.').pop();
        if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

// Fix imports in a file
function fixFileImports(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let fileFixes = 0;
    
    importFixes.forEach(fix => {
      const matches = updatedContent.match(fix.pattern);
      if (matches) {
        updatedContent = updatedContent.replace(fix.pattern, fix.replacement);
        fileFixes += matches.length;
      }
    });
    
    if (fileFixes > 0) {
      writeFileSync(filePath, updatedContent);
      totalFixes += fileFixes;
      filesFixed++;
      console.log(`  ✅ Fixed ${fileFixes} imports in: ${filePath.replace(projectRoot, '.')}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to fix ${filePath}:`, error.message);
  }
}

// Find and fix all files
const files = findTsFiles(projectRoot);
console.log(`Found ${files.length} TypeScript/JavaScript files\n`);

files.forEach(fixFileImports);

console.log(`\n✅ All import fixes complete!`);
console.log(`  - ${filesFixed} files fixed`);
console.log(`  - ${totalFixes} import statements fixed`);








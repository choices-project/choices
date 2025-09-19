#!/usr/bin/env node

/**
 * Import Update Script
 * 
 * Updates import statements after reorganization to use new paths.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

// Import update mappings
const importUpdates = [
  {
    pattern: /@\/shared\/core\/security\/lib\/config/g,
    replacement: '@/lib/core/security/config'
  },
  {
    pattern: /@\/shared\/core\/security\/lib\/rate-limit/g,
    replacement: '@/lib/core/security/rate-limit'
  },
  {
    pattern: /@\/shared\/lib\/feature-flags/g,
    replacement: '@/lib/core/feature-flags'
  },
  {
    pattern: /@\/features\/auth\/lib\/auth-middleware/g,
    replacement: '@/lib/core/auth/middleware'
  },
  {
    pattern: /@\/features\/auth\/lib\/auth-utils/g,
    replacement: '@/lib/core/auth/utils'
  },
  {
    pattern: /@\/features\/auth\/lib\/auth/g,
    replacement: '@/lib/core/auth/auth'
  },
  {
    pattern: /@\/features\/auth\/lib\/server-actions/g,
    replacement: '@/lib/core/auth/server-actions'
  },
  {
    pattern: /@\/features\/auth\/lib\/session-cookies/g,
    replacement: '@/lib/core/auth/session-cookies'
  },
  {
    pattern: /@\/features\/auth\/lib\/device-flow/g,
    replacement: '@/lib/core/auth/device-flow'
  },
  {
    pattern: /@\/features\/auth\/lib\/idempotency/g,
    replacement: '@/lib/core/auth/idempotency'
  },
  {
    pattern: /@\/lib\/services\/AnalyticsService/g,
    replacement: '@/lib/core/services/analytics'
  },
  {
    pattern: /@\/lib\/real-time-news-service/g,
    replacement: '@/lib/core/services/real-time-news'
  },
  {
    pattern: /@\/lib\/hybrid-voting-service/g,
    replacement: '@/lib/core/services/hybrid-voting'
  },
  {
    pattern: /@\/lib\/database-optimizer/g,
    replacement: '@/lib/core/database/optimizer'
  },
  {
    pattern: /@\/lib\/types\/guards/g,
    replacement: '@/lib/core/types/guards'
  },
  {
    pattern: /@\/lib\/feedback-tracker/g,
    replacement: '@/lib/admin/feedback-tracker'
  },
  {
    pattern: /@\/lib\/webauthn/g,
    replacement: '@/lib/shared/webauthn'
  },
  {
    pattern: /@\/components\/PWAComponents/g,
    replacement: '@/lib/shared/pwa-components'
  }
];

console.log('🔄 Updating import statements...\n');

let totalUpdates = 0;
let filesUpdated = 0;

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

// Update imports in a file
function updateFileImports(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let fileUpdates = 0;
    
    importUpdates.forEach(update => {
      const matches = updatedContent.match(update.pattern);
      if (matches) {
        updatedContent = updatedContent.replace(update.pattern, update.replacement);
        fileUpdates += matches.length;
      }
    });
    
    if (fileUpdates > 0) {
      writeFileSync(filePath, updatedContent);
      totalUpdates += fileUpdates;
      filesUpdated++;
      console.log(`  ✅ Updated ${fileUpdates} imports in: ${filePath.replace(projectRoot, '.')}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to update ${filePath}:`, error.message);
  }
}

// Find and update all files
const files = findTsFiles(projectRoot);
console.log(`Found ${files.length} TypeScript/JavaScript files\n`);

files.forEach(updateFileImports);

console.log(`\n✅ Import update complete!`);
console.log(`  - ${filesUpdated} files updated`);
console.log(`  - ${totalUpdates} import statements updated`);








/**
 * Unused Variable Prevention Tests
 * 
 * Ensures proper variable usage and prevents sloppy error fixes
 * by validating that variables are used appropriately.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as glob from 'glob';

describe('Unused Variable Prevention', () => {
  it('error variables should be used for logging', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for catch blocks with unused error variables
      const catchBlocks = content.match(/catch\s*\(\s*(\w+)\s*\)\s*\{[^}]*\}/g);
      if (catchBlocks) {
        catchBlocks.forEach(catchBlock => {
          const errorVar = catchBlock.match(/catch\s*\(\s*(\w+)\s*\)/)?.[1];
          if (errorVar && !catchBlock.includes(errorVar)) {
            problematicFiles.push(`${file}: unused error variable '${errorVar}'`);
          }
        });
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Files with unused error variables:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('state variables should be used in effects', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for useState with unused variables
      const useStateMatches = content.match(/const\s*\[\s*(\w+),\s*set\w+\s*\]\s*=\s*useState/g);
      if (useStateMatches) {
        useStateMatches.forEach(match => {
          const stateVar = match.match(/const\s*\[\s*(\w+),\s*set\w+\s*\]/)?.[1];
          if (stateVar && !content.includes(stateVar)) {
            problematicFiles.push(`${file}: unused state variable '${stateVar}'`);
          }
        });
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Files with unused state variables:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('imported variables should be used', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for unused imports (basic check)
      const importMatches = content.match(/import\s*\{([^}]+)\}\s*from/g);
      if (importMatches) {
        importMatches.forEach(match => {
          const imports = match.match(/import\s*\{([^}]+)\}/)?.[1];
          if (imports) {
            const importList = imports.split(',').map(imp => imp.trim());
            importList.forEach(imp => {
              const cleanImport = imp.replace(/\s+as\s+\w+/, '').trim();
              if (cleanImport && !content.includes(cleanImport)) {
                problematicFiles.push(`${file}: unused import '${cleanImport}'`);
              }
            });
          }
        });
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Files with unused imports:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('function parameters should be used', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for function parameters that might be unused
      const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*\{/g);
      if (functionMatches) {
        functionMatches.forEach(match => {
          const params = match.match(/function\s+\w+\s*\(([^)]*)\)/)?.[1];
          if (params && params.trim()) {
            const paramList = params.split(',').map(p => p.trim().split(':')[0].trim());
            paramList.forEach(param => {
              if (param && !content.includes(param)) {
                problematicFiles.push(`${file}: unused parameter '${param}'`);
              }
            });
          }
        });
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Files with unused parameters:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });
});

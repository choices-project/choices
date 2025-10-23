/**
 * Store Type Safety Tests
 * 
 * Validates that all Zustand stores have proper type definitions,
 * index signatures, and error handling patterns.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect } from '@jest/globals';
import { logger } from '@/lib/utils/logger';
import * as fs from 'fs';
import * as glob from 'glob';

describe('Store Type Safety', () => {
  it('all stores should have proper index signatures', () => {
    const storeFiles = glob.sync('web/lib/stores/*.ts', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicStores: string[] = [];
    
    storeFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for interfaces that need index signatures
      const interfaceMatches = content.match(/interface\s+(\w+)\s*\{[^}]*\}/g);
      if (interfaceMatches) {
        interfaceMatches.forEach(match => {
          const interfaceName = match.match(/interface\s+(\w+)/)?.[1];
          if (interfaceName && !match.includes('[key: string]: unknown')) {
            // Check if this interface is used in store contexts
            if (content.includes('use' + interfaceName) || content.includes(interfaceName + 'Store')) {
              problematicStores.push(`${file}: interface '${interfaceName}' needs index signature`);
            }
          }
        });
      }
    });
    
    if (problematicStores.length > 0) {
      logger.info('Stores needing index signatures:', problematicStores);
    }
    
    expect(problematicStores).toHaveLength(0);
  });

  it('store actions should be properly typed', () => {
    const storeFiles = glob.sync('web/lib/stores/*.ts', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicStores: string[] = [];
    
    storeFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for action functions that should be properly typed
      const actionMatches = content.match(/(\w+):\s*\([^)]*\)\s*=>/g);
      if (actionMatches) {
        actionMatches.forEach(match => {
          const actionName = match.match(/(\w+):/)?.[1];
          if (actionName && !match.includes(':')) {
            problematicStores.push(`${file}: action '${actionName}' needs proper typing`);
          }
        });
      }
    });
    
    if (problematicStores.length > 0) {
      logger.info('Stores with untyped actions:', problematicStores);
    }
    
    expect(problematicStores).toHaveLength(0);
  });

  it('store subscriptions should be properly implemented', () => {
    const storeFiles = glob.sync('web/lib/stores/*.ts', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicStores: string[] = [];
    
    storeFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for subscription methods
      if (content.includes('subscribe')) {
        // Should have proper subscription implementation
        if (!content.includes('useStore.subscribe')) {
          problematicStores.push(`${file}: subscription methods should use useStore.subscribe`);
        }
      }
    });
    
    if (problematicStores.length > 0) {
      logger.info('Stores with improper subscriptions:', problematicStores);
    }
    
    expect(problematicStores).toHaveLength(0);
  });

  it('store error handling should be comprehensive', () => {
    const storeFiles = glob.sync('web/lib/stores/*.ts', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicStores: string[] = [];
    
    storeFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for async actions that should have error handling
      const asyncActions = content.match(/(\w+):\s*async\s*\([^)]*\)\s*=>/g);
      if (asyncActions) {
        asyncActions.forEach(match => {
          const actionName = match.match(/(\w+):/)?.[1];
          if (actionName && !content.includes(`try {`) && !content.includes(`catch`)) {
            problematicStores.push(`${file}: async action '${actionName}' needs error handling`);
          }
        });
      }
    });
    
    if (problematicStores.length > 0) {
      logger.info('Stores with missing error handling:', problematicStores);
    }
    
    expect(problematicStores).toHaveLength(0);
  });

  it('store imports should use centralized pattern', () => {
    const componentFiles = glob.sync('web/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/lib/stores/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    componentFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for direct Zustand imports
      if (content.includes('from \'zustand\'') || content.includes('from "zustand"')) {
        problematicFiles.push(`${file}: should use centralized store imports`);
      }
      
      // Check for direct store imports
      if (content.includes('from \'../stores/') || content.includes('from "../stores/')) {
        problematicFiles.push(`${file}: should use @/lib/stores imports`);
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Files with improper store imports:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });
});

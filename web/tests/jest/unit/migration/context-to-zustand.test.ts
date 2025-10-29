/**
 * Context API to Zustand Migration Validation Tests
 *
 * Ensures complete migration from Context API to Zustand stores
 * by scanning for remaining Context API usage patterns.
 *
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as glob from 'glob';

describe('Context API Migration', () => {
  it('no useAuth() calls should remain', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', {
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**']
    });

    const problematicFiles: string[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Check for useAuth() calls
      if (content.includes('useAuth()')) {
        problematicFiles.push(`${file}: contains useAuth() call`);
      }

      // Check for useAuth imports
      if (content.includes('import') && content.includes('useAuth')) {
        problematicFiles.push(`${file}: imports useAuth`);
      }
    });

    if (problematicFiles.length > 0) {
      console.log('Files with useAuth() calls:', problematicFiles);
    }

    expect(problematicFiles).toHaveLength(0);
  });

  it('no Context API imports should remain', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', {
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**']
    });

    const problematicFiles: string[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Check for Context API imports
      if (content.includes('createContext') || content.includes('useContext')) {
        // Allow in specific contexts (like React context for UI)
        if (!content.includes('React.createContext') && !content.includes('createContext(')) {
          problematicFiles.push(`${file}: contains Context API usage`);
        }
      }

      // Check for old auth context imports
      if (content.includes('AuthContext') || content.includes('UserContext')) {
        problematicFiles.push(`${file}: contains old context imports`);
      }
    });

    if (problematicFiles.length > 0) {
      console.log('Files with Context API usage:', problematicFiles);
    }

    expect(problematicFiles).toHaveLength(0);
  });

  it('all stores should use centralized imports', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', {
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**', '**/lib/stores/**']
    });

    const problematicFiles: string[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Check for direct Zustand imports
      if (content.includes('from \'zustand\'') || content.includes('from "zustand"')) {
        problematicFiles.push(`${file}: should use centralized store imports`);
      }

      // Check for direct store imports
      if (content.includes('from \'../stores/') || content.includes('from "../stores/')) {
        problematicFiles.push(`${file}: should use @/lib/stores imports`);
      }

      // Check for store imports that should use centralized pattern
      if (content.includes('useUserStore') || content.includes('useAppStore') || content.includes('useAdminStore')) {
        if (!content.includes('from \'@/lib/stores\'') && !content.includes('from "@/lib/stores"')) {
          problematicFiles.push(`${file}: store imports should use @/lib/stores`);
        }
      }
    });

    if (problematicFiles.length > 0) {
      console.log('Files with improper store imports:', problematicFiles);
    }

    expect(problematicFiles).toHaveLength(0);
  });

  it('store usage should be consistent', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', {
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**']
    });

    const problematicFiles: string[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Check for mixed store usage patterns
      if (content.includes('useUserStore') && content.includes('useAuth')) {
        problematicFiles.push(`${file}: mixed store usage patterns`);
      }

      // Check for old state management patterns
      if (content.includes('useState') && content.includes('useEffect') && content.includes('localStorage')) {
        // This might indicate old state management that should use stores
        if (content.includes('user') || content.includes('auth') || content.includes('app')) {
          problematicFiles.push(`${file}: should use Zustand stores instead of local state`);
        }
      }
    });

    if (problematicFiles.length > 0) {
      console.log('Files with inconsistent store usage:', problematicFiles);
    }

    expect(problematicFiles).toHaveLength(0);
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
        // Should use proper Zustand subscription pattern
        if (!content.includes('useStore.subscribe')) {
          problematicStores.push(`${file}: subscription methods should use useStore.subscribe`);
        }
      }
    });

    if (problematicStores.length > 0) {
      console.log('Stores with improper subscriptions:', problematicStores);
    }

    expect(problematicStores).toHaveLength(0);
  });
});

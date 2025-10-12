/**
 * Analytics Error Prevention Tests
 * 
 * Ensures analytics components handle errors gracefully and
 * maintain data integrity across all analytics operations.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as glob from 'glob';

describe('Analytics Error Prevention', () => {
  it('analytics components should handle errors gracefully', () => {
    const analyticsFiles = glob.sync('web/features/analytics/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    analyticsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for error boundary patterns
      if (content.includes('try {') && content.includes('catch')) {
        // Should have proper error handling
        if (!content.includes('console.error') && !content.includes('logger.error')) {
          problematicFiles.push(`${file}: missing error logging in catch blocks`);
        }
      }
      
      // Check for async operations without error handling
      const asyncMatches = content.match(/async\s+[^{]*\{[^}]*\}/g);
      if (asyncMatches) {
        asyncMatches.forEach(match => {
          if (!match.includes('try') && !match.includes('catch')) {
            problematicFiles.push(`${file}: async operation without error handling`);
          }
        });
      }
    });
    
    if (problematicFiles.length > 0) {
      console.log('Analytics files with missing error handling:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('analytics data should be properly typed', () => {
    const analyticsFiles = glob.sync('web/features/analytics/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    analyticsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for any types in analytics code
      if (content.match(/:\s*any\b/)) {
        problematicFiles.push(`${file}: contains any types`);
      }
      
      // Check for proper interface definitions
      if (content.includes('interface ') || content.includes('type ')) {
        // Should have proper type definitions
        if (!content.includes('[key: string]: unknown') && content.includes('interface ')) {
          problematicFiles.push(`${file}: interface may need index signature`);
        }
      }
    });
    
    if (problematicFiles.length > 0) {
      console.log('Analytics files with type issues:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('analytics tracking should not fail silently', () => {
    const analyticsFiles = glob.sync('web/features/analytics/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    analyticsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for tracking functions
      if (content.includes('track') || content.includes('analytics')) {
        // Should have error handling
        if (!content.includes('try') && !content.includes('catch')) {
          problematicFiles.push(`${file}: tracking functions should have error handling`);
        }
      }
      
      // Check for silent failures
      if (content.includes('catch') && !content.includes('console.error') && !content.includes('logger')) {
        problematicFiles.push(`${file}: catch blocks should log errors`);
      }
    });
    
    if (problematicFiles.length > 0) {
      console.log('Analytics files with silent failures:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('analytics state should be properly managed', () => {
    const analyticsFiles = glob.sync('web/features/analytics/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    analyticsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for useState without proper error handling
      if (content.includes('useState') && content.includes('setError')) {
        // Should have proper error state management
        if (!content.includes('error') || !content.includes('setError')) {
          problematicFiles.push(`${file}: error state not properly managed`);
        }
      }
      
      // Check for loading states
      if (content.includes('useState') && content.includes('setLoading')) {
        // Should have proper loading state management
        if (!content.includes('loading') || !content.includes('setLoading')) {
          problematicFiles.push(`${file}: loading state not properly managed`);
        }
      }
    });
    
    if (problematicFiles.length > 0) {
      console.log('Analytics files with state management issues:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });
});

/**
 * Cross-Feature Integration Tests
 * 
 * Ensures features work together properly and maintain
 * system coherence across feature interactions.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect } from '@jest/globals';
import { logger } from '@/lib/utils/logger';
import * as fs from 'fs';
import * as glob from 'glob';

describe('Feature Integration Error Prevention', () => {
  it('hashtag integration should work across features', () => {
    const hashtagFiles = glob.sync('web/features/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    hashtagFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for hashtag integration
      if (content.includes('hashtag') || content.includes('Hashtag')) {
        // Should have proper integration
        if (!content.includes('useHashtagStore') && !content.includes('hashtagStore')) {
          problematicFiles.push(`${file}: hashtag integration should use store`);
        }
      }
      
      // Check for hashtag state management
      if (content.includes('hashtag') && content.includes('useState')) {
        // Should use store instead of local state
        if (!content.includes('useHashtagStore')) {
          problematicFiles.push(`${file}: hashtag state should use store`);
        }
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Files with hashtag integration issues:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('analytics should track across all features', () => {
    const featureFiles = glob.sync('web/features/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    featureFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for analytics integration
      if (content.includes('onClick') || content.includes('onSubmit') || content.includes('onChange')) {
        // Should have analytics tracking
        if (!content.includes('track') && !content.includes('analytics') && !content.includes('event')) {
          problematicFiles.push(`${file}: user interactions should be tracked`);
        }
      }
      
      // Check for analytics state management
      if (content.includes('analytics') && content.includes('useState')) {
        // Should use analytics store
        if (!content.includes('useAnalyticsStore')) {
          problematicFiles.push(`${file}: analytics should use store`);
        }
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Files with missing analytics tracking:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('state management should be consistent across features', () => {
    const featureFiles = glob.sync('web/features/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    featureFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for store usage consistency
      if (content.includes('useState') && content.includes('user')) {
        // Should use user store
        if (!content.includes('useUserStore')) {
          problematicFiles.push(`${file}: user state should use store`);
        }
      }
      
      if (content.includes('useState') && content.includes('app')) {
        // Should use app store
        if (!content.includes('useAppStore')) {
          problematicFiles.push(`${file}: app state should use store`);
        }
      }
      
      if (content.includes('useState') && content.includes('notification')) {
        // Should use notification store
        if (!content.includes('useNotificationStore')) {
          problematicFiles.push(`${file}: notification state should use store`);
        }
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Files with inconsistent state management:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('error handling should be consistent across features', () => {
    const featureFiles = glob.sync('web/features/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    featureFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for error handling consistency
      if (content.includes('catch') && content.includes('error')) {
        // Should have consistent error handling
        if (!content.includes('logger.error') && !content.includes('console.error')) {
          problematicFiles.push(`${file}: error handling should be consistent`);
        }
      }
      
      // Check for error state management
      if (content.includes('error') && content.includes('useState')) {
        // Should have proper error state management
        if (!content.includes('setError') && !content.includes('setLoading')) {
          problematicFiles.push(`${file}: error state should be properly managed`);
        }
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Files with inconsistent error handling:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });
});

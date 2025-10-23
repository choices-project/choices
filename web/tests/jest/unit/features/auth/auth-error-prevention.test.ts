/**
 * Authentication Error Prevention Tests
 * 
 * Ensures authentication components handle security-critical errors
 * properly and maintain user security across all auth operations.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect } from '@jest/globals';
import { logger } from '@/lib/utils/logger';
import * as fs from 'fs';
import * as glob from 'glob';

describe('Authentication Error Prevention', () => {
  it('WebAuthn errors should be properly handled', () => {
    const authFiles = glob.sync('web/features/auth/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    authFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for WebAuthn operations
      if (content.includes('navigator.credentials') || content.includes('webauthn')) {
        // Should have proper error handling
        if (!content.includes('try') && !content.includes('catch')) {
          problematicFiles.push(`${file}: WebAuthn operations should have error handling`);
        }
      }
      
      // Check for credential operations
      if (content.includes('create') || content.includes('get')) {
        // Should have proper error handling
        if (!content.includes('catch') && content.includes('credentials')) {
          problematicFiles.push(`${file}: credential operations should have error handling`);
        }
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Auth files with missing WebAuthn error handling:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('authentication state should be properly managed', () => {
    const authFiles = glob.sync('web/features/auth/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    authFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for authentication state management
      if (content.includes('isAuthenticated') || content.includes('user')) {
        // Should have proper state management
        if (!content.includes('useState') && !content.includes('useStore')) {
          problematicFiles.push(`${file}: authentication state not properly managed`);
        }
      }
      
      // Check for error state management
      if (content.includes('error') && content.includes('setError')) {
        // Should have proper error state management
        if (!content.includes('try') && !content.includes('catch')) {
          problematicFiles.push(`${file}: error state not properly managed`);
        }
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Auth files with state management issues:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('login failures should provide user feedback', () => {
    const authFiles = glob.sync('web/features/auth/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    authFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for login operations
      if (content.includes('login') || content.includes('signIn')) {
        // Should have user feedback
        if (!content.includes('toast') && !content.includes('alert') && !content.includes('message')) {
          problematicFiles.push(`${file}: login operations should provide user feedback`);
        }
      }
      
      // Check for error handling
      if (content.includes('catch') && content.includes('error')) {
        // Should have user feedback in error cases
        if (!content.includes('toast') && !content.includes('alert') && !content.includes('message')) {
          problematicFiles.push(`${file}: error handling should provide user feedback`);
        }
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Auth files with missing user feedback:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('authentication should be secure', () => {
    const authFiles = glob.sync('web/features/auth/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    authFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for hardcoded credentials
      if (content.includes('password') && content.includes('"') && content.includes('admin')) {
        problematicFiles.push(`${file}: potential hardcoded credentials`);
      }
      
      // Check for insecure storage
      if (content.includes('localStorage') && content.includes('token')) {
        problematicFiles.push(`${file}: tokens should not be stored in localStorage`);
      }
      
      // Check for console.log with sensitive data
      if (content.includes('console.log') && (content.includes('password') || content.includes('token'))) {
        problematicFiles.push(`${file}: sensitive data should not be logged`);
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Auth files with security issues:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });
});

/**
 * Type Safety Enforcement Tests
 * 
 * Prevents regression by enforcing TypeScript best practices
 * and rejecting problematic patterns in production code.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect } from '@jest/globals';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const execAsync = promisify(exec);

describe('Type Safety Enforcement', () => {
  it('should reject any types in production code', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**'] 
    });
    
    const problematicFiles: string[] = [];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for explicit any types (but allow in test files)
      if (content.match(/:\s*any\b(?!\s*[;=])/)) {
        problematicFiles.push(file);
      }
      
      // Check for unsafe any usage
      if (content.match(/as\s+any\b/)) {
        problematicFiles.push(file);
      }
    });
    
    if (problematicFiles.length > 0) {
      logger.info('Files with any types:', problematicFiles);
    }
    
    expect(problematicFiles).toHaveLength(0);
  });

  it('should have proper type definitions', () => {
    const typeFiles = glob.sync('web/**/*.d.ts');
    expect(typeFiles.length).toBeGreaterThan(0);
  });

  it('should have no TypeScript errors', async () => {
    try {
      const { stdout, stderr } = await execAsync('cd web && npm run types:strict');
      
      // Check for TypeScript errors (non-zero exit code indicates errors)
      if (stderr && stderr.includes('error TS')) {
        console.error('TypeScript errors found:', stderr);
        expect(stderr).not.toContain('error TS');
      }
    } catch (error) {
      // If the command fails, it means there are TypeScript errors
      console.error('TypeScript check failed:', error);
      expect(error).toBeNull();
    }
  });

  it('should have no linting errors', async () => {
    try {
      const { stdout, stderr } = await execAsync('cd web && npm run lint:strict');
      
      // Check for linting errors
      if (stderr && stderr.includes('error')) {
        console.error('Linting errors found:', stderr);
        expect(stderr).not.toContain('error');
      }
    } catch (error) {
      // If the command fails, it means there are linting errors
      console.error('Linting check failed:', error);
      expect(error).toBeNull();
    }
  });

  it('should have proper interface definitions', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**'] 
    });
    
    const interfaceFiles: string[] = [];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for interface definitions
      if (content.includes('interface ') || content.includes('type ')) {
        interfaceFiles.push(file);
      }
    });
    
    expect(interfaceFiles.length).toBeGreaterThan(0);
  });

  it('should have proper error handling types', () => {
    const files = glob.sync('web/**/*.{ts,tsx}', { 
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**'] 
    });
    
    const errorHandlingFiles: string[] = [];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for proper error handling patterns
      if (content.includes('try {') && content.includes('catch')) {
        // Should have proper error typing
        if (content.includes('catch (error:') || content.includes('catch (err:')) {
          errorHandlingFiles.push(file);
        }
      }
    });
    
    // At least some files should have proper error handling
    expect(errorHandlingFiles.length).toBeGreaterThan(0);
  });
});

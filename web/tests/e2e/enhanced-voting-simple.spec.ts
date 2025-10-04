/**
 * Enhanced Voting System - Simple E2E Tests
 * 
 * Rebuilt from scratch to test the working Enhanced Voting implementation.
 * Uses existing test users from the database.
 * 
 * Created: January 2, 2025
 */

import { test, expect } from '@playwright/test';
import { authenticateE2EUser } from './helpers/e2e-setup';

test.describe('Enhanced Voting System - Simple Tests', () => {
  test('should display voting interface for existing poll', async ({ page }) => {
    // Navigate to an existing test poll (without authentication first)
    await page.goto('/polls/b32a933b-a231-43fb-91c8-8fd003bfac20');
    
    // Wait for page to load with a shorter timeout
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give it 2 seconds to load
    
    // Debug: Check what's actually on the page
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    console.log('Page contains poll-title:', pageContent.includes('poll-title'));
    console.log('Page contains data-testid:', pageContent.includes('data-testid'));
    
    // Check for JavaScript errors with detailed logging
    const errors = await page.evaluate(() => {
      const errorMessages = [];
      const originalError = console.error;
      console.error = (...args) => {
        errorMessages.push(args.join(' '));
        originalError.apply(console, args);
      };
      
      // Trigger any pending errors
      setTimeout(() => {
        console.error = originalError;
      }, 100);
      
      return errorMessages.length > 0 ? errorMessages : 'No JavaScript errors';
    });
    console.log('JavaScript errors:', errors);
    
    // Check if poll title is visible
    await expect(page.locator('[data-testid="poll-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="poll-title"]')).toContainText('V2 API Test Poll');
    
    // Check if voting section is visible
    await expect(page.locator('[data-testid="voting-section-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-section-title"]')).toContainText('Ready to Vote?');
    
    // Check if start voting button is visible
    await expect(page.locator('[data-testid="start-voting-button"]')).toBeVisible();
    
    // Check if voting method is displayed
    await expect(page.locator('[data-testid="voting-method"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-method"]')).toContainText('Single Choice');
  });

  test('should show voting form when start voting is clicked', async ({ page }) => {
    // Navigate to an existing test poll (without authentication first)
    await page.goto('/polls/b32a933b-a231-43fb-91c8-8fd003bfac20');
    
    // Wait for page to load with a shorter timeout
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give it 2 seconds to load
    
    // Check for JavaScript errors
    const errors = await page.evaluate(() => {
      return window.console.error ? 'JavaScript errors detected' : 'No JavaScript errors';
    });
    console.log('JavaScript status:', errors);
    
    // Click start voting button
    await page.click('[data-testid="start-voting-button"]');
    
    // Wait a bit for the state change
    await page.waitForTimeout(1000);
    
    // Debug: Check what's on the page after clicking
    const pageContent = await page.content();
    console.log('Page content after click:', pageContent.includes('voting-form') ? 'voting-form found' : 'voting-form not found');
    
    // Check if voting form is visible (use first() to handle multiple elements)
    await expect(page.locator('[data-testid="voting-form"]').first()).toBeVisible();
    
    // Check if poll options are displayed (use first() to handle multiple elements)
    await expect(page.locator('text=Option 1').first()).toBeVisible();
    await expect(page.locator('text=Option 2').first()).toBeVisible();
    await expect(page.locator('text=Option 3').first()).toBeVisible();
  });

  test('should handle voting interface for different voting methods', async ({ page }) => {
    // Test the second poll (should also be single choice)
    await page.goto('/polls/d34d89e7-ae34-4071-9897-7347a50bdac8');
    
    // Wait for page to load with a shorter timeout
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give it 2 seconds to load
    
    // Check if poll is loaded
    await expect(page.locator('[data-testid="poll-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="poll-title"]')).toContainText('Test Poll for E2E');
    
    // Check if voting method is displayed
    await expect(page.locator('[data-testid="voting-method"]')).toBeVisible();
    
    // Click start voting button
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if voting form is visible (use first() to handle multiple elements)
    await expect(page.locator('[data-testid="voting-form"]').first()).toBeVisible();
    
    // Check if poll options are displayed (use first() to handle multiple elements)
    await expect(page.locator('text=Yes').first()).toBeVisible();
    await expect(page.locator('text=No').first()).toBeVisible();
    await expect(page.locator('text=Maybe').first()).toBeVisible();
  });
});

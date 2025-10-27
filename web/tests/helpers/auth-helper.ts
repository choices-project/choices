/**
 * Authentication Helper
 * 
 * Provides authentication utilities for E2E tests including
 * login, logout, and user session management.
 * 
 * @fileoverview Authentication helper for E2E testing
 * @author Choices Platform Team
 * @created 2025-10-24
 * @updated 2025-10-24
 * @status ACTIVE
 * @version 1.0.0
 * 
 * @requires @playwright/test
 */

import { Page, expect } from '@playwright/test';
import { TestIds } from '../registry/testIds';

/**
 * Interface for authentication credentials
 */
export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

/**
 * Interface for authentication result
 */
export interface AuthResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

/**
 * Authentication Helper Class
 * 
 * Provides comprehensive authentication utilities for E2E tests
 * with proper error handling and validation.
 */
export class AuthHelper {
  private page: Page;
  private baseUrl: string;

  /**
   * Constructor for AuthHelper
   * @param page - Playwright page instance
   * @param baseUrl - Base URL for the application
   */
  constructor(page: Page, baseUrl: string = 'http://localhost:3000') {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  /**
   * Navigate to login page
   * @returns Promise<void>
   */
  public async navigateToLogin(): Promise<void> {
    try {
      await this.page.goto(`${this.baseUrl}/auth/login`);
      await this.page.waitForLoadState('networkidle');
      console.log('🔐 Navigated to login page');
    } catch (error) {
      console.error('❌ Error navigating to login page:', error);
      throw error;
    }
  }

  /**
   * Navigate to register page
   * @returns Promise<void>
   */
  public async navigateToRegister(): Promise<void> {
    try {
      await this.page.goto(`${this.baseUrl}/auth/register`);
      await this.page.waitForLoadState('networkidle');
      console.log('📝 Navigated to register page');
    } catch (error) {
      console.error('❌ Error navigating to register page:', error);
      throw error;
    }
  }

  /**
   * Perform login with credentials
   * @param credentials - Login credentials
   * @returns Promise<AuthResult> - Authentication result
   */
  public async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      console.log(`🔐 Attempting login for: ${credentials.email}`);
      
      // Navigate to login page if not already there
      if (!this.page.url().includes('/auth/login')) {
        await this.navigateToLogin();
      }

      // Fill in email
      await this.page.fill(`[data-testid="${TestIds.AUTH.EMAIL_INPUT}"]`, credentials.email);
      
      // Fill in password
      await this.page.fill(`[data-testid="${TestIds.AUTH.PASSWORD_INPUT}"]`, credentials.password);
      
      // Click login button
      await this.page.click(`[data-testid="${TestIds.AUTH.LOGIN_BUTTON}"]`);
      
      // Wait for navigation or error
      try {
        await this.page.waitForURL(url => 
          url.toString().includes('/dashboard') || 
          url.toString().includes('/onboarding') ||
          url.toString().includes('/profile')
        , { timeout: 10000 });
        
        console.log('✅ Login successful');
        return {
          success: true,
          redirectUrl: this.page.url()
        };
      } catch (timeoutError) {
        // Check for error messages
        const errorElement = await this.page.locator(`[data-testid="${TestIds.ERRORS.ERROR_MESSAGE}"]`).first();
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log(`❌ Login failed: ${errorText}`);
          return {
            success: false,
            error: errorText || 'Login failed'
          };
        }
        
        console.log('❌ Login timeout');
        return {
          success: false,
          error: 'Login timeout'
        };
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Perform registration with credentials
   * @param credentials - Registration credentials
   * @returns Promise<AuthResult> - Authentication result
   */
  public async register(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      console.log(`📝 Attempting registration for: ${credentials.email}`);
      
      // Navigate to register page if not already there
      if (!this.page.url().includes('/auth/register')) {
        await this.navigateToRegister();
      }

      // Fill in email
      await this.page.fill(`[data-testid="${TestIds.AUTH.EMAIL_INPUT}"]`, credentials.email);
      
      // Fill in password
      await this.page.fill(`[data-testid="${TestIds.AUTH.PASSWORD_INPUT}"]`, credentials.password);
      
      // Fill in name if provided
      if (credentials.name) {
        await this.page.fill(`[data-testid="${TestIds.PROFILE.NAME_INPUT}"]`, credentials.name);
      }
      
      // Click register button
      await this.page.click(`[data-testid="${TestIds.AUTH.REGISTER_BUTTON}"]`);
      
      // Wait for navigation or error
      try {
        await this.page.waitForURL(url => 
          url.toString().includes('/dashboard') || 
          url.toString().includes('/onboarding') ||
          url.toString().includes('/profile')
        , { timeout: 15000 });
        
        console.log('✅ Registration successful');
        return {
          success: true,
          redirectUrl: this.page.url()
        };
      } catch (timeoutError) {
        // Check for error messages
        const errorElement = await this.page.locator(`[data-testid="${TestIds.ERRORS.ERROR_MESSAGE}"]`).first();
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log(`❌ Registration failed: ${errorText}`);
          return {
            success: false,
            error: errorText || 'Registration failed'
          };
        }
        
        console.log('❌ Registration timeout');
        return {
          success: false,
          error: 'Registration timeout'
        };
      }
    } catch (error) {
      console.error('❌ Error during registration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Perform logout
   * @returns Promise<AuthResult> - Authentication result
   */
  public async logout(): Promise<AuthResult> {
    try {
      console.log('🚪 Attempting logout');
      
      // Look for logout button in user menu
      const userMenuToggle = this.page.locator(`[data-testid="${TestIds.NAVIGATION.USER_MENU_TOGGLE}"]`);
      if (await userMenuToggle.isVisible()) {
        await userMenuToggle.click();
        await this.page.waitForTimeout(500); // Wait for menu to open
      }
      
      // Click logout button
      const logoutButton = this.page.locator(`[data-testid="${TestIds.AUTH.LOGOUT_BUTTON}"]`);
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      } else {
        // Try direct navigation to logout
        await this.page.goto(`${this.baseUrl}/auth/logout`);
      }
      
      // Wait for redirect to login page
      await this.page.waitForURL(url => url.toString().includes('/auth/login'), { timeout: 5000 });
      
      console.log('✅ Logout successful');
      return {
        success: true,
        redirectUrl: this.page.url()
      };
    } catch (error) {
      console.error('❌ Error during logout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if user is authenticated
   * @returns Promise<boolean> - True if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    try {
      // Check for user menu or dashboard elements
      const userMenu = this.page.locator(`[data-testid="${TestIds.NAVIGATION.USER_MENU}"]`);
      const dashboard = this.page.locator(`[data-testid="${TestIds.DASHBOARD.DASHBOARD_CONTAINER}"]`);
      
      return await userMenu.isVisible() || await dashboard.isVisible();
    } catch (error) {
      console.error('❌ Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get current user info from the page
   * @returns Promise<string | null> - User email or null
   */
  public async getCurrentUser(): Promise<string | null> {
    try {
      // Try to get user info from user menu or profile
      const userMenu = this.page.locator(`[data-testid="${TestIds.NAVIGATION.USER_MENU}"]`);
      if (await userMenu.isVisible()) {
        const userText = await userMenu.textContent();
        return userText;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  /**
   * Wait for authentication to complete
   * @param timeout - Timeout in milliseconds
   * @returns Promise<boolean> - True if authentication completed
   */
  public async waitForAuthentication(timeout: number = 10000): Promise<boolean> {
    try {
      await this.page.waitForURL(url => 
        url.toString().includes('/dashboard') || 
        url.toString().includes('/onboarding') ||
        url.toString().includes('/profile')
      , { timeout });
      
      return true;
    } catch (error) {
      console.error('❌ Authentication timeout:', error);
      return false;
    }
  }

  /**
   * Clear authentication state
   * @returns Promise<void>
   */
  public async clearAuthState(): Promise<void> {
    try {
      // Clear cookies and local storage
      await this.page.context().clearCookies();
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      console.log('🧹 Authentication state cleared');
    } catch (error) {
      console.error('❌ Error clearing authentication state:', error);
    }
  }
}

/**
 * Default export for convenience
 */
export default AuthHelper;



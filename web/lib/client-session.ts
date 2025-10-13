/**
 * Client session utilities
 * 
 * This module provides client-side session management functions.
 * It replaces the old @/shared/utils/lib/client-session imports.
 */

export const clientSession = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore errors
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch {
      // Ignore errors
    }
  },

  login: async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Basic client-side validation using the supplied password
      const issues: string[] = [];
      if (!password || password.length < 8) issues.push('Password must be at least 8 characters.');
      if (!/[A-Za-z]/.test(password)) issues.push('Password must include a letter.');
      if (!/[0-9]/.test(password)) issues.push('Password must include a number.');
      if (issues.length) {
        return { success: false, error: issues.join(' ') };
      }
      // This is a placeholder implementation; do not log plaintext passwords
      logger.info('Login attempt:', { email, password: '***' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Minimal client session persistence for MVP
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('session_user', email);
          localStorage.setItem('auth_last_login', new Date().toISOString());
        } catch {
          // ignore storage failures
        }
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }
};

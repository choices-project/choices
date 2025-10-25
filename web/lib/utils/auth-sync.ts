/**
 * Authentication State Synchronization Utility
 * 
 * Handles synchronization between server-side authentication and client-side state
 * Used to fix E2E test authentication state issues
 */

import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import { logger } from '@/lib/utils/logger';

/**
 * Force authentication state synchronization
 * This is called after server-side authentication to ensure client-side state is updated
 */
export async function forceAuthStateSync(): Promise<boolean> {
  try {
    logger.info('🔄 Forcing authentication state synchronization...');
    
    const supabase = await getSupabaseBrowserClient();
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('❌ Error getting session:', error);
      return false;
    }
    
    if (session?.user) {
      logger.info('✅ Session found, user authenticated:', { email: session.user.email });
      
      // Force a page reload to trigger UserStoreProvider re-initialization
      if (typeof window !== 'undefined') {
        logger.info('🔄 Reloading page to sync authentication state...');
        window.location.reload();
        return true;
      }
    } else {
      logger.info('❌ No session found, user not authenticated');
      return false;
    }
    
    return false;
  } catch (error) {
    logger.error('❌ Error in forceAuthStateSync:', error as Error);
    return false;
  }
}

/**
 * Check if user is authenticated by calling the profile API
 * This bypasses the React state and checks server-side authentication directly
 */
export async function checkServerSideAuth(): Promise<boolean> {
  try {
    logger.info('🔍 Checking server-side authentication...');
    
    const response = await fetch('/api/profile', {
      credentials: 'include',
    });
    
    if (response.ok) {
      const profileData = await response.json();
      const isAuthenticated = !!profileData.profile;
      logger.info('🔍 Server-side auth check result:', { isAuthenticated });
      return isAuthenticated;
    }
    
    logger.info('🔍 Server-side auth check failed:', { status: response.status });
    return false;
  } catch (error) {
    logger.error('❌ Error checking server-side auth:', error as Error);
    return false;
  }
}

/**
 * Wait for authentication state to be properly synchronized
 * This is used in E2E tests to ensure authentication state is ready
 */
export async function waitForAuthSync(maxAttempts: number = 5): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.info(`🔄 Auth sync attempt ${attempt}/${maxAttempts}...`);
    
    const isAuthenticated = await checkServerSideAuth();
    
    if (isAuthenticated) {
      logger.info('✅ Authentication state synchronized');
      return true;
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  logger.warn('⚠️ Authentication state synchronization failed after all attempts');
  return false;
}

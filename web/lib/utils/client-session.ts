import logger from '@/lib/utils/logger';
/**
 * Client Session Utility
 * 
 * Client-side session management
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

/**
 * Get session data from localStorage
 */
export function getSessionData(): Record<string, unknown> | null {
  try {
    const data = localStorage.getItem('session');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Set session data in localStorage
 */
export function setSessionData(data: Record<string, unknown>): void {
  try {
    localStorage.setItem('session', JSON.stringify(data));
  } catch (error) {
    logger.error('Failed to set session data:', error);
  }
}

/**
 * Clear session data from localStorage
 */
export function clearSessionData(): void {
  try {
    localStorage.removeItem('session');
  } catch (error) {
    logger.error('Failed to clear session data:', error);
  }
}

/**
 * Check if session exists
 */
export function hasSession(): boolean {
  return getSessionData() !== null;
}

/**
 * Get session token
 */
export function getSessionToken(): string | null {
  const session = getSessionData();
  return (session?.token as string | undefined) ?? null;
}

/**
 * Set session token
 */
export function setSessionToken(token: string): void {
  const session = getSessionData() ?? {};
  session.token = token;
  setSessionData(session);
}

export default {
  getSessionData,
  setSessionData,
  clearSessionData,
  hasSession,
  getSessionToken,
  setSessionToken
};
/**
 * Enhanced JWT Management System
 * 
 * Provides secure JWT token lifecycle management with:
 * - 4-hour access token lifetime
 * - Simple secret rotation capability
 * - Standard JWT claims (iss, aud, sub, jti)
 * - Comprehensive error handling
 * - Type-safe payload management
 */

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// Environment configuration
const JWT_SECRET_CURRENT = process.env.JWT_SECRET_CURRENT || process.env.JWT_SECRET;
const JWT_SECRET_OLD = process.env.JWT_SECRET_OLD;
const JWT_ISSUER = process.env.JWT_ISSUER || 'https://choices-platform.vercel.app';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'choices-web';

// Token lifetime configuration
const ACCESS_TOKEN_LIFETIME = 4 * 60 * 60; // 4 hours in seconds
const REFRESH_TOKEN_LIFETIME = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Enhanced JWT payload with standard claims
 */
export interface EnhancedJWTPayload {
  // Standard JWT claims
  iss: string;           // Issuer
  aud: string;           // Audience
  sub: string;           // Subject (user ID)
  jti: string;           // JWT ID (unique token identifier)
  iat: number;           // Issued at
  exp: number;           // Expires at
  
  // Custom claims
  userId: string;        // User ID for backward compatibility
  stableId: string;      // Stable user identifier
  username: string;      // Username
  tier: 'T0' | 'T1' | 'T2' | 'T3'; // Trust tier
  sessionId: string;     // Session identifier for tracking
}

/**
 * User data for token creation
 */
export interface TokenUser {
  id: string;
  stableId: string;
  username: string;
  tier: 'T0' | 'T1' | 'T2' | 'T3';
}

/**
 * Token creation result
 */
export interface TokenResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  sessionId: string;
}

/**
 * Token verification result
 */
export interface TokenVerificationResult {
  valid: boolean;
  payload?: EnhancedJWTPayload;
  error?: string;
  needsRefresh?: boolean;
}

/**
 * Validates JWT environment configuration
 */
function validateJWTConfig(): void {
  if (!JWT_SECRET_CURRENT) {
    throw new Error('JWT_SECRET_CURRENT environment variable is required');
  }
  
  if (!JWT_ISSUER) {
    throw new Error('JWT_ISSUER environment variable is required');
  }
  
  if (!JWT_AUDIENCE) {
    throw new Error('JWT_AUDIENCE environment variable is required');
  }
}

/**
 * Creates a new access token with enhanced security
 * 
 * @param user - User data for token creation
 * @param sessionId - Optional session ID, generates new one if not provided
 * @returns Access token string
 */
export function createAccessToken(user: TokenUser, sessionId?: string): string {
  validateJWTConfig();
  
  const sessionIdValue = sessionId || randomUUID();
  
  const payload: Omit<EnhancedJWTPayload, 'iat' | 'exp'> = {
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    sub: user.stableId,
    jti: randomUUID(),
    userId: user.id,
    stableId: user.stableId,
    username: user.username,
    tier: user.tier,
    sessionId: sessionIdValue,
  };
  
  return jwt.sign(payload, JWT_SECRET_CURRENT!, {
    expiresIn: ACCESS_TOKEN_LIFETIME,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

/**
 * Creates a refresh token for session renewal
 * 
 * @param user - User data for token creation
 * @param sessionId - Session ID to associate with refresh token
 * @returns Refresh token string
 */
export function createRefreshToken(user: TokenUser, sessionId: string): string {
  validateJWTConfig();
  
  const payload = {
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    sub: user.stableId,
    jti: randomUUID(),
    type: 'refresh',
    sessionId,
    userId: user.id,
    stableId: user.stableId,
  };
  
  return jwt.sign(payload, JWT_SECRET_CURRENT!, {
    expiresIn: REFRESH_TOKEN_LIFETIME,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

/**
 * Creates both access and refresh tokens
 * 
 * @param user - User data for token creation
 * @returns Token creation result
 */
export function createTokenPair(user: TokenUser): TokenResult {
  const sessionId = randomUUID();
  const accessToken = createAccessToken(user, sessionId);
  const refreshToken = createRefreshToken(user, sessionId);
  const expiresAt = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_LIFETIME;
  
  return {
    accessToken,
    refreshToken,
    expiresAt,
    sessionId,
  };
}

/**
 * Verifies a JWT token with rotation support
 * 
 * @param token - JWT token to verify
 * @param allowExpired - Whether to allow expired tokens (for refresh scenarios)
 * @returns Token verification result
 */
export function verifyToken(token: string, allowExpired: boolean = false): TokenVerificationResult {
  validateJWTConfig();
  
  try {
    // Try current secret first
    const payload = jwt.verify(token, JWT_SECRET_CURRENT!, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      ignoreExpiration: allowExpired,
    }) as EnhancedJWTPayload;
    
    return {
      valid: true,
      payload,
      needsRefresh: allowExpired,
    };
  } catch (error) {
    // If current secret fails and we have an old secret, try that
    if (JWT_SECRET_OLD && error instanceof jwt.JsonWebTokenError) {
      try {
        const payload = jwt.verify(token, JWT_SECRET_OLD, {
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
          ignoreExpiration: allowExpired,
        }) as EnhancedJWTPayload;
        
        return {
          valid: true,
          payload,
          needsRefresh: true, // Token signed with old secret needs refresh
        };
      } catch {
        return {
          valid: false,
          error: 'Token verification failed with both current and old secrets',
        };
      }
    }
    
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

/**
 * Verifies an access token
 * 
 * @param token - Access token to verify
 * @returns Token verification result
 */
export function verifyAccessToken(token: string): TokenVerificationResult {
  return verifyToken(token, false);
}

/**
 * Verifies a refresh token
 * 
 * @param token - Refresh token to verify
 * @returns Token verification result
 */
export function verifyRefreshToken(token: string): TokenVerificationResult {
  const result = verifyToken(token, true);
  
  if (result.valid && result.payload) {
    // Check if it's actually a refresh token
    const payload = result.payload as any;
    if (payload.type !== 'refresh') {
      return {
        valid: false,
        error: 'Token is not a refresh token',
      };
    }
  }
  
  return result;
}

/**
 * Extracts token expiration time
 * 
 * @param token - JWT token
 * @returns Expiration timestamp in seconds, or null if invalid
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.exp || null;
  } catch {
    return null;
  }
}

/**
 * Checks if a token is expired
 * 
 * @param token - JWT token
 * @returns True if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiration(token);
  if (!exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return now >= exp;
}

/**
 * Gets time until token expires
 * 
 * @param token - JWT token
 * @returns Seconds until expiration, or 0 if expired/invalid
 */
export function getTimeUntilExpiration(token: string): number {
  const exp = getTokenExpiration(token);
  if (!exp) return 0;
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, exp - now);
}

/**
 * Creates a new access token from a valid refresh token
 * 
 * @param refreshToken - Valid refresh token
 * @param user - Current user data
 * @returns New token pair or null if refresh token is invalid
 */
export function refreshAccessToken(refreshToken: string, user: TokenUser): TokenResult | null {
  const verification = verifyRefreshToken(refreshToken);
  
  if (!verification.valid || !verification.payload) {
    return null;
  }
  
  // Use the same session ID from the refresh token
  const sessionId = (verification.payload as any).sessionId;
  
  return {
    accessToken: createAccessToken(user, sessionId),
    refreshToken: createRefreshToken(user, sessionId),
    expiresAt: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_LIFETIME,
    sessionId,
  };
}

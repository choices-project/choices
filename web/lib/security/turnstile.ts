/**
 * Cloudflare Turnstile Integration
 * 
 * Implements Cloudflare Turnstile CAPTCHA verification for enhanced security.
 * Protects against automated attacks and bot submissions.
 */

import { devLog } from '../logger';
import { withOptional } from '../util/objects';

export type TurnstileConfig = {
  secretKey: string;
  siteKey: string;
  enabled: boolean;
  strictMode: boolean;
  timeout: number;
}

export type TurnstileResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  error_codes?: string[];
}

export type TurnstileVerificationResult = {
  success: boolean;
  error?: string;
  errorCodes?: string[];
  hostname?: string;
  action?: string;
  timestamp?: string;
}

/**
 * Default Turnstile configuration
 */
const DEFAULT_TURNSTILE_CONFIG: TurnstileConfig = {
  secretKey: process.env.TURNSTILE_SECRET_KEY ?? '',
  siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
  enabled: process.env.NODE_ENV === 'production' && !!process.env.TURNSTILE_SECRET_KEY,
  strictMode: process.env.NODE_ENV === 'production',
  timeout: 10000, // 10 seconds
};

/**
 * Verify Turnstile token with Cloudflare
 */
export async function verifyTurnstileToken(
  token: string,
  config: Partial<TurnstileConfig> = {}
): Promise<TurnstileVerificationResult> {
  const finalConfig = Object.assign({}, DEFAULT_TURNSTILE_CONFIG, config);

  // Skip verification if disabled
  if (!finalConfig.enabled) {
    devLog('Turnstile verification skipped (disabled)');
    return { success: true };
  }

  // Validate required configuration
  if (!finalConfig.secretKey) {
    devLog('Turnstile verification failed: Missing secret key');
    return { 
      success: false, 
      error: 'Turnstile configuration missing' 
    };
  }

  if (!token) {
    devLog('Turnstile verification failed: Missing token');
    return { 
      success: false, 
      error: 'Turnstile token required' 
    };
  }

  try {
    // Prepare form data for Cloudflare API
    const formData = new FormData();
    formData.append('secret', finalConfig.secretKey);
    formData.append('response', token);
    formData.append('remoteip', 'unknown'); // We don't have IP in this context

    // Make request to Cloudflare Turnstile API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Turnstile API error: ${response.status} ${response.statusText}`);
    }

    const result: TurnstileResponse = await response.json();

    // Log verification attempt
    devLog('Turnstile verification result:', {
      success: result.success,
      errorCodes: result.error_codes,
      hostname: result.hostname,
      action: result.action,
    });

    if (!result.success) {
      return withOptional(
        { success: false },
        { 
          error: 'Turnstile verification failed',
          errorCodes: result.error_codes
        }
      );
    }

    // Additional validation in strict mode
    if (finalConfig.strictMode) {
      const validationResult = validateTurnstileResponse(result, finalConfig);
      if (!validationResult.success) {
        return validationResult;
      }
    }

    return withOptional(
      { success: true },
      { 
        hostname: result.hostname,
        action: result.action,
        timestamp: result.challenge_ts
      }
    );

  } catch (error) {
    devLog('Turnstile verification error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Turnstile verification timeout',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate Turnstile response in strict mode
 */
function validateTurnstileResponse(
  response: TurnstileResponse,
  config: TurnstileConfig
): TurnstileVerificationResult {
  // Use config for validation settings
  if (config.strictMode) {
    // Validate hostname if provided
    if (response.hostname) {
      const allowedHostnames = [
        'choices-platform.vercel.app',
        'choices.app',
        'www.choices.app',
      ];

      if (process.env.NODE_ENV === 'development') {
        allowedHostnames.push('localhost', '127.0.0.1');
      }

      if (!allowedHostnames.includes(response.hostname)) {
        return {
          success: false,
          error: `Invalid hostname: ${response.hostname}`,
          hostname: response.hostname,
        };
      }
    }
  }

  // Validate action if provided
  if (response.action) {
    const allowedActions = [
      'login',
      'register',
      'vote',
      'create_poll',
      'contact',
    ];

    if (!allowedActions.includes(response.action)) {
      return {
        success: false,
        error: `Invalid action: ${response.action}`,
        action: response.action,
      };
    }
  }

  return { success: true };
}

/**
 * Middleware function to verify Turnstile token in API routes
 */
export async function requireTurnstileVerification(
  request: Request,
  expectedAction?: string,
  config?: Partial<TurnstileConfig>
): Promise<void> {
  const finalConfig = Object.assign({}, DEFAULT_TURNSTILE_CONFIG, config);

  // Skip if disabled
  if (!finalConfig.enabled) {
    return;
  }

  // Extract token from request
  const token = extractTurnstileToken(request);
  if (!token) {
    throw new Error('Turnstile token required');
  }

  // Verify token
  const result = await verifyTurnstileToken(token, finalConfig);
  if (!result.success) {
    throw new Error(result.error ?? 'Turnstile verification failed');
  }

  // Validate action if specified
  if (expectedAction && result.action && result.action !== expectedAction) {
    throw new Error(`Invalid Turnstile action: expected ${expectedAction}, got ${result.action}`);
  }
}

/**
 * Extract Turnstile token from request
 */
function extractTurnstileToken(request: Request): string | null {
  // Try to get from request body first
  if (request.headers.get('content-type')?.includes('application/json')) {
    // Note: This is a simplified approach. In practice, you'd need to parse the body
    // For now, we'll rely on the client to send it in headers
  }

  // Try to get from headers
  const headerToken = request.headers.get('x-turnstile-token');
  if (headerToken) {
    return headerToken;
  }

  // Try to get from form data (for form submissions)
  const formToken = request.headers.get('cf-turnstile-response');
  if (formToken) {
    return formToken;
  }

  return null;
}

/**
 * Generate Turnstile widget configuration for client-side
 */
export function getTurnstileWidgetConfig(action?: string): {
  sitekey: string;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  tabindex?: number;
} {
  return withOptional(
    {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
      theme: 'auto' as const,
      size: 'normal' as const,
    },
    { action }
  );
}

/**
 * Check if Turnstile is enabled and configured
 */
export function isTurnstileEnabled(): boolean {
  return DEFAULT_TURNSTILE_CONFIG.enabled && !!DEFAULT_TURNSTILE_CONFIG.secretKey;
}

/**
 * Get Turnstile site key for client-side
 */
export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
}

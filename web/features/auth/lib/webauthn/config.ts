import type { NextRequest } from 'next/server';

/**
 * WebAuthn Configuration
 *
 * Privacy-first configuration for WebAuthn implementation
 */

// RP_ID should match the actual production domain (without protocol and www subdomain)
// For www.choices-app.com, use 'choices-app.com' (RP ID should be the registrable domain)
export const RP_ID = process.env.RP_ID ?? 'choices-app.com';
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'https://www.choices-app.com,https://choices-app.com,http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const challengeTtlSeconds = Number(process.env.WEBAUTHN_CHALLENGE_TTL_SECONDS ?? '300');
export const CHALLENGE_TTL_MS = (isNaN(challengeTtlSeconds) ? 300 : challengeTtlSeconds) * 1000;

/**
 * Get RP ID and origins with environment awareness
 */
export function getRPIDAndOrigins(req: NextRequest) {
  // Production + local dev only
  let rpID = RP_ID;
  const allowedOrigins = ALLOWED_ORIGINS;

  // Block previews: if host !== rpID and not localhost, disable passkeys
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
  const isLocal = host.startsWith('localhost:') || host === 'localhost';
  const is127 = host.startsWith('127.0.0.1:') || host === '127.0.0.1';

  // RP ID is the registrable domain (e.g., 'choices-app.com'), but host might be 'www.choices-app.com'
  // So we need to check if host matches rpID or is a subdomain of rpID (like www.rpID)
  const hostWithoutWww = host.startsWith('www.') ? host.substring(4) : host;
  const isProdHost = hostWithoutWww === rpID || host === rpID;
  const isPreview = isVercelPreview(host) && !isProdHost;

  // Ensure local development uses the correct rpID (WebAuthn allows localhost or 127.0.0.1 for non-HTTPS)
  if (isLocal) {
    rpID = 'localhost';
  } else if (is127) {
    rpID = '127.0.0.1';
  }

  // Disable passkeys on previews, but allow on production domain, localhost, and 127.0.0.1
  const enabled = (isProdHost || isLocal || is127) && !isPreview;

  return { enabled, rpID, allowedOrigins };
}

/**
 * Check if hostname is a Vercel preview URL
 */
export function isVercelPreview(hostname: string): boolean {
  return (
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.vercel.live') ||
    hostname.includes('vercel-preview')
  );
}

/**
 * Derive request origin for WebAuthn verify (scheme + host + port).
 * Use Origin when present; else parse Referer via new URL(referer).origin.
 * Use '' when neither is available (allowed-origins check is skipped; SimpleWebAuthn still validates inside clientDataJSON).
 */
export function normalizeRequestOrigin(req: NextRequest): string {
  const origin = req.headers.get('origin')?.trim();
  if (origin) return origin.replace(/\/$/, '');
  const referer = req.headers.get('referer')?.trim();
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return '';
    }
  }
  return '';
}

/**
 * WebAuthn error message mapping
 */
export const errorMessages = {
  'NotAllowedError': 'Cancelled—try again when you\'re ready.',
  'NotSupportedError': 'This device doesn\'t support passkeys. Try email link instead.',
  'SecurityError': 'Security check failed. Please try again.',
  'UnknownError': 'Something went wrong. Please try again or use email link.'
} as const;

/**
 * Progressive copy for different domains
 */
export const copyConfig = {
  enabled: {
    passkeyButton: 'Use Passkey (fast, no password)',
    emptyState: 'No passkeys yet. Add one from this device—biometrics stay on your device.'
  },
  preview: {
    emailButton: 'Email Link (secure login)',
    message: 'Passkeys disabled on preview deployments'
  }
} as const;

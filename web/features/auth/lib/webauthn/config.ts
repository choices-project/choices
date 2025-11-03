import type { NextRequest } from 'next/server';

/**
 * WebAuthn Configuration
 * 
 * Privacy-first configuration for WebAuthn implementation
 */

export const RP_ID = process.env.RP_ID ?? 'choices-platform.vercel.app';
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'https://choices-platform.vercel.app,http://localhost:3000')
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
  const rpID = RP_ID;
  const allowedOrigins = ALLOWED_ORIGINS;

  // Block previews: if host !== rpID and not localhost, disable passkeys
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
  const isLocal = host.startsWith('localhost:') || host === 'localhost';
  const isProdHost = host === rpID;
  const isPreview = isVercelPreview(host) && !isProdHost;
  
  // Disable passkeys on previews
  const enabled = (isProdHost || isLocal) && !isPreview;

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

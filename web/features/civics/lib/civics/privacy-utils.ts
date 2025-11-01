/**
 * Privacy utilities for civics address lookup system
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 */

import crypto from 'crypto';

import { cookies } from 'next/headers';

import { isFeatureEnabled } from '@/lib/core/feature-flags';

import { assertPepperConfig } from './env-guard';

type Scope = 'addr' | 'place' | 'ip';
type EncodedPepper = { raw: Buffer; source: 'DEV' | 'CURRENT' | 'PREVIOUS' }

function decodePepper(v: string): Buffer {
  const s = v.trim();
  if (s.startsWith('base64:')) return Buffer.from(s.slice(7), 'base64');
  if (s.startsWith('hex:')) return Buffer.from(s.slice(4), 'hex');
  return Buffer.from(s, 'utf8');
}

function loadPeppers(): EncodedPepper[] {
  const env = process.env.NODE_ENV;
  const isDev = env === 'development' || env === 'test';

  if (isDev) {
    const dv = process.env.PRIVACY_PEPPER_DEV;
    if (!dv) throw new Error('PRIVACY_PEPPER_DEV required in development/test');
    return [{ raw: decodePepper(dv), source: 'DEV' }];
  }
  if (!process.env.PRIVACY_PEPPER_CURRENT) throw new Error('PRIVACY_PEPPER_CURRENT required');
  const peppers: EncodedPepper[] = [
    { raw: decodePepper(process.env.PRIVACY_PEPPER_CURRENT), source: 'CURRENT' },
  ];
  if (process.env.PRIVACY_PEPPER_PREVIOUS) {
    peppers.push({ raw: decodePepper(process.env.PRIVACY_PEPPER_PREVIOUS), source: 'PREVIOUS' });
  }
  peppers.forEach(p => {
    if (p.source !== 'DEV' && p.raw.length < 32) {
      throw new Error(`${p.source} pepper must be ≥32 bytes`);
    }
  });
  return peppers;
}

// Lazy-load peppers to avoid crashes during test imports
let PEPPERS: EncodedPepper[] | null = null;

function getPeppers(): EncodedPepper[] {
  if (PEPPERS === null) {
    assertPepperConfig();
    PEPPERS = loadPeppers();
  }
  return PEPPERS;
}

function hmacRaw(data: string, scope: Scope, pepper: Buffer): Buffer {
  const h = crypto.createHmac('sha256', Buffer.concat([pepper, Buffer.from(`:${scope}`)]));
  h.update(data);
  return h.digest();
}

export function hmac256(data: string, scope: Scope): { hex: string; used: EncodedPepper['source'] } {
  // Issue with CURRENT (or DEV)
  const peppers = getPeppers();
  const first = peppers[0];
  if (!first) throw new Error('No peppers configured');
  const digest = hmacRaw(data, scope, first.raw).toString('hex');
  return { hex: digest, used: first.source };
}

export function verifyHmacDigest(plain: string, scope: Scope, presentedHex: string): boolean {
  const presented = Buffer.from(presentedHex, 'hex');
  const peppers = getPeppers();
  for (const p of peppers) {
    const cand = hmacRaw(plain, scope, p.raw);
    if (presented.length === cand.length && crypto.timingSafeEqual(presented, cand)) {
      return true;
    }
  }
  return false;
}

export const normalizeAddress = (a: string) =>
  a.trim().toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(street|st|road|rd|avenue|ave|boulevard|blvd)\b/g, m =>
      ({ street: 'st', st: 'st', road: 'rd', rd: 'rd', avenue: 'ave', ave: 'ave', boulevard: 'blvd', blvd: 'blvd' } as any)[m]
    );

export const generateAddressHMAC = (address: string) => hmac256(normalizeAddress(address), 'addr').hex;
export const generatePlaceIdHMAC = (placeId: string) => hmac256(placeId, 'place').hex;
export const generateIPHMAC = (ip: string) => hmac256(ip, 'ip').hex;

// --- Geoprivacy helpers ---
function simpleGeohash(lat: number, lng: number, precision: 5 | 6 | 7): string {
  // Production-ready geohash implementation
  // Uses proper geohash algorithm for privacy-preserving location hashing
  const latRange = [-90, 90];
  const lngRange = [-180, 180];
  
  let latMin: number = latRange[0] ?? -90;
  let latMax: number = latRange[1] ?? 90;
  let lngMin: number = lngRange[0] ?? -180;
  let lngMax: number = lngRange[1] ?? 180;
  
  let bits = 0;
  let bit = 0;
  let ch = 0;
  let even = true;
  
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let result = '';
  
  while (bits < precision * 5) {
    if (even) {
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) {
        ch |= (1 << (4 - bit));
        lngMin = lngMid;
      } else {
        lngMax = lngMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        ch |= (1 << (4 - bit));
        latMin = latMid;
      } else {
        latMax = latMid;
      }
    }
    
    even = !even;
    if (bit < 4) {
      bit++;
    } else {
      result += base32[ch];
      bits++;
      bit = 0;
      ch = 0;
    }
  }
  
  return result;
}

export function geohashWithJitter(
  lat: number, 
  lng: number, 
  precision: 5 | 6 | 7,
  requestId: string
): string {
  const seed = crypto.createHash('sha256').update(requestId).digest();
  const j = ((seed[0] || 0) - 128) / 12800; // ≈ ±1% deterministic jitter per request
  return simpleGeohash(lat + j, lng + j, precision);
}

export const bucketIsKAnonymous = (bucketCount: number, k = 25) => bucketCount >= k;

// --- Cookie helpers for jurisdiction scoping ---
const COOKIE_NAME = 'cx_jurisdictions';

export async function setJurisdictionCookie(payload: { state?: string; district?: string; county?: string }) {
  // Minimal sealed cookie using a signed value. Replace with iron-session/jose if you prefer AEAD.
  const secret = process.env.SESSION_SECRET ?? 'dev-session-secret-not-for-prod';
  const body = JSON.stringify(Object.assign({}, payload, { v: 1, iat: Date.now() }));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const value = Buffer.from(JSON.stringify({ body, sig })).toString('base64url');

  (await cookies()).set({
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function readJurisdictionCookie(): Promise<{ state?: string; district?: string; county?: string } | null> {
  const secret = process.env.SESSION_SECRET ?? 'dev-session-secret-not-for-prod';
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const { body, sig } = JSON.parse(Buffer.from(raw, 'base64url').toString());
    const check = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(check))) return null;
    const parsed = JSON.parse(body);
    return { state: parsed.state, district: parsed.district, county: parsed.county };
  } catch {
    return null;
  }
}

/**
 * Validate address input for DoS protection
 */
export function validateAddressInput(address: string): { valid: boolean; error?: string } {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return { valid: false, error: 'Feature disabled' };
  }
  
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required' };
  }
  
  if (address.length > 500) {
    return { valid: false, error: 'Address too long' };
  }
  
  if (address.length < 5) {
    return { valid: false, error: 'Address too short' };
  }
  
  // Basic character validation (allow letters, numbers, spaces, common punctuation)
  if (!/^[a-zA-Z0-9\s\.,\-#]+$/.test(address)) {
    return { valid: false, error: 'Invalid characters in address' };
  }
  
  return { valid: true };
}

/**
 * Check if civics feature is enabled
 */
export function isCivicsEnabled(): boolean {
  return isFeatureEnabled('CIVICS_ADDRESS_LOOKUP');
}

/**
 * Privacy-safe request ID generator
 */
export function generateRequestId(): string {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    throw new Error('Civics address lookup feature is disabled');
  }
  
  return crypto.randomUUID();
}

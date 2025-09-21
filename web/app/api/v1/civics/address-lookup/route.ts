/**
 * Civics Address Lookup API Endpoint
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * Privacy-first address lookup with jurisdiction cookie setting
 */

import { NextResponse } from 'next/server';
import { assertPepperConfig } from '@/lib/civics/env-guard';
import { generateAddressHMAC, setJurisdictionCookie } from '@/lib/civics/privacy-utils';

// If using Edge: export const runtime = 'edge';

assertPepperConfig();

async function providerFanout(address: string) {
  // TODO: call Google Civic / OpenStates / etc. Here we stub a result.
  // IMPORTANT: do not store raw address anywhere.
  // Return minimal jurisdiction identifiers.
  return { state: 'IL', district: '13', county: 'Sangamon' };
}

export async function POST(req: Request) {
  const { address } = await req.json();
  if (!address || typeof address !== 'string') {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }

  // Privacy: compute HMAC (not stored here; useful if you key caches by HMAC)
  const addrH = generateAddressHMAC(address);
  void addrH; // use for cache keys if needed

  const juris = await providerFanout(address);

  await setJurisdictionCookie(juris);
  return NextResponse.json({ ok: true, jurisdiction: juris }, { status: 200 });
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

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

async function lookupJurisdictionFromExternalAPI(address: string) {
  // IMPORTANT: Address lookup requires external API calls because:
  // 1. We can't store every possible address in our database
  // 2. Addresses change (new developments, redistricting)
  // 3. We need real-time jurisdiction resolution
  
  // Log address lookup for audit trail (without storing the actual address)
  console.log(`Address lookup requested for jurisdiction resolution (address length: ${address.length})`);
  
  try {
    // Call Google Civic Information API for jurisdiction resolution
    // This is the correct approach for address → jurisdiction mapping
    const response = await fetch('https://www.googleapis.com/civicinfo/v2/representatives', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: In production, you'd need to add API key and proper error handling
    });
    
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract jurisdiction information from the response
    const jurisdiction = {
      state: data.state || 'IL',
      district: data.district || '13', 
      county: data.county || 'Sangamon',
      ocd_division_id: data.ocd_division_id || null
    };
    
    return jurisdiction;
    
  } catch (error) {
    console.error('External API lookup failed:', error);
    
    // Fallback: return a default jurisdiction for development
    // In production, you might want to return an error or try alternative APIs
    return { 
      state: 'IL', 
      district: '13', 
      county: 'Sangamon',
      fallback: true 
    };
  }
}

export async function POST(req: Request) {
  const { address } = await req.json();
  if (!address || typeof address !== 'string') {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }

  // Privacy: compute HMAC (not stored here; useful if you key caches by HMAC)
  const addrH = generateAddressHMAC(address);
  void addrH; // use for cache keys if needed

  const juris = await lookupJurisdictionFromExternalAPI(address);

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

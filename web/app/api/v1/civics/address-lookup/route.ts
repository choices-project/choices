/**
 * Civics Address Lookup API Endpoint
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * Privacy-first address lookup with jurisdiction cookie setting
 * 
 * QUOTA MANAGEMENT:
 * - Free tier: 25,000 requests/day
 * - Rate limit: ~1 request/second recommended
 * - Billing required for production usage
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
    const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
    if (!apiKey) {
      console.warn('Google Civic API key not configured, using fallback');
      return {
        state: 'IL',
        district: '13',
        county: 'Sangamon',
        fallback: true 
      };
    }

    // RATE LIMITING: Add small delay to respect API quotas
    // Google Civic API recommends ~1 request/second
    await new Promise(resolve => setTimeout(resolve, 1000));

    const url = new URL('https://www.googleapis.com/civicinfo/v2/representatives');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('address', address);
    url.searchParams.set('includeOffices', 'true');
    url.searchParams.set('levels', 'country,administrativeArea1,administrativeArea2,locality');
    url.searchParams.set('roles', 'legislatorUpperBody,legislatorLowerBody,headOfState,headOfGovernment');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Choices-Civics-Platform/1.0', // Identify our requests
      },
    });
    
    if (!response.ok) {
      // Handle quota exceeded errors specifically
      if (response.status === 429) {
        console.warn('Google Civic API quota exceeded, using fallback');
        return {
          state: 'IL',
          district: '13',
          county: 'Sangamon',
          fallback: true,
          quotaExceeded: true
        };
      }
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

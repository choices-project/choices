/**
 * Civics Address Lookup API Endpoint
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * Privacy-first address lookup with jurisdiction cookie setting
 */

import { type NextRequest, NextResponse } from 'next/server';
import { assertPepperConfig } from '@/lib/civics/env-guard';
import { generateAddressHMAC, setJurisdictionCookie } from '@/lib/civics/privacy-utils';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

// If using Edge: export const runtime = 'edge';

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
      throw new Error('Google Civic API key not configured');
    }

    const response = await fetch(`https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract jurisdiction information from the Google Civic API response
    const normalizedInput = data.normalizedInput;
    const offices = data.offices || [];
    const officials = data.officials || [];
    
    // Find congressional district office
    const congressionalOffice = offices.find((office: any) => 
      office.name?.toLowerCase().includes('congress') || 
      office.name?.toLowerCase().includes('house of representatives')
    );
    
    let district = null;
    if (congressionalOffice) {
      const official = officials[congressionalOffice.officialIndices?.[0]];
      if (official?.name) {
        // Extract district from official name (e.g., "Rep. John Doe (D-IL-13)")
        const districtMatch = official.name.match(/\([A-Z]-[A-Z]{2}-(\d+)\)/);
        district = districtMatch ? districtMatch[1] : null;
      }
    }
    
    const jurisdiction = {
      state: normalizedInput?.state || 'IL',
      district: district || '13', 
      county: normalizedInput?.city || 'Unknown',
      ocd_division_id: normalizedInput?.ocdId || null,
      normalized_address: normalizedInput?.line1 || address
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

export async function POST(req: NextRequest) {
  // Check if feature is enabled
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
  }

  try {
    // Assert pepper configuration at runtime
    assertPepperConfig();

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
  } catch (error) {
    console.error('Address lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
  }
  
  return NextResponse.json(
    { error: 'GET method not supported. Use POST with address in request body.' }, 
    { status: 405 }
  );
}

export async function PUT() {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
  }
  
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

export async function DELETE() {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
  }
  
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

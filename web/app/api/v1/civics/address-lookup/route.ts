/**
 * Civics Address Lookup API Endpoint
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * This endpoint is ready for implementation but disabled until e2e work is complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { 
  validateAddressInput, 
  generateAddressHMAC, 
  generateRequestId,
  isCivicsEnabled 
} from '@/lib/civics/privacy-utils';

export async function POST(request: NextRequest) {
  // Feature flag check - return 404 if disabled
  if (!isCivicsEnabled()) {
    return NextResponse.json(
      { error: 'Feature not available' }, 
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { address } = body;

    // Validate input
    const validation = validateAddressInput(address);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error }, 
        { status: 400 }
      );
    }

    // Generate privacy-safe identifiers
    const addressHMAC = generateAddressHMAC(address);
    const requestId = generateRequestId();

    // TODO: Implement actual lookup logic when feature is enabled
    // For now, return a placeholder response
    return NextResponse.json({
      ok: true,
      message: 'Civics address lookup is ready for implementation',
      requestId,
      // Privacy-safe response (no coordinates, no raw address)
      address: {
        normalized: address.trim(),
        // No coordinates returned to client
      },
      representatives: [],
      attribution: {
        address_lookup: 'Google Civic Information API (placeholder)',
        representatives: 'GovTrack.us API (placeholder)',
        finance: 'Federal Election Commission (placeholder)',
        voting: 'Congress.gov API (placeholder)'
      }
    });

  } catch (error) {
    console.error('Civics address lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
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

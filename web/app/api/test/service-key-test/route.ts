/**
 * Service Key Test API
 * 
 * This endpoint tests the service key authentication
 */

import { type NextRequest, NextResponse } from 'next/server';
import { requireServiceKey } from '@/lib/service-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔑 Testing service key authentication...');
    
    // Test service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) {
      return serviceCheck;
    }
    
    return NextResponse.json({
      ok: true,
      message: 'Service key authentication successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Service key test failed:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Service key test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


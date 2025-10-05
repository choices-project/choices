import { NextRequest, NextResponse } from 'next/server';
import { requireServiceKey, isServiceKeyValid } from '@/lib/service-auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    console.log('Testing service key validation...');
    
    // Test the service key validation
    const isValid = await isServiceKeyValid();
    console.log('Service key valid:', isValid);
    
    // Test the requireServiceKey function
    const authError = await requireServiceKey();
    console.log('Auth error:', authError);
    
    return NextResponse.json({
      success: true,
      serviceKeyValid: isValid,
      authError: authError ? 'Service key validation failed' : null,
      environment: {
        hasSecretKey: !!process.env.SUPABASE_SECRET_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    });
    
  } catch (error) {
    console.error('Service key test failed:', error);
    return NextResponse.json({
      success: false,
      error: `Service key test failed: ${error}`,
      environment: {
        hasSecretKey: !!process.env.SUPABASE_SECRET_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    }, { status: 500 });
  }
}

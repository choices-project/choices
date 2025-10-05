import { NextRequest, NextResponse } from 'next/server';
import { requireServiceKey } from '@/lib/service-auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    console.log('=== Service Key Detailed Test ===');
    console.log('Environment variables:');
    console.log('- SUPABASE_SECRET_KEY:', !!process.env.SUPABASE_SECRET_KEY);
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    console.log('Calling requireServiceKey...');
    const result = await requireServiceKey();
    console.log('requireServiceKey result:', result);
    
    if (result) {
      console.log('Service key validation failed');
      console.log('Error response:', result);
      return result;
    } else {
      console.log('Service key validation passed');
      return NextResponse.json({
        success: true,
        message: 'Service key validation passed',
        result: result
      });
    }
    
  } catch (error) {
    console.error('Service key detailed test failed:', error);
    return NextResponse.json({
      success: false,
      error: `Service key detailed test failed: ${error}`,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

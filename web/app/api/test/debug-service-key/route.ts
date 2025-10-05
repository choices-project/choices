import { NextRequest, NextResponse } from 'next/server';
import { requireServiceKey } from '@/lib/service-auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    console.log('Testing requireServiceKey function...');
    
    // Test the requireServiceKey function
    const result = await requireServiceKey();
    console.log('requireServiceKey result:', result);
    
    if (result) {
      console.log('Service key validation failed, returning error response');
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
    console.error('Service key debug failed:', error);
    return NextResponse.json({
      success: false,
      error: `Service key debug failed: ${error}`
    }, { status: 500 });
  }
}

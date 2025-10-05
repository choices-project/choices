import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database query with service key...');
    
    // Test the same query that service key validation uses
    const { data, error } = await supabase
      .from('representatives_core')
      .select('id')
      .limit(1);
    
    console.log('Database query result:', { data, error });
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: `Database query failed: ${error.message}`,
        details: error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database query successful',
      data: data,
      error: error
    });
    
  } catch (error) {
    console.error('Database query test failed:', error);
    return NextResponse.json({
      success: false,
      error: `Database query test failed: ${error}`,
      environment: {
        hasSecretKey: !!process.env.SUPABASE_SECRET_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    }, { status: 500 });
  }
}

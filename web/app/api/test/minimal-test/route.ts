/**
 * Minimal Test
 * 
 * Test basic functionality without complex pipeline
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

export const dynamic = 'force-dynamic';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET() {
  try {
    console.log('🧪 Running minimal test...');

    // Test 1: Basic Supabase connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } }
    );

    console.log('✅ Supabase client created');

    // Test 2: Simple database query
    const { data, error } = await supabase
      .from('representatives_core')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Database query successful');

    // Test 3: Simple API call (OpenStates)
    const openStatesResponse = await fetch(
      `https://openstates.org/api/v1/legislators/?state=ca&apikey=${process.env.OPEN_STATES_API_KEY}`,
      { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!openStatesResponse.ok) {
      throw new Error(`OpenStates API error: ${openStatesResponse.status}`);
    }

    const openStatesData = await openStatesResponse.json();
    console.log('✅ OpenStates API call successful');

    return NextResponse.json({
      success: true,
      message: 'Minimal test completed successfully',
      results: {
        database: 'Connected',
        openStates: `Found ${openStatesData.length} legislators`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Minimal test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Minimal test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

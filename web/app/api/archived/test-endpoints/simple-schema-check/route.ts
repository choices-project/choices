/**
 * Simple Database Schema Check
 * 
 * Quick check to see what tables exist
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

export const dynamic = 'force-dynamic';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  try {
    console.log('🔍 Quick schema check...');

    // Try to get a simple count from representatives_core
    const { data: repData, error: repError } = await supabase
      .from('representatives_core')
      .select('id, name, state')
      .limit(1);

    // Try to get a simple count from id_crosswalk
    const { data: crosswalkData, error: crosswalkError } = await supabase
      .from('id_crosswalk')
      .select('canonical_id, source')
      .limit(1);

    return NextResponse.json({
      success: true,
      tables: {
        representatives_core: {
          exists: !repError,
          error: repError?.message,
          sampleData: repData
        },
        id_crosswalk: {
          exists: !crosswalkError,
          error: crosswalkError?.message,
          sampleData: crosswalkData
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Schema check failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Schema check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

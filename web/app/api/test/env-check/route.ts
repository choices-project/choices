/**
 * Environment Variables Check
 * 
 * Simple check to see what environment variables are available
 */

import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

export const dynamic = 'force-dynamic';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET() {
  try {
    console.log('🔍 Checking environment variables...');

    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SECRET_KEY,
      openStates: !!process.env.OPEN_STATES_API_KEY,
      googleCivic: !!process.env.GOOGLE_CIVIC_API_KEY,
      congressGov: !!process.env.CONGRESS_GOV_API_KEY,
      fec: !!process.env.FEC_API_KEY,
      // Don't expose actual values, just check if they exist
      supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
      supabaseKeyValue: process.env.SUPABASE_SECRET_KEY ? 'SET' : 'NOT_SET',
      openStatesValue: process.env.OPEN_STATES_API_KEY ? 'SET' : 'NOT_SET',
      googleCivicValue: process.env.GOOGLE_CIVIC_API_KEY ? 'SET' : 'NOT_SET',
      congressGovValue: process.env.CONGRESS_GOV_API_KEY ? 'SET' : 'NOT_SET',
      fecValue: process.env.FEC_API_KEY ? 'SET' : 'NOT_SET'
    };

    console.log('Environment check result:', envCheck);

    return NextResponse.json({
      success: true,
      message: 'Environment variables checked',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Environment check failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Environment check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

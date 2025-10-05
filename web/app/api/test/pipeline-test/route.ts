/**
 * Simple Pipeline Test
 * 
 * Test if the basic pipeline methods work without hanging
 */

import { NextResponse } from 'next/server';
import { FreeAPIsPipeline } from '../../../../lib/civics-2-0/free-apis-pipeline';
import dotenv from 'dotenv';

export const dynamic = 'force-dynamic';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET() {
  try {
    console.log('🧪 Testing pipeline initialization...');

    // Test 1: Initialize pipeline
    const pipeline = new FreeAPIsPipeline();
    console.log('✅ Pipeline initialized');

    // Test 2: Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SECRET_KEY,
      openStates: !!process.env.OPEN_STATES_API_KEY,
      googleCivic: !!process.env.GOOGLE_CIVIC_API_KEY,
      congressGov: !!process.env.CONGRESS_GOV_API_KEY,
      fec: !!process.env.FEC_API_KEY
    };

    console.log('🔍 Environment check:', envCheck);

    // Test 3: Simple representative data
    const testRep = {
      name: 'Test Representative',
      office: 'State Senator',
      level: 'state' as const,
      state: 'CA',
      district: '1',
      contacts: [],
      socialMedia: [],
      photos: [],
      activity: [],
      dataSources: ['test'],
      qualityScore: 0,
      lastUpdated: new Date()
    };

    console.log('🧪 Testing pipeline with simple data...');

    // Test 4: Try to process (with timeout)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Pipeline test timeout')), 10000)
    );

    const processPromise = pipeline.processRepresentative(testRep);

    try {
      const result = await Promise.race([processPromise, timeoutPromise]);
      console.log('✅ Pipeline processing completed');
      
      return NextResponse.json({
        success: true,
        message: 'Pipeline test completed successfully',
        environment: envCheck,
        result: {
          name: result.name,
          dataSources: result.dataSources,
          qualityScore: result.qualityScore
        }
      });
    } catch (error) {
      console.log('❌ Pipeline test failed:', error);
      
      return NextResponse.json({
        success: false,
        message: 'Pipeline test failed',
        environment: envCheck,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Pipeline test setup failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Pipeline test setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

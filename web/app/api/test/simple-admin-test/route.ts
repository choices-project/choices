import { NextRequest, NextResponse } from 'next/server';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    console.log('Simple admin test - no service key authentication');
    
    const pipeline = new FreeAPIsPipeline();
    
    // Test with a simple representative
    const testRep = {
      name: 'Test Representative',
      state: 'California',
      office: 'State Representative',
      level: 'state',
      district: '1',
      bioguideId: undefined,
      openstatesId: 'test-id',
      fecId: undefined,
      googleCivicId: undefined,
      contacts: [],
      socialMedia: [],
      photos: [],
      activity: [],
      campaignFinance: undefined,
      dataSources: [],
      qualityScore: 0,
      lastUpdated: new Date()
    };
    
    console.log('Processing test representative...');
    const enrichedRep = await pipeline.processRepresentative(testRep);
    
    if (enrichedRep) {
      console.log('Successfully processed representative');
      return NextResponse.json({
        success: true,
        message: 'Simple admin test completed',
        representative: {
          name: enrichedRep.name,
          state: enrichedRep.state,
          dataSources: enrichedRep.dataSources,
          qualityScore: enrichedRep.qualityScore
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to process representative'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Simple admin test failed:', error);
    return NextResponse.json({
      success: false,
      error: `Simple admin test failed: ${error}`
    }, { status: 500 });
  }
}

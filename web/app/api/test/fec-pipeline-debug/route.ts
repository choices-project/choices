import { NextRequest, NextResponse } from 'next/server';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    const pipeline = new FreeAPIsPipeline();
    
    // Test with a real federal candidate
    const testRep = {
      id: 'test-fec-pipeline',
      name: 'Joe Biden',
      party: 'Democratic',
      office: 'President',
      level: 'federal' as const,
      state: 'US',
      district: '00',
      contacts: [],
      socialMedia: [],
      photos: [],
      activity: [],
      dataSources: ['test'],
      qualityScore: 0,
      lastUpdated: new Date()
    };

    console.log('🧪 Testing FEC pipeline with debugging...');
    
    // Test the full pipeline to see what happens
    const enrichedRep = await pipeline.processRepresentative(testRep);
    
    return NextResponse.json({
      status: 'success',
      pipeline: {
        hasData: Object.keys(enrichedRep).length > 0,
        campaignFinance: enrichedRep.campaignFinance,
        dataSources: enrichedRep.dataSources,
        enhanced: {
          primaryEmail: enrichedRep.primaryEmail,
          primaryPhone: enrichedRep.primaryPhone,
          accountabilityScore: enrichedRep.accountabilityScore,
          qualityScore: enrichedRep.qualityScore
        },
        counts: {
          contacts: enrichedRep.contacts?.length || 0,
          socialMedia: enrichedRep.socialMedia?.length || 0,
          photos: enrichedRep.photos?.length || 0,
          activity: enrichedRep.activity?.length || 0
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `FEC pipeline debug failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}

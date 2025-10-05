import { NextRequest, NextResponse } from 'next/server';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    const pipeline = new FreeAPIsPipeline();
    
    // Test with a real representative
    const testRep = {
      id: 'test-comprehensive',
      name: 'Test Representative',
      party: 'Democratic',
      office: 'Assembly',
      level: 'state' as const,
      state: 'California',
      district: '1',
      contacts: [],
      socialMedia: [],
      photos: [],
      activity: [],
      dataSources: ['test'],
      qualityScore: 0,
      lastUpdated: new Date()
    };

    console.log('🧪 Testing all APIs comprehensively...');
    
    // Test each API individually
    const results = {
      googleCivic: await pipeline.getGoogleCivicElectionData(testRep),
      openStates: await pipeline.getOpenStatesData(testRep),
      congressGov: await pipeline.getCongressGovData(testRep),
      legiScan: await pipeline.getLegiScanData(testRep),
      fec: await pipeline.getFECData(testRep),
      photos: await pipeline.getPhotosFromMultipleSources(testRep),
      socialMedia: await pipeline.getSocialMediaData(testRep),
      activity: await pipeline.getRecentActivity(testRep)
    };
    
    // Test the full pipeline
    const fullPipeline = await pipeline.processRepresentative(testRep);
    
    return NextResponse.json({
      status: 'success',
      individualAPIs: {
        googleCivic: {
          hasData: Object.keys(results.googleCivic).length > 0,
          fields: Object.keys(results.googleCivic),
          sample: results.googleCivic
        },
        openStates: {
          hasData: Object.keys(results.openStates).length > 0,
          fields: Object.keys(results.openStates),
          sample: results.openStates
        },
        congressGov: {
          hasData: Object.keys(results.congressGov).length > 0,
          fields: Object.keys(results.congressGov),
          sample: results.congressGov
        },
        legiScan: {
          hasData: Object.keys(results.legiScan).length > 0,
          fields: Object.keys(results.legiScan),
          sample: results.legiScan
        },
        fec: {
          hasData: results.fec !== undefined,
          type: typeof results.fec,
          sample: results.fec
        },
        photos: {
          count: results.photos.length,
          sample: results.photos.slice(0, 2)
        },
        socialMedia: {
          count: results.socialMedia.length,
          sample: results.socialMedia.slice(0, 2)
        },
        activity: {
          count: results.activity.length,
          sample: results.activity.slice(0, 2)
        }
      },
      fullPipeline: {
        hasData: Object.keys(fullPipeline).length > 0,
        fields: Object.keys(fullPipeline),
        enhanced: {
          primaryEmail: fullPipeline.primaryEmail,
          primaryPhone: fullPipeline.primaryPhone,
          primaryWebsite: fullPipeline.primaryWebsite,
          primaryPhotoUrl: fullPipeline.primaryPhotoUrl,
          twitterHandle: fullPipeline.twitterHandle,
          facebookUrl: fullPipeline.facebookUrl,
          accountabilityScore: fullPipeline.accountabilityScore,
          dataSources: fullPipeline.dataSources,
          qualityScore: fullPipeline.qualityScore
        },
        counts: {
          contacts: fullPipeline.contacts?.length || 0,
          socialMedia: fullPipeline.socialMedia?.length || 0,
          photos: fullPipeline.photos?.length || 0,
          activity: fullPipeline.activity?.length || 0
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `Comprehensive API test failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}

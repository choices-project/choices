import { NextRequest, NextResponse } from 'next/server';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    const pipeline = new FreeAPIsPipeline();
    
    // Test with a sample representative
    const testRep = {
      id: 'test-1',
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

    console.log('🧪 Testing pipeline with sample data...');
    
    // Test individual API calls
    const openStatesData = await pipeline.getOpenStatesData(testRep);
    const congressGovData = await pipeline.getCongressGovData(testRep);
    const legiScanData = await pipeline.getLegiScanData(testRep);
    const photos = await pipeline.getPhotosFromMultipleSources(testRep);
    const socialMedia = await pipeline.getSocialMediaData(testRep);
    const activity = await pipeline.getRecentActivity(testRep);
    
    return NextResponse.json({
      status: 'success',
      testResults: {
        openStatesData: Object.keys(openStatesData),
        congressGovData: Object.keys(congressGovData),
        legiScanData: Object.keys(legiScanData),
        photos: photos.length,
        socialMedia: socialMedia.length,
        activity: activity.length,
        sampleData: {
          openStates: openStatesData,
          congressGov: congressGovData,
          legiScan: legiScanData,
          photos: photos.slice(0, 2),
          socialMedia: socialMedia.slice(0, 2),
          activity: activity.slice(0, 2)
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `Pipeline debug failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}

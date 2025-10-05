import { NextRequest, NextResponse } from 'next/server';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    const pipeline = new FreeAPIsPipeline();
    
    // Test with a real active federal candidate
    const testRep = {
      id: 'test-fec-active',
      name: 'John Anthony Castro', // Real active federal candidate
      party: 'Republican',
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

    console.log('🧪 Testing FEC with active federal candidate (Castro)...');
    
    // Test FEC data specifically
    const fecData = await pipeline.getFECData(testRep);
    
    return NextResponse.json({
      status: 'success',
      fecData: {
        hasData: fecData !== undefined,
        data: fecData,
        summary: fecData ? {
          electionCycle: fecData.electionCycle,
          totalReceipts: fecData.totalReceipts,
          totalDisbursements: fecData.totalDisbursements,
          cashOnHand: fecData.cashOnHand,
          individualContributions: fecData.individualContributions,
          pacContributions: fecData.pacContributions
        } : null
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `FEC active candidate test failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}

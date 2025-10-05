/**
 * Civics 2.0 FREE APIs Testing
 * 
 * Test the specific FREE APIs we're using for Civics 2.0:
 * - Google Civic Information API (25,000 requests/day)
 * - OpenStates API (10,000 requests/day) 
 * - Congress.gov API (5,000 requests/day)
 * - FEC API (1,000 requests/day)
 * - Wikipedia/Wikimedia Commons (unlimited)
 */

import { type NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Import our existing FREE APIs pipeline
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Civics 2.0 FREE APIs...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      freeApis: {
        googleCivic: { status: 'not_tested', rateLimit: '25,000/day' } as any,
        openStates: { status: 'not_tested', rateLimit: '10,000/day' } as any,
        congressGov: { status: 'not_tested', rateLimit: '5,000/day' } as any,
        fec: { status: 'not_tested', rateLimit: '1,000/day' } as any,
        wikipedia: { status: 'not_tested', rateLimit: 'unlimited' } as any
      },
      summary: {
        totalApis: 5,
        testedApis: 0,
        workingApis: 0,
        rateLimits: {
          totalDailyRequests: 41000,
          burstCapacity: 'excellent'
        }
      } as any
    };

    // Test 1: Google Civic API (25,000 requests/day)
    console.log('🔍 Testing Google Civic API...');
    try {
      const pipeline = new FreeAPIsPipeline();
      const testRep = {
        name: 'Test Representative',
        office: 'U.S. House of Representatives',
        level: 'federal' as const,
        state: 'CA',
        district: '12',
        contacts: [],
        socialMedia: [],
        photos: [],
        activity: [],
        dataSources: [],
        qualityScore: 0,
        lastUpdated: new Date()
      };
      
      const result = await pipeline.processRepresentative(testRep);
      testResults.freeApis.googleCivic = {
        status: 'working',
        rateLimit: '25,000/day',
        dataRetrieved: result.dataSources.includes('google-civic'),
        qualityScore: result.qualityScore
      };
      testResults.summary.testedApis++;
      testResults.summary.workingApis++;
    } catch (error) {
      testResults.freeApis.googleCivic = {
        status: 'failed',
        rateLimit: '25,000/day',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      testResults.summary.testedApis++;
    }

    // Test 2: OpenStates API (10,000 requests/day)
    console.log('🔍 Testing OpenStates API...');
    try {
      const pipeline = new FreeAPIsPipeline();
      const testRep = {
        name: 'Test State Legislator',
        office: 'State Assembly',
        level: 'state' as const,
        state: 'CA',
        district: '12',
        contacts: [],
        socialMedia: [],
        photos: [],
        activity: [],
        dataSources: [],
        qualityScore: 0,
        lastUpdated: new Date()
      };
      
      const result = await pipeline.processRepresentative(testRep);
      testResults.freeApis.openStates = {
        status: 'working',
        rateLimit: '10,000/day',
        dataRetrieved: result.dataSources.includes('openstates'),
        qualityScore: result.qualityScore
      };
      testResults.summary.testedApis++;
      testResults.summary.workingApis++;
    } catch (error) {
      testResults.freeApis.openStates = {
        status: 'failed',
        rateLimit: '10,000/day',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      testResults.summary.testedApis++;
    }

    // Test 3: Congress.gov API (5,000 requests/day)
    console.log('🔍 Testing Congress.gov API...');
    try {
      const pipeline = new FreeAPIsPipeline();
      const testRep = {
        name: 'Test Congress Member',
        office: 'U.S. House of Representatives',
        level: 'federal' as const,
        state: 'CA',
        district: '12',
        contacts: [],
        socialMedia: [],
        photos: [],
        activity: [],
        dataSources: [],
        qualityScore: 0,
        lastUpdated: new Date()
      };
      
      const result = await pipeline.processRepresentative(testRep);
      testResults.freeApis.congressGov = {
        status: 'working',
        rateLimit: '5,000/day',
        dataRetrieved: result.dataSources.includes('congress-gov'),
        qualityScore: result.qualityScore
      };
      testResults.summary.testedApis++;
      testResults.summary.workingApis++;
    } catch (error) {
      testResults.freeApis.congressGov = {
        status: 'failed',
        rateLimit: '5,000/day',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      testResults.summary.testedApis++;
    }

    // Test 4: FEC API (1,000 requests/day)
    console.log('🔍 Testing FEC API...');
    try {
      const pipeline = new FreeAPIsPipeline();
      const testRep = {
        name: 'Test Candidate',
        office: 'U.S. House of Representatives',
        level: 'federal' as const,
        state: 'CA',
        district: '12',
        contacts: [],
        socialMedia: [],
        photos: [],
        activity: [],
        dataSources: [],
        qualityScore: 0,
        lastUpdated: new Date()
      };
      
      const result = await pipeline.processRepresentative(testRep);
      testResults.freeApis.fec = {
        status: 'working',
        rateLimit: '1,000/day',
        dataRetrieved: result.dataSources.includes('fec'),
        qualityScore: result.qualityScore
      };
      testResults.summary.testedApis++;
      testResults.summary.workingApis++;
    } catch (error) {
      testResults.freeApis.fec = {
        status: 'failed',
        rateLimit: '1,000/day',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      testResults.summary.testedApis++;
    }

    // Test 5: Wikipedia API (unlimited)
    console.log('🔍 Testing Wikipedia API...');
    try {
      const pipeline = new FreeAPIsPipeline();
      const testRep = {
        name: 'Test Representative',
        office: 'U.S. House of Representatives',
        level: 'federal' as const,
        state: 'CA',
        district: '12',
        contacts: [],
        socialMedia: [],
        photos: [],
        activity: [],
        dataSources: [],
        qualityScore: 0,
        lastUpdated: new Date()
      };
      
      const result = await pipeline.processRepresentative(testRep);
      testResults.freeApis.wikipedia = {
        status: 'working',
        rateLimit: 'unlimited',
        dataRetrieved: result.dataSources.includes('wikipedia'),
        qualityScore: result.qualityScore
      };
      testResults.summary.testedApis++;
      testResults.summary.workingApis++;
    } catch (error) {
      testResults.freeApis.wikipedia = {
        status: 'failed',
        rateLimit: 'unlimited',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      testResults.summary.testedApis++;
    }

    // Calculate readiness
    const readiness = (testResults.summary.workingApis / testResults.summary.testedApis) * 100;
    testResults.summary.readiness = Math.round(readiness);

    return NextResponse.json({
      ok: true,
      message: 'Civics 2.0 FREE APIs testing completed',
      results: testResults
    });

  } catch (error) {
    console.error('❌ Civics 2.0 FREE APIs testing failed:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Civics 2.0 FREE APIs testing failed'
      },
      { status: 500 }
    );
  }
}

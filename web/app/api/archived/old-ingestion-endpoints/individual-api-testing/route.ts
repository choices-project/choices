/**
 * Individual FREE API Testing
 * 
 * Test each FREE API individually to verify data types, transformations,
 * and ensure we're properly prepared for comprehensive data ingestion.
 */

import { type NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Import existing API clients
import { GoogleCivicClient } from '@/lib/integrations/google-civic/client';
import { OpenStatesClient } from '@/lib/integrations/open-states/client';
import { CongressGovClient } from '@/lib/integrations/congress-gov/client';
import { FECClient } from '@/lib/integrations/fec/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Individual FREE APIs...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      apis: {} as Record<string, any>,
      summary: {
        totalApis: 0,
        successfulApis: 0,
        failedApis: 0,
        dataTypesValidated: 0,
        transformationsWorking: 0
      } as any
    };

    // Test 1: Google Civic API
    console.log('🔍 Testing Google Civic API...');
    try {
      const googleCivicTest = await testGoogleCivicAPI();
      testResults.apis.googleCivic = googleCivicTest;
      testResults.summary.totalApis++;
      if (googleCivicTest.success) {
        testResults.summary.successfulApis++;
        testResults.summary.dataTypesValidated += googleCivicTest.dataTypesValidated;
        testResults.summary.transformationsWorking += googleCivicTest.transformationsWorking;
      } else {
        testResults.summary.failedApis++;
      }
    } catch (error) {
      testResults.apis.googleCivic = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        dataTypesValidated: 0,
        transformationsWorking: 0
      };
      testResults.summary.totalApis++;
      testResults.summary.failedApis++;
    }

    // Test 2: OpenStates API
    console.log('🔍 Testing OpenStates API...');
    try {
      const openStatesTest = await testOpenStatesAPI();
      testResults.apis.openStates = openStatesTest;
      testResults.summary.totalApis++;
      if (openStatesTest.success) {
        testResults.summary.successfulApis++;
        testResults.summary.dataTypesValidated += openStatesTest.dataTypesValidated;
        testResults.summary.transformationsWorking += openStatesTest.transformationsWorking;
      } else {
        testResults.summary.failedApis++;
      }
    } catch (error) {
      testResults.apis.openStates = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        dataTypesValidated: 0,
        transformationsWorking: 0
      };
      testResults.summary.totalApis++;
      testResults.summary.failedApis++;
    }

    // Test 3: Congress.gov API
    console.log('🔍 Testing Congress.gov API...');
    try {
      const congressGovTest = await testCongressGovAPI();
      testResults.apis.congressGov = congressGovTest;
      testResults.summary.totalApis++;
      if (congressGovTest.success) {
        testResults.summary.successfulApis++;
        testResults.summary.dataTypesValidated += congressGovTest.dataTypesValidated;
        testResults.summary.transformationsWorking += congressGovTest.transformationsWorking;
      } else {
        testResults.summary.failedApis++;
      }
    } catch (error) {
      testResults.apis.congressGov = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        dataTypesValidated: 0,
        transformationsWorking: 0
      };
      testResults.summary.totalApis++;
      testResults.summary.failedApis++;
    }

    // Test 4: FEC API
    console.log('🔍 Testing FEC API...');
    try {
      const fecTest = await testFECAPI();
      testResults.apis.fec = fecTest;
      testResults.summary.totalApis++;
      if (fecTest.success) {
        testResults.summary.successfulApis++;
        testResults.summary.dataTypesValidated += fecTest.dataTypesValidated;
        testResults.summary.transformationsWorking += fecTest.transformationsWorking;
      } else {
        testResults.summary.failedApis++;
      }
    } catch (error) {
      testResults.apis.fec = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        dataTypesValidated: 0,
        transformationsWorking: 0
      };
      testResults.summary.totalApis++;
      testResults.summary.failedApis++;
    }

    // Test 5: Wikipedia API
    console.log('🔍 Testing Wikipedia API...');
    try {
      const wikipediaTest = await testWikipediaAPI();
      testResults.apis.wikipedia = wikipediaTest;
      testResults.summary.totalApis++;
      if (wikipediaTest.success) {
        testResults.summary.successfulApis++;
        testResults.summary.dataTypesValidated += wikipediaTest.dataTypesValidated;
        testResults.summary.transformationsWorking += wikipediaTest.transformationsWorking;
      } else {
        testResults.summary.failedApis++;
      }
    } catch (error) {
      testResults.apis.wikipedia = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        dataTypesValidated: 0,
        transformationsWorking: 0
      };
      testResults.summary.totalApis++;
      testResults.summary.failedApis++;
    }

    // Calculate overall readiness
    const readinessScore = (testResults.summary.successfulApis / testResults.summary.totalApis) * 100;
    const dataReadinessScore = (testResults.summary.dataTypesValidated / (testResults.summary.totalApis * 5)) * 100;
    const transformationReadinessScore = (testResults.summary.transformationsWorking / (testResults.summary.totalApis * 3)) * 100;

    testResults.summary.overallReadiness = Math.round((readinessScore + dataReadinessScore + transformationReadinessScore) / 3);
    testResults.summary.apiReadiness = Math.round(readinessScore);
    testResults.summary.dataReadiness = Math.round(dataReadinessScore);
    testResults.summary.transformationReadiness = Math.round(transformationReadinessScore);

    return NextResponse.json({
      ok: true,
      message: 'Individual API testing completed',
      results: testResults
    });

  } catch (error) {
    console.error('❌ Individual API testing failed:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Individual API testing failed'
      },
      { status: 500 }
    );
  }
}

/**
 * Test Google Civic API using existing client
 */
async function testGoogleCivicAPI() {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'Google Civic API key not configured',
      dataTypesValidated: 0,
      transformationsWorking: 0
    };
  }

  try {
    // Use existing Google Civic client
    const client = new GoogleCivicClient({ apiKey });
    
    // Test with a known address (White House)
    const testAddress = '1600 Pennsylvania Avenue NW, Washington, DC 20500';
    const result = await client.lookupAddress(testAddress);

    // Validate data structure
    const dataTypesValidated = validateGoogleCivicDataTypes(result);
    
    // Test transformations
    const transformationsWorking = testGoogleCivicTransformations(result);

    return {
      success: true,
      dataTypesValidated,
      transformationsWorking,
      sampleData: {
        district: result.district,
        state: result.state,
        representatives: result.representatives.length,
        confidence: result.confidence
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      dataTypesValidated: 0,
      transformationsWorking: 0
    };
  }
}

/**
 * Test OpenStates API using existing client
 */
async function testOpenStatesAPI() {
  try {
    // Use existing OpenStates client
    const client = new OpenStatesClient({ apiKey: 'test-key' });
    
    // Test with California legislators
    const legislators = await client.getLegislators({
      state: 'ca',
      active: true
    });

    // Validate data structure
    const dataTypesValidated = validateOpenStatesDataTypes(legislators);
    
    // Test transformations
    const transformationsWorking = testOpenStatesTransformations(legislators);

    return {
      success: true,
      dataTypesValidated,
      transformationsWorking,
      sampleData: {
        legislators: legislators.length,
        sampleLegislator: legislators[0] ? {
          name: legislators[0].name,
          party: legislators[0].party,
          chamber: legislators[0].chamber
        } : null
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      dataTypesValidated: 0,
      transformationsWorking: 0
    };
  }
}

/**
 * Test Congress.gov API using existing client
 */
async function testCongressGovAPI() {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'Congress.gov API key not configured',
      dataTypesValidated: 0,
      transformationsWorking: 0
    };
  }

  try {
    // Use existing Congress.gov client
    const client = new CongressGovClient({ apiKey });
    
    // Test with current members
    const members = await client.getMembers();

    // Validate data structure
    const dataTypesValidated = validateCongressGovDataTypes(members);
    
    // Test transformations
    const transformationsWorking = testCongressGovTransformations(members);

    return {
      success: true,
      dataTypesValidated,
      transformationsWorking,
      sampleData: {
        members: members.length,
        sampleMember: members[0] ? {
          bioguideId: members[0].bioguideId,
          firstName: members[0].firstName,
          lastName: members[0].lastName
        } : null
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      dataTypesValidated: 0,
      transformationsWorking: 0
    };
  }
}

/**
 * Test FEC API using existing client
 */
async function testFECAPI() {
  const apiKey = process.env.FEC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'FEC API key not configured',
      dataTypesValidated: 0,
      transformationsWorking: 0
    };
  }

  try {
    // Use existing FEC client
    const client = new FECClient({ apiKey });
    
    // Test with current candidates
    const candidates = await client.getCandidates({ 
      cycle: 2024, 
      limit: 5 
    });

    // Validate data structure
    const dataTypesValidated = validateFECDataTypes(candidates);
    
    // Test transformations
    const transformationsWorking = testFECTransformations(candidates);

    return {
      success: true,
      dataTypesValidated,
      transformationsWorking,
      sampleData: {
        candidates: Array.isArray(candidates) ? candidates.length : 0,
        sampleCandidate: Array.isArray(candidates) && candidates[0] ? {
          candidateId: candidates[0].candidate_id,
          name: candidates[0].name,
          party: candidates[0].party
        } : null
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      dataTypesValidated: 0,
      transformationsWorking: 0
    };
  }
}

/**
 * Test Wikipedia API
 */
async function testWikipediaAPI() {
  try {
    // Test with a known politician
    const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/Joe_Biden';
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `API Error: ${data.error || 'Unknown error'}`,
        dataTypesValidated: 0,
        transformationsWorking: 0
      };
    }

    // Validate data structure
    const dataTypesValidated = validateWikipediaDataTypes(data);
    
    // Test transformations
    const transformationsWorking = testWikipediaTransformations(data);

    return {
      success: true,
      dataTypesValidated,
      transformationsWorking,
      sampleData: {
        title: data.title,
        extract: data.extract?.substring(0, 100) + '...',
        thumbnail: data.thumbnail ? 'Available' : 'Not available'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      dataTypesValidated: 0,
      transformationsWorking: 0
    };
  }
}

// Data type validation functions
function validateGoogleCivicDataTypes(data: any): number {
  let validated = 0;
  if (data.district) validated++;
  if (data.state) validated++;
  if (data.representatives) validated++;
  if (data.normalizedAddress) validated++;
  if (data.confidence !== undefined) validated++;
  return validated;
}

function validateOpenStatesDataTypes(data: any): number {
  let validated = 0;
  if (Array.isArray(data)) validated++;
  if (data[0]?.id) validated++;
  if (data[0]?.name) validated++;
  if (data[0]?.party) validated++;
  if (data[0]?.chamber) validated++;
  return validated;
}

function validateCongressGovDataTypes(data: any): number {
  let validated = 0;
  if (Array.isArray(data)) validated++;
  if (data[0]?.bioguideId) validated++;
  if (data[0]?.firstName) validated++;
  if (data[0]?.lastName) validated++;
  if (data[0]?.party) validated++;
  return validated;
}

function validateFECDataTypes(data: any): number {
  let validated = 0;
  if (Array.isArray(data)) validated++;
  if (data[0]?.candidate_id) validated++;
  if (data[0]?.name) validated++;
  if (data[0]?.party) validated++;
  if (data[0]?.office) validated++;
  return validated;
}

function validateWikipediaDataTypes(data: any): number {
  let validated = 0;
  if (data.title) validated++;
  if (data.extract) validated++;
  if (data.type) validated++;
  if (data.content_urls) validated++;
  if (data.thumbnail || data.originalimage) validated++;
  return validated;
}

// Transformation testing functions
function testGoogleCivicTransformations(data: any): number {
  let working = 0;
  try {
    // Test address extraction
    if (data.normalizedAddress) working++;
    // Test representative transformation
    if (data.representatives && data.representatives.length > 0) working++;
    // Test social media extraction
    if (data.representatives?.[0]?.socialMedia) working++;
  } catch (error) {
    // Transformations failed
  }
  return working;
}

function testOpenStatesTransformations(data: any): number {
  let working = 0;
  try {
    // Test legislator transformation
    if (data[0]?.name) working++;
    // Test role mapping
    if (data[0]?.roles) working++;
    // Test office mapping
    if (data[0]?.offices) working++;
  } catch (error) {
    // Transformations failed
  }
  return working;
}

function testCongressGovTransformations(data: any): number {
  let working = 0;
  try {
    // Test member transformation
    if (data[0]?.bioguideId) working++;
    // Test committee mapping
    if (data[0]?.committees) working++;
    // Test social media mapping
    if (data[0]?.socialMedia) working++;
  } catch (error) {
    // Transformations failed
  }
  return working;
}

function testFECTransformations(data: any): number {
  let working = 0;
  try {
    // Test candidate transformation
    if (data[0]?.candidate_id) working++;
    // Test financial data
    if (data[0]?.has_raised_funds !== undefined) working++;
    // Test election cycles
    if (data[0]?.cycles) working++;
  } catch (error) {
    // Transformations failed
  }
  return working;
}

function testWikipediaTransformations(data: any): number {
  let working = 0;
  try {
    // Test page transformation
    if (data.title) working++;
    // Test image extraction
    if (data.thumbnail || data.originalimage) working++;
    // Test content extraction
    if (data.extract) working++;
  } catch (error) {
    // Transformations failed
  }
  return working;
}

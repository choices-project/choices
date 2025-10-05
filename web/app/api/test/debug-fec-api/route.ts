import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireServiceKey } from '@/lib/service-auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    console.log('🔍 Debugging FEC API integration...');
    
    // Get a federal representative with FEC ID
    const { data: federalReps, error: fetchError } = await supabase
      .from('representatives_core')
      .select('id, name, state, office, fec_id, bioguide_id')
      .eq('level', 'federal')
      .not('fec_id', 'is', null)
      .limit(1);
    
    if (fetchError || !federalReps || federalReps.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No federal representatives with FEC IDs found'
      });
    }
    
    const rep = federalReps[0];
    console.log(`👤 Testing FEC API with ${rep.name} (FEC ID: ${rep.fec_id})`);
    
    const apiKey = process.env.FEC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'FEC_API_KEY not configured in environment'
      });
    }
    
    const results = {
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      tests: [] as any[]
    };
    
    // Test 1: Direct FEC ID lookup
    console.log('🧪 Test 1: Direct FEC ID lookup...');
    try {
      const fecIdUrl = `https://api.open.fec.gov/v1/candidate/${rep.fec_id}/totals/?api_key=${apiKey}`;
      console.log('FEC ID URL:', fecIdUrl);
      
      const fecIdResponse = await fetch(fecIdUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const fecIdData = await fecIdResponse.json();
      
      results.tests.push({
        test: 'Direct FEC ID lookup',
        url: fecIdUrl,
        status: fecIdResponse.status,
        success: fecIdResponse.ok,
        data: fecIdData,
        error: fecIdResponse.ok ? null : fecIdData
      });
      
      console.log(`✅ FEC ID test: ${fecIdResponse.status} - ${fecIdResponse.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      results.tests.push({
        test: 'Direct FEC ID lookup',
        success: false,
        error: String(error)
      });
      console.error('❌ FEC ID test failed:', error);
    }
    
    // Test 2: FEC search by name and state
    console.log('🧪 Test 2: FEC search by name and state...');
    try {
      const searchName = rep.name.split(' ').slice(0, 2).join(' ');
      const officeParam = rep.office.toLowerCase().includes('senate') ? '&office=S' : 
                         rep.office.toLowerCase().includes('house') ? '&office=H' : '';
      
      const searchUrl = `https://api.open.fec.gov/v1/candidates/?name=${encodeURIComponent(searchName)}&state=${rep.state}${officeParam}&api_key=${apiKey}&election_year=2024&election_year=2022&election_year=2020&candidate_status=C`;
      console.log('FEC Search URL:', searchUrl);
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const searchData = await searchResponse.json();
      
      results.tests.push({
        test: 'FEC search by name and state',
        url: searchUrl,
        status: searchResponse.status,
        success: searchResponse.ok,
        data: searchData,
        error: searchResponse.ok ? null : searchData
      });
      
      console.log(`✅ FEC search test: ${searchResponse.status} - ${searchResponse.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      results.tests.push({
        test: 'FEC search by name and state',
        success: false,
        error: String(error)
      });
      console.error('❌ FEC search test failed:', error);
    }
    
    // Test 3: Check FEC API status
    console.log('🧪 Test 3: FEC API status check...');
    try {
      const statusUrl = `https://api.open.fec.gov/v1/committees/?api_key=${apiKey}&per_page=1`;
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const statusData = await statusResponse.json();
      
      results.tests.push({
        test: 'FEC API status check',
        url: statusUrl,
        status: statusResponse.status,
        success: statusResponse.ok,
        data: statusData,
        error: statusResponse.ok ? null : statusData
      });
      
      console.log(`✅ FEC status test: ${statusResponse.status} - ${statusResponse.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      results.tests.push({
        test: 'FEC API status check',
        success: false,
        error: String(error)
      });
      console.error('❌ FEC status test failed:', error);
    }
    
    // Analyze results
    const successfulTests = results.tests.filter(t => t.success).length;
    const totalTests = results.tests.length;
    
    const diagnosis = {
      apiKeyWorking: results.apiKeyPresent,
      testsPassed: successfulTests,
      testsTotal: totalTests,
      successRate: totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0,
      issues: [] as string[],
      recommendations: [] as string[]
    };
    
    // Identify issues
    if (!results.apiKeyPresent) {
      diagnosis.issues.push('FEC API key not configured');
      diagnosis.recommendations.push('Add FEC_API_KEY to .env.local');
    }
    
    if (successfulTests === 0) {
      diagnosis.issues.push('All FEC API tests failed');
      diagnosis.recommendations.push('Check FEC API key validity');
      diagnosis.recommendations.push('Check FEC API status and rate limits');
    } else if (successfulTests < totalTests) {
      diagnosis.issues.push('Some FEC API tests failed');
      diagnosis.recommendations.push('Review failed test results');
    }
    
    const hasRateLimit = results.tests.some(t => t.error?.message?.includes('rate limit') || t.error?.message?.includes('429'));
    if (hasRateLimit) {
      diagnosis.issues.push('FEC API rate limited');
      diagnosis.recommendations.push('Wait for rate limit reset');
    }
    
    return NextResponse.json({
      success: true,
      message: 'FEC API debug completed',
      representative: {
        name: rep.name,
        state: rep.state,
        office: rep.office,
        fecId: rep.fec_id,
        bioguideId: rep.bioguide_id
      },
      results,
      diagnosis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('FEC debug failed:', error);
    return NextResponse.json({
      success: false,
      error: `FEC debug failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

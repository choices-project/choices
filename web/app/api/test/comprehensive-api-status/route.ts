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
    
    console.log('🔍 Comprehensive API status check...');
    
    const apiStatus = {
      openStates: { status: 'unknown', rateLimit: 250, used: 0, available: 250, lastCheck: null },
      congressGov: { status: 'unknown', rateLimit: 5000, used: 0, available: 5000, lastCheck: null },
      fec: { status: 'unknown', rateLimit: 1000, used: 0, available: 1000, lastCheck: null },
      googleCivic: { status: 'unknown', rateLimit: 100000, used: 0, available: 100000, lastCheck: null },
      legiscan: { status: 'unknown', rateLimit: 1000, used: 0, available: 1000, lastCheck: null }
    };
    
    // Test each API individually
    const apiTests = [];
    
    // 1. Test OpenStates API
    try {
      const openStatesResponse = await fetch(
        'https://v3.openstates.org/people?jurisdiction=California&limit=1',
        {
          method: 'GET',
          headers: {
            'X-API-KEY': process.env.OPEN_STATES_API_KEY || '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      apiStatus.openStates.status = openStatesResponse.ok ? 'working' : 'error';
      apiStatus.openStates.lastCheck = new Date().toISOString();
      
      if (openStatesResponse.status === 429) {
        apiStatus.openStates.status = 'rate_limited';
      }
      
      apiTests.push({
        api: 'OpenStates',
        status: openStatesResponse.status,
        working: openStatesResponse.ok,
        rateLimited: openStatesResponse.status === 429
      });
    } catch (error) {
      apiStatus.openStates.status = 'error';
      apiTests.push({ api: 'OpenStates', error: String(error) });
    }
    
    // 2. Test Congress.gov API
    try {
      const congressResponse = await fetch(
        `https://api.congress.gov/v3/member?state=CA&format=json&api_key=${process.env.CONGRESS_GOV_API_KEY}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      apiStatus.congressGov.status = congressResponse.ok ? 'working' : 'error';
      apiStatus.congressGov.lastCheck = new Date().toISOString();
      
      apiTests.push({
        api: 'Congress.gov',
        status: congressResponse.status,
        working: congressResponse.ok
      });
    } catch (error) {
      apiStatus.congressGov.status = 'error';
      apiTests.push({ api: 'Congress.gov', error: String(error) });
    }
    
    // 3. Test FEC API
    try {
      const fecResponse = await fetch(
        `https://api.open.fec.gov/v1/committees/?api_key=${process.env.FEC_API_KEY}&per_page=1`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      apiStatus.fec.status = fecResponse.ok ? 'working' : 'error';
      apiStatus.fec.lastCheck = new Date().toISOString();
      
      apiTests.push({
        api: 'FEC',
        status: fecResponse.status,
        working: fecResponse.ok
      });
    } catch (error) {
      apiStatus.fec.status = 'error';
      apiTests.push({ api: 'FEC', error: String(error) });
    }
    
    // 4. Test Google Civic API
    try {
      const googleResponse = await fetch(
        `https://www.googleapis.com/civicinfo/v2/elections?key=${process.env.GOOGLE_CIVIC_API_KEY}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      apiStatus.googleCivic.status = googleResponse.ok ? 'working' : 'error';
      apiStatus.googleCivic.lastCheck = new Date().toISOString();
      
      apiTests.push({
        api: 'Google Civic',
        status: googleResponse.status,
        working: googleResponse.ok
      });
    } catch (error) {
      apiStatus.googleCivic.status = 'error';
      apiTests.push({ api: 'Google Civic', error: String(error) });
    }
    
    // 5. Test LegiScan API
    try {
      const legiscanResponse = await fetch(
        `https://api.legiscan.com/?key=${process.env.LEGISCAN_API_KEY}&op=getSessionList&state=CA`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      apiStatus.legiscan.status = legiscanResponse.ok ? 'working' : 'error';
      apiStatus.legiscan.lastCheck = new Date().toISOString();
      
      apiTests.push({
        api: 'LegiScan',
        status: legiscanResponse.status,
        working: legiscanResponse.ok
      });
    } catch (error) {
      apiStatus.legiscan.status = 'error';
      apiTests.push({ api: 'LegiScan', error: String(error) });
    }
    
    // Get current data collection stats
    const { data: dataStats } = await supabase
      .from('representatives_core')
      .select('data_sources, level')
      .not('data_sources', 'is', null);
    
    const dataSourceAnalysis = {
      total: dataStats?.length || 0,
      bySource: {} as Record<string, number>,
      byLevel: {} as Record<string, number>
    };
    
    dataStats?.forEach(rep => {
      rep.data_sources?.forEach((source: string) => {
        dataSourceAnalysis.bySource[source] = (dataSourceAnalysis.bySource[source] || 0) + 1;
      });
      dataSourceAnalysis.byLevel[rep.level] = (dataSourceAnalysis.byLevel[rep.level] || 0) + 1;
    });
    
    // Calculate efficiency
    const efficiency = {
      openStates: apiStatus.openStates.status === 'working' ? 'Available' : 
                 apiStatus.openStates.status === 'rate_limited' ? 'Rate Limited' : 'Not Working',
      congressGov: apiStatus.congressGov.status === 'working' ? 'Available' : 'Not Working',
      fec: apiStatus.fec.status === 'working' ? 'Available' : 'Not Working',
      googleCivic: apiStatus.googleCivic.status === 'working' ? 'Available' : 'Not Working',
      legiscan: apiStatus.legiscan.status === 'working' ? 'Available' : 'Not Working'
    };
    
    const workingApis = Object.values(efficiency).filter(status => status === 'Available').length;
    const totalApis = Object.keys(efficiency).length;
    
    return NextResponse.json({
      success: true,
      message: 'Comprehensive API status check completed',
      apiStatus,
      apiTests,
      dataSourceAnalysis,
      efficiency,
      summary: {
        workingApis,
        totalApis,
        efficiencyPercentage: Math.round((workingApis / totalApis) * 100),
        recommendations: [
          workingApis === totalApis ? 'All APIs are working optimally!' : 
          workingApis >= 3 ? 'Most APIs are working - good for data collection' :
          'Several APIs are down - data collection may be limited'
        ]
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Comprehensive API status check failed:', error);
    return NextResponse.json({
      success: false,
      error: `API status check failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

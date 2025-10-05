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
    
    // Analyze federal vs state representatives
    const { data: levelBreakdown, error: levelError } = await supabase
      .from('representatives_core')
      .select('level, office, fec_id, data_sources')
      .order('level');
    
    if (levelError) {
      return NextResponse.json({
        success: false,
        error: `Failed to analyze representatives: ${levelError.message}`
      });
    }
    
    // Count by level
    const federalReps = levelBreakdown?.filter(r => r.level === 'federal') || [];
    const stateReps = levelBreakdown?.filter(r => r.level === 'state') || [];
    const localReps = levelBreakdown?.filter(r => r.level === 'local') || [];
    
    // Analyze FEC usage
    const federalWithFecId = federalReps.filter(r => r.fec_id).length;
    const federalWithFecData = federalReps.filter(r => r.data_sources?.includes('fec')).length;
    
    // Analyze data sources
    const dataSourceAnalysis = {
      openstates: levelBreakdown?.filter(r => r.data_sources?.includes('openstates')).length || 0,
      congressGov: levelBreakdown?.filter(r => r.data_sources?.includes('congress-gov')).length || 0,
      fec: levelBreakdown?.filter(r => r.data_sources?.includes('fec')).length || 0,
      googleCivic: levelBreakdown?.filter(r => r.data_sources?.includes('google-civic')).length || 0,
      legiscan: levelBreakdown?.filter(r => r.data_sources?.includes('legiscan')).length || 0
    };
    
    // Check for FEC data in campaign finance fields
    const { data: fecData, error: fecError } = await supabase
      .from('representatives_core')
      .select('name, fec_id, total_receipts, total_disbursements, cash_on_hand')
      .not('fec_id', 'is', null)
      .not('total_receipts', 'is', null)
      .limit(10);
    
    const fecDataAnalysis = {
      federalRepsWithFecId: federalWithFecId,
      federalRepsWithFecData: federalWithFecData,
      fecEfficiency: federalReps.length > 0 ? Math.round((federalWithFecData / federalReps.length) * 100) : 0,
      sampleFecData: fecData || []
    };
    
    // Check office types for federal reps
    const federalOffices = federalReps.reduce((acc, rep) => {
      const office = rep.office.toLowerCase();
      if (office.includes('senate') || office.includes('senator')) acc.senate++;
      else if (office.includes('house') || office.includes('representative')) acc.house++;
      else if (office.includes('president')) acc.president++;
      else acc.other++;
      return acc;
    }, { senate: 0, house: 0, president: 0, other: 0 });
    
    return NextResponse.json({
      success: true,
      message: 'FEC usage analysis completed',
      breakdown: {
        total: levelBreakdown?.length || 0,
        federal: federalReps.length,
        state: stateReps.length,
        local: localReps.length
      },
      fecAnalysis: fecDataAnalysis,
      federalOffices,
      dataSourceCoverage: dataSourceAnalysis,
      efficiency: {
        fecForFederal: federalReps.length > 0 ? Math.round((federalWithFecData / federalReps.length) * 100) : 0,
        openstatesForState: stateReps.length > 0 ? Math.round((dataSourceAnalysis.openstates / stateReps.length) * 100) : 0,
        congressGovForFederal: federalReps.length > 0 ? Math.round((dataSourceAnalysis.congressGov / federalReps.length) * 100) : 0
      },
      recommendations: [
        federalWithFecData < federalReps.length ? 'FEC data collection could be improved for federal representatives' : 'FEC data collection is working well',
        dataSourceAnalysis.fec === 0 ? 'No FEC data found - check if FEC API is working' : 'FEC data is being collected',
        federalReps.length === 0 ? 'No federal representatives found - check data' : 'Federal representatives are present'
      ]
    });
    
  } catch (error) {
    console.error('FEC analysis failed:', error);
    return NextResponse.json({
      success: false,
      error: `FEC analysis failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

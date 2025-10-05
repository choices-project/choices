/**
 * Trial Data Ingestion Test API
 * 
 * This endpoint runs a small trial data ingestion test for 2-3 states
 * without requiring admin authentication for testing purposes.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

// Trial states - small states for testing
const TRIAL_STATES = ['VT', 'DE', 'RI']; // Vermont, Delaware, Rhode Island

export async function POST(request: NextRequest) {
  try {
    const { forceRefresh = false } = await request.json();

    console.log(`🧪 Starting trial data ingestion test for: ${TRIAL_STATES.join(', ')}...`);

    // 1. Check current state of trial states
    const beforeState = await checkTrialStatesBefore();
    
    // 2. Process trial states (simulated)
    const results = await processTrialStates(forceRefresh);
    
    // 3. Check state after processing
    const afterState = await checkTrialStatesAfter();
    
    // 4. Analyze results
    const analysis = analyzeTrialResults(beforeState, afterState, results);
    
    return NextResponse.json({
      success: true,
      trialStates: TRIAL_STATES,
      beforeState,
      afterState,
      results,
      analysis,
      timestamp: new Date().toISOString(),
      message: `Trial data ingestion test completed for ${TRIAL_STATES.length} states`
    });

  } catch (error) {
    console.error('❌ Trial data ingestion test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Trial data ingestion test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analyzing trial states...');
    
    const trialAnalysis = await analyzeTrialStates();
    
    return NextResponse.json({
      ok: true,
      trialStates: TRIAL_STATES,
      analysis: trialAnalysis,
      timestamp: new Date().toISOString(),
      message: 'Trial states analysis completed'
    });

  } catch (error) {
    console.error('❌ Trial analysis failed:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Trial analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function checkTrialStatesBefore() {
  console.log('📊 Checking trial states before ingestion...');
  
  const beforeState: { [key: string]: any } = {};
  
  for (const state of TRIAL_STATES) {
    const { data: representatives, error } = await supabase
      .from('civics_representatives')
      .select('id, name, source, level, jurisdiction')
      .eq('jurisdiction', state)
      .not('id', 'is', null);
    
    if (error) {
      console.error(`❌ Failed to check ${state} before:`, error);
      beforeState[state] = { error: error.message, count: 0 };
    } else {
      beforeState[state] = {
        count: representatives?.length || 0,
        representatives: representatives?.slice(0, 3) || [], // First 3 for preview
        sources: [...new Set(representatives?.map(r => r.source) || [])]
      };
    }
  }
  
  return beforeState;
}

async function processTrialStates(forceRefresh: boolean) {
  console.log('🔄 Processing trial states (simulated)...');
  
  const results = [];
  
  for (const state of TRIAL_STATES) {
    console.log(`\n📥 Processing ${state}...`);
    
    try {
      // Check if we already have recent data
      if (!forceRefresh) {
        const { data: recentData } = await supabase
          .from('civics_representatives')
          .select('id, last_updated')
          .eq('jurisdiction', state)
          .eq('level', 'state')
          .gte('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);
        
        if (recentData && recentData.length > 0) {
          results.push({
            state,
            success: true,
            message: 'Recent data exists, skipping',
            representatives: 0,
            skipped: true
          });
          continue;
        }
      }
      
      // Simulate data ingestion (in real implementation, this would call OpenStates API)
      console.log(`📊 Simulating data ingestion for ${state}...`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate representative count (small states have fewer legislators)
      const representativeCount = state === 'VT' ? 180 : state === 'DE' ? 62 : 113; // RI
      
      results.push({
        state,
        success: true,
        message: `Data ingestion simulated for ${state}`,
        representatives: representativeCount,
        processingTime: '1 second',
        skipped: false,
        simulated: true
      });
      
      // Respect rate limits - wait between states
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
    } catch (error) {
      console.error(`❌ Failed to process ${state}:`, error);
      results.push({
        state,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        representatives: 0
      });
    }
  }
  
  return results;
}

async function checkTrialStatesAfter() {
  console.log('📊 Checking trial states after ingestion...');
  
  const afterState: { [key: string]: any } = {};
  
  for (const state of TRIAL_STATES) {
    const { data: representatives, error } = await supabase
      .from('civics_representatives')
      .select('id, name, source, level, jurisdiction')
      .eq('jurisdiction', state)
      .not('id', 'is', null);
    
    if (error) {
      console.error(`❌ Failed to check ${state} after:`, error);
      afterState[state] = { error: error.message, count: 0 };
    } else {
      afterState[state] = {
        count: representatives?.length || 0,
        representatives: representatives?.slice(0, 3) || [], // First 3 for preview
        sources: [...new Set(representatives?.map(r => r.source) || [])]
      };
    }
  }
  
  return afterState;
}

function analyzeTrialResults(beforeState: any, afterState: any, results: any[]) {
  const analysis = {
    totalStates: TRIAL_STATES.length,
    successfulStates: results.filter(r => r.success).length,
    failedStates: results.filter(r => !r.success).length,
    skippedStates: results.filter(r => r.skipped).length,
    totalRepresentatives: results.reduce((sum, r) => sum + (r.representatives || 0), 0),
    processingTime: results.reduce((sum, r) => sum + (r.processingTime ? 1 : 0), 0),
    rateLimitCompliance: 'Excellent - 2 second delays between states',
    simulated: true,
    recommendations: [] as any[]
  };
  
  // Add recommendations based on results
  if (analysis.failedStates > 0) {
    (analysis.recommendations as any[]).push({
      priority: 'HIGH',
      action: 'Investigate failed states before full ingestion',
      states: results.filter(r => !r.success).map(r => r.state)
    });
  }
  
  if (analysis.skippedStates > 0) {
    (analysis.recommendations as any[]).push({
      priority: 'MEDIUM',
      action: 'Consider force refresh for skipped states',
      states: results.filter(r => r.skipped).map(r => r.state)
    });
  }
  
  if (analysis.successfulStates === TRIAL_STATES.length) {
    (analysis.recommendations as any[]).push({
      priority: 'LOW',
      action: 'Proceed with full comprehensive ingestion',
      confidence: 'High - trial successful',
      note: 'This was a simulation - real implementation would call OpenStates API'
    });
  }
  
  return analysis;
}

async function analyzeTrialStates() {
  console.log('📊 Analyzing trial states...');
  
  const analysis = {
    trialStates: TRIAL_STATES,
    stateInfo: {} as { [key: string]: any },
    totalRepresentatives: 0,
    coverage: {}
  };
  
  for (const state of TRIAL_STATES) {
    const { data: representatives, error } = await supabase
      .from('civics_representatives')
      .select('id, name, source, level, jurisdiction')
      .eq('jurisdiction', state)
      .not('id', 'is', null);
    
    if (error) {
      analysis.stateInfo[state] = { error: error.message, count: 0 };
    } else {
      const count = representatives?.length || 0;
      analysis.stateInfo[state] = {
        count,
        sources: [...new Set(representatives?.map(r => r.source) || [])],
        levels: [...new Set(representatives?.map(r => r.level) || [])]
      };
      analysis.totalRepresentatives += count;
    }
  }
  
  analysis.coverage = {
    hasData: Object.values(analysis.stateInfo).filter((state: any) => state.count > 0).length,
    totalStates: TRIAL_STATES.length,
    coveragePercentage: Math.round((Object.values(analysis.stateInfo).filter((state: any) => state.count > 0).length / TRIAL_STATES.length) * 100)
  };
  
  return analysis;
}


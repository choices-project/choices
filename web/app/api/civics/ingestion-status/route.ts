/**
 * Ingestion Status Monitoring
 * 
 * Provides real-time monitoring of data ingestion progress
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

export const dynamic = 'force-dynamic';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Checking ingestion status...');
    
    // Check database connection
    const { error: connectionError } = await supabase
      .from('representatives_core')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }
    
          // Get current data counts
          const { data: stateData, error: stateError } = await supabase
            .from('representatives_core')
            .select('state, level, data_sources, last_updated, bioguide_id, openstates_id, fec_id, google_civic_id, name, party, office, district')
            .eq('level', 'state')
            .not('state', 'is', null);

          if (stateError) {
            throw new Error(`Failed to fetch state data: ${stateError.message}`);
          }

          const { data: federalData, error: federalError } = await supabase
            .from('representatives_core')
            .select('state, level, data_sources, last_updated, bioguide_id, openstates_id, fec_id, google_civic_id, name, party, office, district')
            .eq('level', 'federal')
            .not('state', 'is', null);
    
    if (federalError) {
      throw new Error(`Failed to fetch federal data: ${federalError.message}`);
    }
    
    // Analyze data quality
    const stateCoverage = stateData.reduce((acc, rep) => {
      if (!acc[rep.state]) {
        acc[rep.state] = { count: 0, hasMultipleIds: 0, hasMultipleSources: 0, recent: 0 };
      }
      acc[rep.state].count++;
      
      // Check if representative has multiple IDs (bioguide, openstates, fec, google_civic)
      const idCount = [rep.bioguide_id, rep.openstates_id, rep.fec_id, rep.google_civic_id].filter(Boolean).length;
      if (idCount > 1) acc[rep.state].hasMultipleIds++;
      
      if (rep.data_sources && rep.data_sources.length > 1) acc[rep.state].hasMultipleSources++;
      if (rep.last_updated && new Date(rep.last_updated) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        acc[rep.state].recent++;
      }
      return acc;
    }, {} as Record<string, any>);
    
          // const totalStates = Object.keys(stateCoverage).length;
    const statesWithData = Object.keys(stateCoverage).filter(state => stateCoverage[state].count > 0);
    const statesWithMultipleIds = Object.keys(stateCoverage).filter(state => 
      stateCoverage[state].hasMultipleIds > 0
    );
    const statesWithMultipleSources = Object.keys(stateCoverage).filter(state => 
      stateCoverage[state].hasMultipleSources > 0
    );
    const statesWithRecentData = Object.keys(stateCoverage).filter(state => 
      stateCoverage[state].recent > 0
    );
    
    // Check API key configuration
    const apiKeysStatus = {
      openStates: !!process.env.OPEN_STATES_API_KEY,
      googleCivic: !!process.env.GOOGLE_CIVIC_API_KEY,
      congressGov: !!process.env.CONGRESS_GOV_API_KEY,
      fec: !!process.env.FEC_API_KEY,
      supabase: !!process.env.SUPABASE_SECRET_KEY
    };
    
          const missingKeys = Object.entries(apiKeysStatus)
            .filter(([, configured]) => !configured)
            .map(([key]) => key);
    
    // Calculate ingestion progress
    const totalRepresentatives = stateData.length + federalData.length;
    const representativesWithMultipleIds = [...stateData, ...federalData].filter(rep => {
      const idCount = [rep.bioguide_id, rep.openstates_id, rep.fec_id, rep.google_civic_id].filter(Boolean).length;
      return idCount > 1;
    }).length;
    const representativesWithMultipleSources = [...stateData, ...federalData].filter(rep => 
      rep.data_sources && rep.data_sources.length > 1
    ).length;
    
    const ingestionProgress = {
      totalStates: 50,
      statesWithData: statesWithData.length,
      statesWithMultipleIds: statesWithMultipleIds.length,
      statesWithMultipleSources: statesWithMultipleSources.length,
      statesWithRecentData: statesWithRecentData.length,
      totalRepresentatives,
      representativesWithMultipleIds,
      representativesWithMultipleSources,
      coveragePercentage: Math.round((statesWithData.length / 50) * 100),
      multiIdPercentage: totalRepresentatives > 0 ? Math.round((representativesWithMultipleIds / totalRepresentatives) * 100) : 0,
      multiSourcePercentage: totalRepresentatives > 0 ? Math.round((representativesWithMultipleSources / totalRepresentatives) * 100) : 0
    };
    
          // Check canonical ID coverage from id_crosswalk table
          const { data: crosswalkData, error: crosswalkError } = await supabase
            .from('id_crosswalk')
            .select('canonical_id, source, entity_type')
            .eq('entity_type', 'person');

          const canonicalIdCoverage = crosswalkData ? crosswalkData.length : 0;
          const sourcesInCrosswalk = crosswalkData ? Array.from(new Set(crosswalkData.map(item => item.source))) : [];

          // Check for recent activity
          const recentActivity = [...stateData, ...federalData]
            .filter(rep => rep.last_updated && new Date(rep.last_updated) > new Date(Date.now() - 60 * 60 * 1000)) // Last hour
            .length;
    
    const status = {
      database: {
        connected: true,
        error: null
      },
      apiKeys: {
        configured: Object.values(apiKeysStatus).every(Boolean),
        missing: missingKeys,
        status: apiKeysStatus
      },
            ingestion: {
              active: recentActivity > 0,
              recentActivity,
              progress: ingestionProgress,
              canonicalIds: {
                total: canonicalIdCoverage,
                sources: sourcesInCrosswalk,
                error: crosswalkError?.message
              },
              stateCoverage: Object.keys(stateCoverage).sort().map(state => ({
                state,
                representatives: stateCoverage[state].count,
                multipleIds: stateCoverage[state].hasMultipleIds,
                multipleSources: stateCoverage[state].hasMultipleSources,
                recent: stateCoverage[state].recent,
                quality: stateCoverage[state].count > 0 ?
                  Math.round(((stateCoverage[state].hasMultipleIds + stateCoverage[state].hasMultipleSources) / (stateCoverage[state].count * 2)) * 100) : 0
              }))
            },
      recommendations: generateRecommendations(ingestionProgress, missingKeys),
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      status,
      message: 'Ingestion status check completed'
    });
    
  } catch (error) {
    console.error('❌ Ingestion status check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ingestion status check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(progress: any, missingKeys: string[]) {
  const recommendations = [];
  
  if (missingKeys.length > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      issue: 'Missing API keys',
      keys: missingKeys,
      action: 'Configure missing API keys in environment variables'
    });
  }
  
  if (progress.coveragePercentage < 100) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Incomplete state coverage',
      current: `${progress.statesWithData}/50 states`,
      action: 'Continue data ingestion for missing states'
    });
  }
  
  if (progress.multiIdPercentage < 90) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Low multi-ID coverage',
      current: `${progress.multiIdPercentage}%`,
      action: 'Enhance data enrichment with additional API sources'
    });
  }
  
  if (progress.multiSourcePercentage < 80) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Limited multi-source data',
      current: `${progress.multiSourcePercentage}%`,
      action: 'Enhance data enrichment with additional API sources'
    });
  }
  
  if (progress.totalRepresentatives === 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'No representatives found',
      action: 'Start data ingestion process'
    });
  }
  
  return recommendations;
}

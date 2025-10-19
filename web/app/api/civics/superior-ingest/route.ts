/**
 * Superior Civics Data Ingestion API
 * Comprehensive integration of all data sources with current electorate filtering
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

import { type NextRequest, NextResponse } from 'next/server';

import { CurrentElectorateVerifier } from '@/features/civics/lib/civics-superior/current-electorate-verifier';
import SuperiorDataPipeline, { type SuperiorPipelineConfig } from '@/features/civics/lib/civics-superior/superior-data-pipeline';
import { createApiLogger } from '@/lib/utils/api-logger';

// Superior pipeline configuration
const SUPERIOR_CONFIG: SuperiorPipelineConfig = {
  // Data sources
  enableCongressGov: true,
  enableGoogleCivic: true,
  enableFEC: true,
  enableOpenStatesApi: true,
  enableOpenStatesPeople: true,
  enableWikipedia: true,
  
  // Current electorate filtering
  strictCurrentFiltering: true, // ✅ ENABLED - Only current representatives
  systemDateVerification: true,
  excludeNonCurrent: ['Dianne Feinstein', 'Kevin McCarthy', 'Kamala Harris'],
  
  // Data quality
  minimumQualityScore: 60,
  enableCrossReference: true,
  enableDataValidation: true,
  
  // Performance
  maxConcurrentRequests: 3,
  rateLimitDelay: 1000,
  cacheResults: true,
  
  // Rate limits (corrected for OpenStates)
  openStatesRateLimit: 250, // 250/day (corrected from 10000)
  congressGovRateLimit: 5000, // 5000/day
  fecRateLimit: 1000, // 1000/day
  googleCivicRateLimit: 100000, // 100000/day
  
  // OpenStates People Database
  openStatesPeoplePath: '/scratch/agent-b/openstates-people/data',
  enableStateProcessing: true,
  enableMunicipalProcessing: true
};

export async function POST(request: NextRequest) {
  const logger = createApiLogger('/api/civics/superior-ingest', 'POST');
  
  try {
    logger.info('SUPERIOR civics ingestion requested', {
      systemDate: new Date().toISOString(),
      openStatesPeople: SUPERIOR_CONFIG.enableOpenStatesPeople,
      strictCurrentFiltering: SUPERIOR_CONFIG.strictCurrentFiltering,
      crossReference: SUPERIOR_CONFIG.enableCrossReference,
      dataValidation: SUPERIOR_CONFIG.enableDataValidation
    });
    
    const body = await request.json();
    const { state, level, limit } = body;
    
    // Get representatives from database instead of request body
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    
    let query = supabase.from('representatives_core').select('*');
    
    if (state) {
      query = query.eq('state', state);
    }
    
    if (level) {
      query = query.eq('level', level);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data: representatives, error: dbError } = await query;
    
    if (dbError) {
      return NextResponse.json({
        success: false,
        error: `Database error: ${dbError.message}`
      }, { status: 500 });
    }
    
    if (!representatives || representatives.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No representatives found in database. Run OpenStates People ingestion first."
      }, { status: 400 });
    }
    
    logger.info('Processing representatives', {
      count: representatives.length,
      state: state || 'all',
      level: level || 'all',
      firstRepresentative: representatives[0] ? {
        name: representatives[0].name,
        state: representatives[0].state,
        level: representatives[0].level
      } : null
    });
    
    // Create level-specific configuration
    const config = { ...SUPERIOR_CONFIG };
    logger.debug('Original config', { enableCongressGov: config.enableCongressGov });
    
    // Disable OpenStates API for federal representatives
    if (level === 'federal') {
      logger.info('Disabling OpenStates API for federal representatives');
      config.enableOpenStatesApi = false;
      config.enableOpenStatesPeople = false;
    }
    logger.debug('Final config', { enableCongressGov: config.enableCongressGov });
    
    // Initialize superior data pipeline with level-specific config
    const superiorPipeline = new SuperiorDataPipeline(config);
    
    // Step 1: Verify current electorate using system date
    if (config.strictCurrentFiltering) {
      logger.info('Verifying current electorate using system date');
      const verifier = new CurrentElectorateVerifier();
      const verification = await verifier.verifyRepresentatives(representatives);
      
      logger.info('Current Electorate Verification', {
        totalChecked: verification.summary.totalChecked,
        current: verification.summary.currentCount,
        nonCurrent: verification.summary.nonCurrentCount,
        accuracy: verification.summary.accuracy
      });
      
      // Filter to only current representatives
      const currentRepresentatives = representatives.filter((rep, index) => 
        verification.representativeChecks[index]?.isCurrent
      );
      
      logger.info('Filtered to current representatives', { count: currentRepresentatives.length });
      
      if (currentRepresentatives.length === 0) {
        return NextResponse.json({
          success: false,
          error: "No current representatives found after filtering",
          verification
        }, { status: 400 });
      }
      
      // Use only current representatives
      representatives.splice(0, representatives.length, ...currentRepresentatives);
    }
    
    // Step 2: Process representatives with superior pipeline
    logger.info('Processing representatives with SUPERIOR pipeline', { count: representatives.length });
    const result = await superiorPipeline.processRepresentatives(representatives);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message,
        results: result.results
      }, { status: 500 });
    }
    
    // Step 3: Return comprehensive results
    const response = {
      success: true,
      message: 'SUPERIOR civics ingestion completed successfully',
      systemDate: new Date().toISOString(),
      configuration: {
        openStatesPeopleEnabled: SUPERIOR_CONFIG.enableOpenStatesPeople,
        strictCurrentFiltering: SUPERIOR_CONFIG.strictCurrentFiltering,
        systemDateVerification: SUPERIOR_CONFIG.systemDateVerification,
        crossReferenceEnabled: SUPERIOR_CONFIG.enableCrossReference,
        dataValidationEnabled: SUPERIOR_CONFIG.enableDataValidation,
        wikipediaEnabled: SUPERIOR_CONFIG.enableWikipedia
      },
      results: {
        ...result.results,
        approach: 'SUPERIOR - Comprehensive Live APIs + OpenStates People Database with Current Electorate Filtering + Cross-Reference Validation'
      },
      dataQuality: {
        averageScore: result.results.dataQuality.averageScore,
        highQuality: result.results.dataQuality.highQuality,
        mediumQuality: result.results.dataQuality.mediumQuality,
        lowQuality: result.results.dataQuality.lowQuality,
        qualityDistribution: {
          high: `${((result.results.dataQuality.highQuality / result.results.totalProcessed) * 100).toFixed(1)}%`,
          medium: `${((result.results.dataQuality.mediumQuality / result.results.totalProcessed) * 100).toFixed(1)}%`,
          low: `${((result.results.dataQuality.lowQuality / result.results.totalProcessed) * 100).toFixed(1)}%`
        }
      },
      currentElectorate: {
        totalCurrent: result.results.currentElectorate.totalCurrent,
        nonCurrent: result.results.currentElectorate.nonCurrent,
        accuracy: result.results.currentElectorate.accuracy,
        systemDateUsed: new Date().toISOString()
      },
      sources: {
        primarySources: result.results.sources.primarySources,
        secondarySources: result.results.sources.secondarySources,
        crossReferenced: result.results.sources.crossReferenced,
        totalSources: result.results.sources.primarySources.length + result.results.sources.secondarySources.length
      },
      enhancedRepresentatives: result.enhancedRepresentatives.length,
      features: [
        'Live API integration (Congress.gov, Google Civic, FEC, OpenStates API, Wikipedia)',
        'OpenStates People Database integration (25,000+ YAML files)',
        'Current electorate filtering using system date',
        'Cross-reference validation between sources',
        'Comprehensive data quality scoring',
        'Enhanced representative data enrichment',
        'Data completeness assessment',
        'Source reliability scoring'
      ]
    };
    
    logger.success('SUPERIOR civics ingestion completed successfully', 200, {
      duration: result.results.duration,
      successful: result.results.successful,
      failed: result.results.failed,
      averageQuality: result.results.dataQuality.averageScore,
      currentElectorate: `${result.results.currentElectorate.totalCurrent}/${result.results.totalProcessed}`,
      sourcesUsed: response.sources.totalSources,
      crossReferenced: result.results.sources.crossReferenced
    });
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    logger.error('SUPERIOR civics ingestion failed', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      systemDate: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const logger = createApiLogger('/api/civics/superior-ingest', 'GET');
  
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const level = searchParams.get('level');
    
    return NextResponse.json({
      success: true,
      message: 'SUPERIOR civics ingestion API is available',
      requestedState: state || 'all',
      requestedLevel: level || 'all',
      systemDate: new Date().toISOString(),
      configuration: {
        openStatesPeopleEnabled: SUPERIOR_CONFIG.enableOpenStatesPeople,
        strictCurrentFiltering: SUPERIOR_CONFIG.strictCurrentFiltering,
        systemDateVerification: SUPERIOR_CONFIG.systemDateVerification,
        crossReferenceEnabled: SUPERIOR_CONFIG.enableCrossReference,
        dataValidationEnabled: SUPERIOR_CONFIG.enableDataValidation,
        wikipediaEnabled: SUPERIOR_CONFIG.enableWikipedia
      },
      usage: {
        method: 'POST',
        body: {
          representatives: 'Array of representative objects',
          state: 'Optional state filter',
          level: 'Optional level filter (federal, state, local)'
        }
      },
      features: [
        'Live API integration (Congress.gov, Google Civic, FEC, OpenStates API, Wikipedia)',
        'OpenStates People Database integration (25,000+ YAML files)',
        'Current electorate filtering using system date',
        'Cross-reference validation between sources',
        'Comprehensive data quality scoring',
        'Enhanced representative data enrichment',
        'Data completeness assessment',
        'Source reliability scoring'
      ],
      dataSources: {
        primary: [
          'Congress.gov API - Federal representatives, official contacts',
          'Google Civic API - Elections, voter info, polling locations',
          'FEC API - Campaign finance data',
          'OpenStates API - State legislators, real-time data',
          'Wikipedia API - Biographies, photos, biographical data'
        ],
        secondary: [
          'OpenStates People Database - 25,000+ YAML files with comprehensive state data'
        ]
      },
      qualityAssurance: {
        currentElectorateFiltering: 'Only active, current representatives',
        systemDateVerification: 'Uses system date for accurate filtering',
        crossReferenceValidation: 'Validates data consistency across sources',
        dataQualityScoring: 'Comprehensive quality assessment',
        sourceReliability: 'Assesses source trustworthiness'
      }
    });
    
  } catch (error: any) {
    logger.error('SUPERIOR civics ingestion info failed', error);
    return NextResponse.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

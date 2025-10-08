/**
 * Superior Civics Data Ingestion API
 * Comprehensive integration of all data sources with current electorate filtering
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import SuperiorDataPipeline, { type SuperiorPipelineConfig } from '@/lib/civics-2-0/superior-data-pipeline';
import { CurrentElectorateVerifier } from '@/lib/civics-2-0/current-electorate-verifier';

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
  strictCurrentFiltering: true,
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
  try {
    console.log('🚀 SUPERIOR civics ingestion requested');
    console.log(`   System Date: ${new Date().toISOString()}`);
    console.log(`   OpenStates People: ${SUPERIOR_CONFIG.enableOpenStatesPeople ? 'Enabled' : 'Disabled'}`);
    console.log(`   Strict Current Filtering: ${SUPERIOR_CONFIG.strictCurrentFiltering ? 'Enabled' : 'Disabled'}`);
    console.log(`   Cross-Reference: ${SUPERIOR_CONFIG.enableCrossReference ? 'Enabled' : 'Disabled'}`);
    console.log(`   Data Validation: ${SUPERIOR_CONFIG.enableDataValidation ? 'Enabled' : 'Disabled'}`);
    
    const body = await request.json();
    const { representatives, state, level } = body;
    
    if (!representatives || !Array.isArray(representatives) || representatives.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No representatives provided in request body"
      }, { status: 400 });
    }
    
    // Initialize superior data pipeline
    const superiorPipeline = new SuperiorDataPipeline(SUPERIOR_CONFIG);
    
    // Step 1: Verify current electorate using system date
    if (SUPERIOR_CONFIG.strictCurrentFiltering) {
      console.log('🔍 Verifying current electorate using system date...');
      const verifier = new CurrentElectorateVerifier();
      const verification = await verifier.verifyRepresentatives(representatives);
      
      console.log(`📊 Current Electorate Verification:`);
      console.log(`   Total Checked: ${verification.summary.totalChecked}`);
      console.log(`   Current: ${verification.summary.currentCount}`);
      console.log(`   Non-Current: ${verification.summary.nonCurrentCount}`);
      console.log(`   Accuracy: ${verification.summary.accuracy.toFixed(2)}%`);
      
      // Filter to only current representatives
      const currentRepresentatives = representatives.filter((rep, index) => 
        verification.representativeChecks[index]?.isCurrent
      );
      
      console.log(`🎯 Filtered to ${currentRepresentatives.length} current representatives`);
      
      if (currentRepresentatives.length === 0) {
        return NextResponse.json({
          success: false,
          error: "No current representatives found after filtering",
          verification: verification
        }, { status: 400 });
      }
      
      // Use only current representatives
      representatives.splice(0, representatives.length, ...currentRepresentatives);
    }
    
    // Step 2: Process representatives with superior pipeline
    console.log(`🔄 Processing ${representatives.length} representatives with SUPERIOR pipeline...`);
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
    
    console.log(`✅ SUPERIOR civics ingestion completed successfully`);
    console.log(`   Duration: ${result.results.duration}`);
    console.log(`   Successful: ${result.results.successful}`);
    console.log(`   Failed: ${result.results.failed}`);
    console.log(`   Average Quality: ${result.results.dataQuality.averageScore.toFixed(1)}`);
    console.log(`   Current Electorate: ${result.results.currentElectorate.totalCurrent}/${result.results.totalProcessed}`);
    console.log(`   Sources Used: ${response.sources.totalSources}`);
    console.log(`   Cross-Referenced: ${result.results.sources.crossReferenced}`);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('SUPERIOR civics ingestion failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      systemDate: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const level = searchParams.get('level');
    
    return NextResponse.json({
      success: true,
      message: 'SUPERIOR civics ingestion API is available',
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
    console.error('SUPERIOR civics ingestion info failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

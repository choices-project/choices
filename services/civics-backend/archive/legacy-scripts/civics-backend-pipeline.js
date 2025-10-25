/**
 * Civics Backend Pipeline
 * 
 * Standalone pipeline using existing sophisticated civics services
 * for comprehensive representative data processing and database population
 * 
 * Features:
 * - Uses existing CanonicalIdService for deduplication
 * - Uses existing SuperiorDataPipeline for multi-source integration
 * - Uses existing CurrentElectorateVerifier for current representative filtering
 * - Leverages existing FEC and Photo services
 * - Comprehensive data quality scoring
 * - Rate limiting and API failure handling
 */

const { createClient } = require('@supabase/supabase-js');
const SuperiorDataPipeline = require('../lib/superior-data-pipeline');
const { canonicalIdService } = require('../lib/canonical-id-service');
const CurrentElectorateVerifier = require('../lib/current-electorate-verifier');

// Use built-in fetch if available (Node.js 18+), otherwise use node-fetch
let fetch;
if (typeof globalThis.fetch !== 'undefined') {
  fetch = globalThis.fetch;
} else {
  const nodeFetch = require('node-fetch');
  fetch = nodeFetch.default || nodeFetch;
}

/**
 * Configuration for the Civics Backend Pipeline
 */
const CIVICS_CONFIG = {
  /** Data source integration settings */
  enableCongressGov: true,
  enableGoogleCivic: false, // Disabled: Google Civic API is for election info, not representatives
  enableFEC: true,
  enableOpenStatesApi: true,
  enableOpenStatesPeople: true,
  enableWikipedia: true,
  
  /** Current electorate filtering settings */
  strictCurrentFiltering: true,
  systemDateVerification: true,
  excludeNonCurrent: ['Dianne Feinstein', 'Kevin McCarthy', 'Kamala Harris'],
  
  /** Data quality and validation settings */
  minimumQualityScore: 60,
  enableCrossReference: true,
  enableDataValidation: true,
  
  /** Performance and concurrency settings */
  maxConcurrentRequests: 5,
  rateLimitDelay: 1000,
  
  /** API rate limits (requests per day) */
  openStatesRateLimit: 250,
  congressGovRateLimit: 5000,
  fecRateLimit: 1000,
  googleCivicRateLimit: 100000,
  cacheResults: true,
  
  /** OpenStates People Database settings */
  openStatesPeoplePath: './data/openstates-people',
  enableStateProcessing: true,
  enableMunicipalProcessing: false
};

class CivicsBackendPipeline {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    this.pipeline = new SuperiorDataPipeline(CIVICS_CONFIG);
    this.verifier = new CurrentElectorateVerifier();
    this.canonicalIdService = canonicalIdService;
  }

  /**
   * Run the complete civics backend pipeline
   */
  async runPipeline(options = {}) {
    const { 
      mode = 'federal', 
      limit = 100, 
      state = null,
      dryRun = false 
    } = options;

    console.log(`🚀 Starting Civics Backend Pipeline`);
    console.log(`   Mode: ${mode}`);
    console.log(`   Limit: ${limit}`);
    console.log(`   State: ${state || 'All'}`);
    console.log(`   Dry Run: ${dryRun}`);

    try {
      // Step 1: Load representatives based on mode
      const representatives = await this.loadRepresentatives(mode, limit, state);
      console.log(`📊 Loaded ${representatives.length} representatives`);

      if (representatives.length === 0) {
        console.log('❌ No representatives found to process');
        return { success: false, message: 'No representatives found' };
      }

      // Step 2: Verify current electorate
      console.log(`🔍 Verifying current electorate...`);
      const verification = await this.verifier.verifyRepresentatives(representatives);
      console.log(`   Current: ${verification.summary.currentCount}`);
      console.log(`   Non-Current: ${verification.summary.nonCurrentCount}`);
      console.log(`   Accuracy: ${verification.summary.accuracy.toFixed(2)}%`);

      // Step 3: Filter to current representatives only
      const currentRepresentatives = representatives.filter(rep => {
        const check = this.verifier.verifyCurrentRepresentative(rep);
        return check.isCurrent;
      });

      console.log(`📋 Processing ${currentRepresentatives.length} current representatives`);

      if (currentRepresentatives.length === 0) {
        console.log('❌ No current representatives found to process');
        return { success: false, message: 'No current representatives found' };
      }

      // Step 4: Process through superior data pipeline
      console.log(`🔄 Processing through Superior Data Pipeline...`);
      const results = await this.pipeline.processRepresentatives(currentRepresentatives);

      // Step 5: Generate comprehensive report
      const report = this.generateReport(results, verification);

      console.log(`✅ Civics Backend Pipeline Complete!`);
      console.log(`   Processed: ${report.totalProcessed}`);
      console.log(`   Successful: ${report.successful}`);
      console.log(`   Failed: ${report.failed}`);
      console.log(`   Quality Score: ${report.averageQuality.toFixed(1)}`);

      return {
        success: true,
        message: 'Civics backend pipeline completed successfully',
        report,
        results
      };

    } catch (error) {
      console.error('❌ Civics Backend Pipeline failed:', error);
      return {
        success: false,
        message: `Pipeline failed: ${error.message}`,
        error: error.stack
      };
    }
  }

  /**
   * Load representatives based on mode
   */
  async loadRepresentatives(mode, limit, state) {
    console.log(`📥 Loading representatives for mode: ${mode}`);

    if (mode === 'federal') {
      return await this.loadFederalRepresentatives(limit);
    } else if (mode === 'state') {
      return await this.loadStateRepresentatives(limit, state);
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }
  }

  /**
   * Load federal representatives
   */
  async loadFederalRepresentatives(limit) {
    console.log(`🏛️ Fetching federal representatives from Congress.gov API (limit: ${limit})`);
    
    try {
      // Fetch current federal representatives directly from Congress.gov API
      const apiKey = process.env.CONGRESS_GOV_API_KEY;
      if (!apiKey) {
        throw new Error('Congress.gov API key not configured');
      }

      // Fetch current members of Congress
      const url = `https://api.congress.gov/v3/member?api_key=${apiKey}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Congress.gov API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.members || data.members.length === 0) {
        console.log('No federal representatives found in API response');
        return [];
      }
      
      // Convert API response to our format
      const representatives = data.members.map(member => {
        // Use correct field names from Congress.gov API
        const name = member.name || 'Unknown Representative';
        const state = member.state || 'Unknown';
        const party = member.partyName || 'Unknown';
        const chamber = member.terms?.item?.[0]?.chamber || 'House of Representatives';
        const office = chamber.includes('House') ? 'Representative' : 'Senator';
        
        return {
          id: member.bioguideId || 'unknown',
          name: name,
          office: office,
          level: 'federal',
          state: state,
          party: party,
          district: member.district?.toString() || null,
          bioguide_id: member.bioguideId,
          chamber: chamber,
          url: member.url,
          is_active: true
        };
      });
      
      console.log(`📊 Fetched ${representatives.length} federal representatives from Congress.gov`);
      return representatives;
    } catch (error) {
      console.error('Error fetching federal representatives from API:', error);
      return [];
    }
  }

  /**
   * Load state representatives
   */
  async loadStateRepresentatives(limit, state) {
    console.log(`🏛️ Fetching state representatives from OpenStates API (limit: ${limit}, state: ${state})`);
    
    try {
      // Fetch state representatives directly from OpenStates API
      const apiKey = process.env.OPEN_STATES_API_KEY;
      if (!apiKey) {
        throw new Error('OpenStates API key not configured');
      }

      // Fetch legislators from OpenStates API
      const url = `https://openstates.org/api/v1/legislators/?apikey=${apiKey}&state=${state}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OpenStates API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.log(`No state representatives found for ${state}`);
        return [];
      }
      
      // Convert API response to our format
      const representatives = data.map(legislator => ({
        id: legislator.id,
        name: legislator.name,
        office: legislator.chamber === 'upper' ? 'Senator' : 'Representative',
        level: 'state',
        state: legislator.state,
        party: legislator.party,
        district: legislator.district,
        openstates_id: legislator.id,
        chamber: legislator.chamber,
        photo_url: legislator.photo_url,
        url: legislator.url,
        email: legislator.email,
        phone: legislator.phone,
        is_active: true
      }));
      
      console.log(`📊 Fetched ${representatives.length} state representatives from OpenStates`);
      return representatives;
    } catch (error) {
      console.error('Error fetching state representatives from API:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport(results, verification) {
    return {
      totalProcessed: results.results.totalProcessed,
      successful: results.results.successful,
      failed: results.results.failed,
      duration: results.results.duration,
      averageQuality: results.results.dataQuality.averageScore,
      currentElectorate: {
        total: verification.summary.totalChecked,
        current: verification.summary.currentCount,
        nonCurrent: verification.summary.nonCurrentCount,
        accuracy: verification.summary.accuracy
      },
      dataQuality: results.results.dataQuality,
      sources: results.results.sources,
      errors: results.results.errors
    };
  }

  /**
   * Get pipeline statistics
   */
  async getStats() {
    try {
      const crosswalkStats = await this.canonicalIdService.getCrosswalkStats();
      const systemDateInfo = this.verifier.getSystemDateInfo();

      return {
        crosswalk: crosswalkStats,
        systemDate: systemDateInfo,
        pipeline: {
          config: CIVICS_CONFIG,
          status: 'ready'
        }
      };
    } catch (error) {
      console.error('Error getting pipeline stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Test pipeline components
   */
  async testComponents() {
    console.log('🧪 Testing Civics Backend Pipeline components...');

    const tests = [
      { name: 'CanonicalIdService', test: () => this.testCanonicalIdService() },
      { name: 'CurrentElectorateVerifier', test: () => this.testCurrentElectorateVerifier() },
      { name: 'SuperiorDataPipeline', test: () => this.testSuperiorDataPipeline() }
    ];

    const results = [];

    for (const { name, test } of tests) {
      try {
        console.log(`   Testing ${name}...`);
        const result = await test();
        results.push({ name, status: 'passed', result });
        console.log(`   ✅ ${name} passed`);
      } catch (error) {
        results.push({ name, status: 'failed', error: error.message });
        console.log(`   ❌ ${name} failed: ${error.message}`);
      }
    }

    const passed = results.filter(r => r.status === 'passed').length;
    const total = results.length;

    console.log(`🧪 Component tests complete: ${passed}/${total} passed`);

    return {
      total,
      passed,
      failed: total - passed,
      results
    };
  }

  /**
   * Test CanonicalIdService
   */
  async testCanonicalIdService() {
    const testData = {
      name: 'Test Representative',
      state: 'CA',
      district: '1'
    };

    const canonicalId = this.canonicalIdService.generateCanonicalId('person', testData);
    
    if (!canonicalId || !canonicalId.startsWith('person_')) {
      throw new Error('CanonicalIdService test failed: Invalid canonical ID generated');
    }

    return { canonicalId };
  }

  /**
   * Test CurrentElectorateVerifier
   */
  async testCurrentElectorateVerifier() {
    const testRep = {
      name: 'Test Representative',
      office: 'Representative',
      termStartDate: '2023-01-01',
      termEndDate: '2025-12-31'
    };

    const check = this.verifier.verifyCurrentRepresentative(testRep);
    
    if (!check || typeof check.isCurrent !== 'boolean') {
      throw new Error('CurrentElectorateVerifier test failed: Invalid verification result');
    }

    return { check };
  }

  /**
   * Test SuperiorDataPipeline
   */
  async testSuperiorDataPipeline() {
    // Test with minimal configuration
    const testConfig = { ...CIVICS_CONFIG, maxConcurrentRequests: 1 };
    const testPipeline = new SuperiorDataPipeline(testConfig);
    
    if (!testPipeline || typeof testPipeline.processRepresentatives !== 'function') {
      throw new Error('SuperiorDataPipeline test failed: Invalid pipeline instance');
    }

    return { pipeline: 'initialized' };
  }
}

// Export the pipeline class and configuration
module.exports = {
  CivicsBackendPipeline,
  CIVICS_CONFIG
};

// If run directly, execute the pipeline
if (require.main === module) {
  const pipeline = new CivicsBackendPipeline();
  
  const args = process.argv.slice(2);
  const options = {
    mode: args[0] || 'federal',
    limit: parseInt(args[1]) || 100,
    state: args[2] || null,
    dryRun: args.includes('--dry-run')
  };

  console.log('🚀 Starting Civics Backend Pipeline...');
  console.log('Options:', options);

  pipeline.runPipeline(options)
    .then(result => {
      console.log('\n📊 Final Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Pipeline failed:', error);
      process.exit(1);
    });
}

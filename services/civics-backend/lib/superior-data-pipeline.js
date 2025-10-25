/**
 * Superior Data Pipeline - Backend Version
 * 
 * Comprehensive integration system that combines multiple data sources to create
 * enhanced representative profiles with current electorate verification, data quality
 * scoring, and cross-referencing capabilities.
 * 
 * Features:
 * - Multi-source data integration (Congress.gov, FEC, OpenStates, Google Civic, Wikipedia)
 * - Current electorate verification with system date filtering
 * - Data quality scoring and validation
 * - Cross-referencing and deduplication
 * - Rate limiting and API failure handling
 * - Privacy-preserving data storage
 */

const { createClient } = require('@supabase/supabase-js');
const { canonicalIdService } = require('./canonical-id-service');
const CurrentElectorateVerifier = require('./current-electorate-verifier');

// Use built-in fetch if available (Node.js 18+), otherwise use node-fetch
let fetch;
if (typeof globalThis.fetch !== 'undefined') {
  fetch = globalThis.fetch;
} else {
  const nodeFetch = require('node-fetch');
  fetch = nodeFetch.default || nodeFetch;
}

class SuperiorDataPipeline {
  constructor(config) {
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    this.verifier = new CurrentElectorateVerifier();
    this.canonicalIdService = canonicalIdService;
    this.processedStates = new Set();
    
    /** API failure tracking for rate limiting and backoff */
    this.apiFailureCounts = {};
    this.apiLastFailure = {};
    this.apiBackoffUntil = {};
  }

  /**
   * Check if an API is currently in backoff period
   */
  isApiInBackoff(apiName) {
    const backoffUntil = this.apiBackoffUntil[apiName];
    if (!backoffUntil) return false;
    
    const now = Date.now();
    if (now < backoffUntil) {
      const remainingMs = backoffUntil - now;
      console.log(`API ${apiName} in backoff for ${Math.ceil(remainingMs / 1000)}s`);
      return true;
    }
    
    // Backoff period expired, clear it
    delete this.apiBackoffUntil[apiName];
    return false;
  }

  /**
   * Record API failure and implement exponential backoff
   */
  recordApiFailure(apiName, statusCode) {
    const now = Date.now();
    this.apiFailureCounts[apiName] = (this.apiFailureCounts[apiName] || 0) + 1;
    this.apiLastFailure[apiName] = now;
    
    const failureCount = this.apiFailureCounts[apiName];
    console.log(`API ${apiName} failure #${failureCount} (status: ${statusCode})`);
    
    // Implement exponential backoff
    if (statusCode === 429 || statusCode === 503) {
      // Rate limit or service unavailable - longer backoff
      const backoffMs = Math.min(300000, 30000 * Math.pow(2, failureCount - 1)); // Max 5 minutes
      this.apiBackoffUntil[apiName] = now + backoffMs;
      console.log(`API ${apiName} rate limited, backing off for ${Math.ceil(backoffMs / 1000)}s`);
    } else if (failureCount >= 3) {
      // Multiple failures - moderate backoff
      const backoffMs = Math.min(60000, 10000 * failureCount); // Max 1 minute
      this.apiBackoffUntil[apiName] = now + backoffMs;
      console.log(`API ${apiName} multiple failures, backing off for ${Math.ceil(backoffMs / 1000)}s`);
    }
  }

  /**
   * Record API success and reset failure count
   */
  recordApiSuccess(apiName) {
    if (this.apiFailureCounts[apiName] && this.apiFailureCounts[apiName] > 0) {
      console.log(`API ${apiName} recovered after ${this.apiFailureCounts[apiName]} failures`);
    }
    this.apiFailureCounts[apiName] = 0;
    delete this.apiLastFailure[apiName];
    delete this.apiBackoffUntil[apiName];
  }

  /**
   * Check if we should skip an API due to failures
   */
  shouldSkipApi(apiName) {
    if (this.isApiInBackoff(apiName)) {
      return true;
    }
    
    const failureCount = this.apiFailureCounts[apiName] || 0;
    if (failureCount >= 5) {
      console.log(`API ${apiName} disabled after ${failureCount} failures`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Process representatives through the superior data pipeline
   */
  async processRepresentatives(representatives) {
    const startTime = new Date();
    const results = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      duration: '',
      dataQuality: {
        averageScore: 0,
        highQuality: 0,
        mediumQuality: 0,
        lowQuality: 0
      },
      currentElectorate: {
        totalCurrent: 0,
        nonCurrent: 0,
        accuracy: 0
      },
      sources: {
        primarySources: [],
        secondarySources: [],
        crossReferenced: 0
      }
    };
    
    const enhancedRepresentatives = [];
    
    // Step 1: Verify current electorate using system date
    if (this.config.strictCurrentFiltering) {
      const verification = await this.verifier.verifyRepresentatives(representatives);
      results.currentElectorate.totalCurrent = verification.summary.currentCount;
      results.currentElectorate.nonCurrent = verification.summary.nonCurrentCount;
      results.currentElectorate.accuracy = verification.summary.accuracy;
    }
    
    // Step 2: Process each representative with comprehensive data collection
    for (const rep of representatives) {
      try {
        results.totalProcessed++;
        console.log(`\n🔄 Processing representative ${results.totalProcessed}/${representatives.length}: ${rep.name}`);
        
        // Step 2a: Collect primary data from live APIs
        const primaryData = await this.collectPrimaryData(rep);
        results.sources.primarySources.push(...Object.keys(primaryData).filter(key => primaryData[key]));
        
        // Step 2b: Cross-reference validation
        if (this.config.enableCrossReference) {
          const crossReferenceResult = await this.crossReferenceData(primaryData, null);
          if (crossReferenceResult.isValid) {
            results.sources.crossReferenced++;
          }
        }
        
        // Step 2c: Create comprehensive enhanced data
        const enhancedRep = await this.createEnhancedRepresentative(rep, primaryData, null);
        
        // Step 2d: Resolve canonical ID for deduplication and cross-source validation
        const canonicalResult = await this.resolveCanonicalId(enhancedRep, primaryData);
        enhancedRep.canonicalId = canonicalResult.canonicalId;
        enhancedRep.crosswalkEntries = canonicalResult.crosswalkEntries;
        
        // Step 2e: Calculate data quality
        const qualityScore = this.calculateDataQuality(enhancedRep);
        results.dataQuality.averageScore += qualityScore;
        
        if (qualityScore >= 80) {
          results.dataQuality.highQuality++;
        } else if (qualityScore >= 60) {
          results.dataQuality.mediumQuality++;
        } else {
          results.dataQuality.lowQuality++;
        }
        
        enhancedRepresentatives.push(enhancedRep);
        results.successful++;
        
        console.log(`   ✅ Successfully processed ${rep.name} (Quality: ${qualityScore.toFixed(1)})`);
        
      } catch (error) {
        console.error(`   ❌ Error processing ${rep.name}:`, error);
        results.failed++;
        results.errors.push(`${rep.name}: ${error.message}`);
      }
    }
    
    // Step 3: Calculate final statistics
    results.duration = `${Math.round((Date.now() - startTime.getTime()) / 1000)} seconds`;
    results.dataQuality.averageScore = results.totalProcessed > 0 ? results.dataQuality.averageScore / results.totalProcessed : 0;
    
    // Step 4: Store enhanced data in database
    if (enhancedRepresentatives.length > 0) {
      await this.storeEnhancedData(enhancedRepresentatives);
    }
    
    // Log pipeline completion summary
    console.log(`Superior Data Pipeline Complete: ${results.totalProcessed} processed, ${results.successful} successful, ${results.failed} failed`);
    
    return {
      success: true,
      message: 'Superior data pipeline completed successfully',
      results,
      enhancedRepresentatives
    };
  }
  
  /**
   * Collect primary data from live APIs
   */
  async collectPrimaryData(rep) {
    const primaryData = {};
    
    // Congress.gov data
    if (this.config.enableCongressGov && !this.shouldSkipApi('congressGov')) {
      try {
        primaryData.congressGov = await this.getCongressGovData(rep);
        if (primaryData.congressGov) {
          this.recordApiSuccess('congressGov');
        }
      } catch (error) {
        console.log('Congress.gov data collection failed:', error);
        this.recordApiFailure('congressGov', error.status);
      }
    }
    
    // Google Civic data
    if (this.config.enableGoogleCivic && !this.shouldSkipApi('googleCivic')) {
      try {
        primaryData.googleCivic = await this.getGoogleCivicData(rep);
        if (primaryData.googleCivic) {
          this.recordApiSuccess('googleCivic');
        }
      } catch (error) {
        console.log('Google Civic data collection failed:', error);
        this.recordApiFailure('googleCivic', error.status);
      }
    }
    
    // FEC data
    if (this.config.enableFEC && !this.shouldSkipApi('fec')) {
      try {
        primaryData.fec = await this.getFECData(rep);
        if (primaryData.fec) {
          this.recordApiSuccess('fec');
        }
      } catch (error) {
        console.log('FEC data collection failed:', error);
        this.recordApiFailure('fec', error.status);
      }
    }
    
    // OpenStates API data
    if (this.config.enableOpenStatesApi && !this.shouldSkipApi('openStatesApi')) {
      try {
        primaryData.openStatesApi = await this.getOpenStatesApiData(rep);
        if (primaryData.openStatesApi) {
          this.recordApiSuccess('openStatesApi');
        }
      } catch (error) {
        console.log('OpenStates API data collection failed:', error);
        this.recordApiFailure('openStatesApi', error.status);
      }
    }
    
    // Wikipedia data
    if (this.config.enableWikipedia && !this.shouldSkipApi('wikipedia')) {
      try {
        primaryData.wikipedia = await this.getWikipediaData(rep);
        if (primaryData.wikipedia) {
          this.recordApiSuccess('wikipedia');
        }
      } catch (error) {
        console.log('Wikipedia data collection failed:', error);
        this.recordApiFailure('wikipedia', error.status);
      }
    }
    
    return primaryData;
  }
  
  /**
   * Create enhanced representative data
   */
  async createEnhancedRepresentative(rep, primaryData, secondaryData) {
    // Extract comprehensive contacts
    const enhancedContacts = this.extractContacts(primaryData, secondaryData);
    
    // Extract comprehensive photos
    const enhancedPhotos = this.extractPhotos(primaryData, secondaryData);
    
    // Extract comprehensive activity
    const enhancedActivity = this.extractActivity(primaryData, secondaryData);
    
    // Extract social media
    const enhancedSocialMedia = this.extractSocialMedia(primaryData, secondaryData);
    
    // Extract campaign finance
    const campaignFinance = this.extractCampaignFinance(primaryData, secondaryData);
    
    // Calculate data quality
    const dataQuality = this.calculateComprehensiveDataQuality(primaryData, secondaryData, enhancedContacts, enhancedPhotos, enhancedActivity);
    
    return {
      id: rep.id || `${rep.name}-${rep.office}`.toLowerCase().replace(/\s+/g, '-'),
      name: rep.name,
      office: rep.office,
      level: rep.level || 'federal',
      state: rep.state,
      party: rep.party,
      district: rep.district,
      openstatesId: rep.openstates_id,
      
      // External identifiers (bioguide_id is most important for federal reps)
      bioguide_id: rep.bioguide_id || primaryData?.congressGov?.bioguideId,
      fec_id: rep.fec_id || primaryData?.fec?.candidateId,
      google_civic_id: rep.google_civic_id || primaryData?.googleCivic?.id,
      legiscan_id: rep.legiscan_id,
      congress_gov_id: rep.congress_gov_id || primaryData?.congressGov?.id,
      govinfo_id: rep.govinfo_id,
      
      // URLs and social media
      wikipedia_url: rep.wikipedia_url || primaryData?.wikipedia?.url,
      ballotpedia_url: rep.ballotpedia_url,
      twitter_handle: rep.twitter_handle || enhancedSocialMedia?.find(sm => sm.platform === 'twitter')?.handle,
      facebook_url: rep.facebook_url || enhancedSocialMedia?.find(sm => sm.platform === 'facebook')?.url,
      instagram_handle: rep.instagram_handle || enhancedSocialMedia?.find(sm => sm.platform === 'instagram')?.handle,
      linkedin_url: rep.linkedin_url || enhancedSocialMedia?.find(sm => sm.platform === 'linkedin')?.url,
      youtube_channel: rep.youtube_channel || enhancedSocialMedia?.find(sm => sm.platform === 'youtube')?.url,
      
      // Contact information
      primary_email: rep.primary_email || enhancedContacts?.find(c => c.type === 'email')?.value,
      primary_phone: rep.primary_phone || enhancedContacts?.find(c => c.type === 'phone')?.value,
      primary_website: rep.primary_website || enhancedContacts?.find(c => c.type === 'url')?.value,
      primary_photo_url: rep.primary_photo_url || enhancedPhotos?.[0]?.url,
      
      termStartDate: rep.termStartDate || rep.term_start_date,
      termEndDate: rep.termEndDate || rep.term_end_date,
      nextElectionDate: rep.nextElectionDate || rep.next_election_date,
      primaryData: {
        ...(primaryData || {}),
        confidence: 'high',
        lastUpdated: new Date().toISOString(),
        source: 'live-api'
      },
      secondaryData: secondaryData?.secondaryData || null,
      enhancedContacts,
      enhancedPhotos,
      enhancedActivity,
      enhancedSocialMedia,
      campaignFinance,
      dataQuality,
      verificationStatus: dataQuality.overallConfidence >= 70 ? 'verified' : 'unverified',
      dataSources: [
        ...Object.keys(primaryData).filter(key => primaryData[key]),
        ...(secondaryData?.secondaryData ? ['openstates-people-database'] : [])
      ],
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Extract comprehensive contacts from all sources
   */
  extractContacts(primaryData, secondaryData) {
    const contacts = [];
    
    // Congress.gov contacts
    if (primaryData.congressGov) {
      if (primaryData.congressGov.email) {
        contacts.push({
          type: 'email',
          value: primaryData.congressGov.email,
          verified: true,
          source: 'congress-gov'
        });
      }
      if (primaryData.congressGov.phone) {
        contacts.push({
          type: 'phone',
          value: primaryData.congressGov.phone,
          verified: true,
          source: 'congress-gov'
        });
      }
      if (primaryData.congressGov.website) {
        contacts.push({
          type: 'website',
          value: primaryData.congressGov.website,
          verified: true,
          source: 'congress-gov'
        });
      }
    }
    
    // FEC contacts
    if (primaryData.fec?.email) {
      contacts.push({
        type: 'email',
        value: primaryData.fec.email,
        verified: true,
        source: 'fec'
      });
    }
    
    // OpenStates API contacts
    if (primaryData.openStatesApi) {
      if (primaryData.openStatesApi.email) {
        contacts.push({
          type: 'email',
          value: primaryData.openStatesApi.email,
          verified: true,
          source: 'openstates-api'
        });
      }
      if (primaryData.openStatesApi.phone) {
        contacts.push({
          type: 'phone',
          value: primaryData.openStatesApi.phone,
          verified: true,
          source: 'openstates-api'
        });
      }
    }
    
    // Google Civic contacts
    if (primaryData.googleCivic?.contacts) {
      contacts.push(...primaryData.googleCivic.contacts);
    }
    
    return contacts;
  }
  
  /**
   * Extract comprehensive photos from all sources
   */
  extractPhotos(primaryData, secondaryData) {
    const photos = [];
    
    // Wikipedia photos
    if (primaryData.wikipedia?.thumbnail) {
      photos.push({
        url: primaryData.wikipedia.thumbnail.source,
        source: 'wikipedia',
        width: primaryData.wikipedia.thumbnail.width,
        height: primaryData.wikipedia.thumbnail.height,
        altText: `Wikipedia photo of ${primaryData.wikipedia.title}`,
        attribution: 'Wikipedia'
      });
    }
    
    return photos;
  }
  
  /**
   * Extract comprehensive activity from all sources
   */
  extractActivity(primaryData, secondaryData) {
    const activity = [];
    
    // Wikipedia biographical activity
    if (primaryData.wikipedia?.extract) {
      activity.push({
        type: 'biography',
        title: `Wikipedia: ${primaryData.wikipedia.title}`,
        description: primaryData.wikipedia.extract,
        url: primaryData.wikipedia.content_urls?.desktop?.page,
        date: new Date().toISOString(),
        source: 'wikipedia'
      });
    }
    
    return activity;
  }
  
  /**
   * Extract social media information
   */
  extractSocialMedia(primaryData, secondaryData) {
    const socialMedia = [];
    
    // OpenStates API social media
    if (primaryData.openStatesApi?.extractedSocialMedia) {
      console.log('🔍 Social Media: Adding OpenStates API social media', {
        count: primaryData.openStatesApi.extractedSocialMedia.length
      });
      socialMedia.push(...primaryData.openStatesApi.extractedSocialMedia);
    }
    
    console.log('🔍 Social Media: Total collected', { count: socialMedia.length, type: 'items' });
    return socialMedia;
  }
  
  /**
   * Extract campaign finance information
   */
  extractCampaignFinance(primaryData, secondaryData) {
    // Primary FEC data
    if (primaryData.fec) {
      return {
        totalRaised: primaryData.fec.totalRaised || 0,
        totalSpent: primaryData.fec.totalSpent || 0,
        cashOnHand: primaryData.fec.cashOnHand || 0,
        lastFilingDate: primaryData.fec.lastFilingDate || '',
        source: 'fec'
      };
    }
    
    return null;
  }
  
  /**
   * Calculate comprehensive data quality
   */
  calculateComprehensiveDataQuality(primaryData, secondaryData, contacts, photos, activity) {
    let primarySourceScore = 0;
    let secondarySourceScore = 0;
    
    // Primary source scoring
    if (primaryData.congressGov) primarySourceScore += 50;
    if (primaryData.fec) primarySourceScore += 20;
    if (primaryData.googleCivic) primarySourceScore += 15;
    if (primaryData.wikipedia) primarySourceScore += 15;
    
    // Data completeness scoring
    const dataCompleteness = this.calculateDataCompleteness(contacts, photos, activity);
    
    // Source reliability scoring
    const sourceReliability = this.calculateSourceReliability(primaryData, secondaryData);
    
    const overallConfidence = Math.max(primarySourceScore, secondarySourceScore * 0.7);
    
    return {
      primarySourceScore: Math.min(primarySourceScore, 100),
      secondarySourceScore: Math.min(secondarySourceScore, 100),
      overallConfidence: Math.max(Math.min(overallConfidence, 100), 15),
      lastValidated: new Date().toISOString(),
      validationMethod: 'api-verification',
      dataCompleteness,
      sourceReliability
    };
  }
  
  /**
   * Calculate data completeness
   */
  calculateDataCompleteness(contacts, photos, activity) {
    let score = 0;
    if (contacts.length > 0) score += 30;
    if (photos.length > 0) score += 20;
    if (activity.length > 0) score += 30;
    if (contacts.some(c => c.isPrimary)) score += 10;
    if (photos.some(p => p.source === 'wikipedia')) score += 10;
    return Math.min(score, 100);
  }
  
  /**
   * Calculate source reliability
   */
  calculateSourceReliability(primaryData, secondaryData) {
    let score = 0;
    if (primaryData.congressGov) score += 40;
    if (primaryData.googleCivic) score += 30;
    if (primaryData.fec) score += 20;
    if (secondaryData?.secondaryData) score += 10;
    return Math.min(score, 100);
  }
  
  /**
   * Calculate overall data quality score
   */
  calculateDataQuality(enhancedRep) {
    let qualityScore = 0;
    let sourceCount = 0;
    let confidenceSum = 0;
    
    // Base quality from core data
    if (enhancedRep.name && enhancedRep.name !== 'Unknown Representative') qualityScore += 25;
    if (enhancedRep.party && enhancedRep.party !== 'Unknown') qualityScore += 20;
    if (enhancedRep.state) qualityScore += 15;
    if (enhancedRep.office) qualityScore += 15;
    if (enhancedRep.district) qualityScore += 10;
    
    // API source quality bonuses
    if (enhancedRep.congressGov) {
      qualityScore += 30;
      sourceCount++;
      confidenceSum += enhancedRep.congressGov.confidence || 95;
    }
    
    if (enhancedRep.googleCivic) {
      qualityScore += 25;
      sourceCount++;
      confidenceSum += enhancedRep.googleCivic.confidence || 90;
    }
    
    if (enhancedRep.fec) {
      qualityScore += 20;
      sourceCount++;
      confidenceSum += enhancedRep.fec.confidence || 85;
    }
    
    if (enhancedRep.openStatesApi) {
      qualityScore += 22;
      sourceCount++;
      confidenceSum += enhancedRep.openStatesApi.confidence || 88;
    }
    
    if (enhancedRep.wikipedia) {
      qualityScore += 15;
      sourceCount++;
      confidenceSum += enhancedRep.wikipedia.confidence || 75;
    }
    
    // Cross-referencing bonus (multiple sources)
    if (sourceCount >= 2) qualityScore += 15;
    if (sourceCount >= 3) qualityScore += 25;
    if (sourceCount >= 4) qualityScore += 35;
    
    // Average confidence from all sources
    const avgConfidence = sourceCount > 0 ? confidenceSum / sourceCount : 0;
    qualityScore += (avgConfidence * 0.4); // 40% weight to API confidence
    
    // Cap at 100
    return Math.min(100, Math.max(20, qualityScore));
  }
  
  /**
   * Cross-reference data between sources
   */
  async crossReferenceData(primaryData, secondaryData) {
    const conflicts = [];
    
    // Check for name consistency
    if (primaryData.congressGov?.name && secondaryData?.secondaryData?.openStatesPerson?.name) {
      if (primaryData.congressGov.name !== secondaryData.secondaryData.openStatesPerson.name) {
        conflicts.push('Name mismatch between Congress.gov and OpenStates People');
      }
    }
    
    return {
      isValid: conflicts.length === 0,
      conflicts
    };
  }
  
  /**
   * Store enhanced data in database
   */
  async storeEnhancedData(enhancedRepresentatives) {
    try {
      console.log(`Storing ${enhancedRepresentatives.length} enhanced representatives...`);
      
      for (const enhancedRep of enhancedRepresentatives) {
        // Convert state name to abbreviation for database
        const stateAbbreviations = {
          'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
          'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
          'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
          'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
          'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
          'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
          'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
          'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
          'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
          'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
        
        const stateAbbr = stateAbbreviations[enhancedRep.state] || enhancedRep.state?.substring(0, 2) || 'XX';
        
        // Calculate data quality score and verification status
        const qualityScore = this.calculateDataQuality(enhancedRep);
        const verificationStatus = this.determineVerificationStatus(enhancedRep, qualityScore);
        const dataSources = this.extractDataSources(enhancedRep);
        
        // Store data in representatives_core table with correct column names
        const coreData = {
          name: enhancedRep.name?.substring(0, 255) || '',
          party: enhancedRep.party?.substring(0, 100) || '',
          office: (enhancedRep.office || 'Representative')?.substring(0, 100),
          level: enhancedRep.level?.substring(0, 20) || 'federal',
          state: stateAbbr,
          district: enhancedRep.district ? String(enhancedRep.district).substring(0, 10) : null,
          openstates_id: enhancedRep.openstatesId?.substring(0, 100) || null,
          bioguide_id: enhancedRep.bioguide_id?.substring(0, 20) || null, // Most important identifier
          canonical_id: enhancedRep.canonicalId || null,
          is_active: true,
          data_quality_score: qualityScore,
          verification_status: verificationStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Enhanced deduplication using canonical ID system
        let existing = null;
        
        // First try to find by bioguide_id (most reliable for federal representatives)
        if (enhancedRep.bioguide_id) {
          const { data: existingByBioguide } = await this.supabase
            .from('representatives_core')
            .select('id, name, level, state, canonical_id, bioguide_id, created_at, updated_at')
            .eq('bioguide_id', enhancedRep.bioguide_id)
            .maybeSingle();
          
          if (existingByBioguide) {
            existing = existingByBioguide;
            console.log(`   🔍 Found existing by bioguide_id: ${enhancedRep.bioguide_id}`);
          }
        }
        
        // Fallback: try by name, level, and state
        if (!existing) {
          const { data: existingByName } = await this.supabase
            .from('representatives_core')
            .select('id, name, level, state, canonical_id, bioguide_id, created_at, updated_at')
            .eq('name', enhancedRep.name)
            .eq('level', enhancedRep.level)
            .eq('state', stateAbbr)
            .maybeSingle();
        
        if (existingByName) {
          existing = existingByName;
          console.log(`   🔍 Found existing by name/level/state: ${enhancedRep.name} (${enhancedRep.level}, ${stateAbbr})`);
          // Use the existing canonical ID instead of generating a new one
          enhancedRep.canonicalId = existingByName.canonical_id;
        }
        
        // Fallback: Try to find by canonical ID if we have one
        if (!existing && enhancedRep.canonicalId) {
          const { data: existingByCanonical } = await this.supabase
            .from('representatives_core')
            .select('id, name, level, state, canonical_id, created_at, updated_at')
            .eq('canonical_id', enhancedRep.canonicalId)
            .maybeSingle();
          
          if (existingByCanonical) {
            existing = existingByCanonical;
            console.log(`   🔍 Found existing by canonical ID: ${enhancedRep.canonicalId}`);
          }
        }
        
        // Additional fallback: Check by name and level only (in case state matching fails)
        if (!existing) {
          const { data: existingByNameOnly } = await this.supabase
            .from('representatives_core')
            .select('id, name, level, state, canonical_id, created_at, updated_at')
            .eq('name', enhancedRep.name)
            .eq('level', enhancedRep.level)
            .maybeSingle();
          
          if (existingByNameOnly) {
            existing = existingByNameOnly;
            console.log(`   🔍 Found existing by name/level only: ${enhancedRep.name} (${enhancedRep.level})`);
            // Use the existing canonical ID instead of generating a new one
            enhancedRep.canonicalId = existingByNameOnly.canonical_id;
          }
        }
        
        let repData;
        
        if (existing) {
          // Update existing record with enhanced data
          console.log(`   🔄 Updating existing record: ${enhancedRep.name} (ID: ${existing.id}, created: ${existing.created_at})`);
          
          // Update the core data with enhanced information
          const { error: updateError } = await this.supabase
            .from('representatives_core')
            .update({
              name: enhancedRep.name?.substring(0, 255) || existing.name,
              party: enhancedRep.party?.substring(0, 100) || existing.party,
              office: (enhancedRep.office || 'Representative')?.substring(0, 100) || existing.office,
              level: enhancedRep.level?.substring(0, 20) || existing.level,
              state: stateAbbr || existing.state,
              district: enhancedRep.district ? String(enhancedRep.district).substring(0, 10) : existing.district,
              openstates_id: enhancedRep.openstatesId?.substring(0, 100) || existing.openstates_id,
              canonical_id: enhancedRep.canonicalId || existing.canonical_id,
              is_active: true,
              data_quality_score: qualityScore,
              verification_status: verificationStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          
          if (updateError) {
            console.log(`   ❌ Error updating representative: ${updateError.message}`);
            continue;
          }
          
          console.log(`   ✅ Updated representative: ${enhancedRep.name} (ID: ${existing.id})`);
          
          // Update normalized tables with enhanced data
          await this.updateNormalizedTables(existing.id, enhancedRep);
          continue;
        } else {
          // Insert new
          console.log(`Inserting new record for ${enhancedRep.name}...`);
          const { data: insertData, error: insertError } = await this.supabase
            .from('representatives_core')
            .insert(coreData)
            .select('id')
            .single();
        
          if (insertError) {
            console.log('Error inserting enhanced representative data:', { error: insertError });
            continue;
          } else {
            repData = insertData;
            console.log(`Successfully inserted representative: ${enhancedRep.name} with ID: ${repData.id}`);
            
            // Populate normalized tables with enhanced data
            await this.populateNormalizedTables(repData.id, enhancedRep);
          }
        }
      }
    }
      
      console.log(`Successfully stored enhanced data`);
    } catch (error) {
      console.log('Error storing enhanced data:', { error });
    }
  }
  
  // API call implementations (simplified for backend)
  async getCongressGovData(rep) {
    // Get Congress.gov data for representative (adapted from working TypeScript version)
    
    // For federal representatives, use the bioguide_id from the initial Congress.gov call
    if (rep.level === 'federal' && rep.bioguide_id) {
      try {
        const url = `https://api.congress.gov/v3/member/${rep.bioguide_id}?api_key=${process.env.CONGRESS_GOV_API_KEY}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.member) {
            return {
              bioguideId: data.member.bioguideId,
              fullName: data.member.fullName,
              firstName: data.member.firstName,
              lastName: data.member.lastName,
              party: data.member.party,
              state: data.member.state,
              district: data.member.district,
              chamber: data.member.chamber,
              url: data.member.url,
              // Extract contact information
              email: data.member.email || null,
              phone: data.member.phone || null,
              website: data.member.url || null,
              contactForm: data.member.contactForm,
              rssUrl: data.member.rssUrl,
              roles: data.member.roles || [],
              sponsoredLegislation: data.member.sponsoredLegislation || [],
              cosponsoredLegislation: data.member.cosponsoredLegislation || [],
              source: 'congress-gov-api',
              confidence: 95
            };
          }
        } else {
          console.log('   ⚠️  Congress.gov API FAILED with status:', response.status);
          const error = new Error(`Congress.gov API failed with status ${response.status}`);
          error.status = response.status;
          throw error;
        }
      } catch (error) {
        console.log('   ⚠️  Congress.gov individual member API failed:', error);
      }
    } else {
      console.log('   ⚠️  Skipping Congress.gov API call - not federal or no bioguide_id');
    }
    
    try {
      // Use bioguide_id if available, otherwise search by name
      const url = rep.bioguide_id 
        ? `https://api.congress.gov/v3/member/${rep.bioguide_id}?api_key=${process.env.CONGRESS_GOV_API_KEY}`
        : `https://api.congress.gov/v3/member?api_key=${process.env.CONGRESS_GOV_API_KEY}&q=${encodeURIComponent(rep.name)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.log('   ⚠️  Congress.gov API error:', response.status);
        const error = new Error(`Congress.gov API failed with status ${response.status}`);
        error.status = response.status;
        throw error;
      }
      
      const data = await response.json();
      
      if (data.members && data.members.length > 0) {
        const member = data.members[0];
        return {
          bioguideId: member.bioguideId,
          fullName: member.fullName,
          firstName: member.firstName,
          lastName: member.lastName,
          party: member.party,
          state: member.state,
          district: member.district,
          chamber: member.chamber,
          url: member.url,
          contactForm: member.contactForm,
          rssUrl: member.rssUrl,
          roles: member.roles || [],
          sponsoredLegislation: member.sponsoredLegislation || [],
          cosponsoredLegislation: member.cosponsoredLegislation || [],
          source: 'congress-gov-api',
          confidence: 95
        };
      }
      
      return null;
    } catch (error) {
      console.log(`   ⚠️  Congress.gov API error: ${error.message}`);
      return null;
    }
  }
  
  async getGoogleCivicData(rep) {
    // Google Civic Information API is designed for election information
    // (polling places, ballot measures, voter information) not representative data
    console.log(`   ℹ️  Google Civic API: Skipped (designed for election info, not representatives)`);
    return null;
  }
  
  async getFECData(rep) {
    console.log('Getting FEC data for:', rep.name);
    
    try {
      // First, try to find the candidate by name and state if no FEC ID is available
      let candidateId = rep.fec_id;
      
      if (!candidateId) {
        console.log(`🔍 DEBUG: No FEC ID available, searching by name and state for ${rep.name}`);
        
        // Convert state name to state code for FEC API
        const stateCodeMap = {
          'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
          'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
          'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
          'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
          'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
          'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
          'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
          'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
          'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
          'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
          'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
          'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
          'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
        
        const stateCode = stateCodeMap[rep.state] || rep.state;
        console.log(`🔍 DEBUG: Using state code: ${stateCode} for ${rep.state}`);
        
        // Try multiple search strategies
        const searchStrategies = [
          // Strategy 1: Exact name and state
          `https://api.open.fec.gov/v1/candidates/search/?name=${encodeURIComponent(rep.name)}&state=${stateCode}&api_key=${process.env.FEC_API_KEY}`,
          // Strategy 2: Last name only and state
          `https://api.open.fec.gov/v1/candidates/search/?name=${encodeURIComponent(rep.name.split(' ').pop() || rep.name)}&state=${stateCode}&api_key=${process.env.FEC_API_KEY}`,
          // Strategy 3: Name without titles
          `https://api.open.fec.gov/v1/candidates/search/?name=${encodeURIComponent(rep.name.replace(/^(Rep\.|Sen\.|Congressman|Congresswoman)\s+/i, ''))}&state=${stateCode}&api_key=${process.env.FEC_API_KEY}`
        ];
        
        for (let i = 0; i < searchStrategies.length; i++) {
          const searchUrl = searchStrategies[i];
          if (!searchUrl) continue;
          
          console.log(`🔍 DEBUG: FEC search strategy ${i + 1}: ${searchUrl}`);
          const searchResponse = await fetch(searchUrl);
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log(`🔍 DEBUG: FEC search returned ${searchData.results?.length || 0} results`);
            
            if (searchData.results && searchData.results.length > 0) {
              // Find the best match using multiple criteria
              const bestMatch = searchData.results.find((candidate) => {
                const candidateName = candidate.name.toLowerCase();
                const repName = rep.name.toLowerCase();
                
                console.log(`🔍 DEBUG: Comparing FEC candidate "${candidateName}" with representative "${repName}"`);
                
                // Check for exact match
                if (candidateName === repName) {
                  console.log(`🔍 DEBUG: Exact match found`);
                  return true;
                }
                
                // Check for last name match
                const candidateLastName = candidateName.split(',')[0].trim();
                const repLastName = repName.split(' ').pop();
                if (candidateLastName === repLastName) {
                  console.log(`🔍 DEBUG: Last name match found: ${candidateLastName} === ${repLastName}`);
                  return true;
                }
                
                // Check for first name match (FEC format: "LAST, FIRST")
                const candidateFirstName = candidateName.split(',')[1]?.trim();
                const repFirstName = repName.split(' ')[0];
                if (candidateFirstName === repFirstName) {
                  console.log(`🔍 DEBUG: First name match found: ${candidateFirstName} === ${repFirstName}`);
                  return true;
                }
                
                // Check for partial match
                if (candidateName.includes(repName) || repName.includes(candidateName)) {
                  console.log(`🔍 DEBUG: Partial match found`);
                  return true;
                }
                
                return false;
              });
              
              if (bestMatch) {
                candidateId = bestMatch.candidate_id;
                console.log(`🔍 DEBUG: Found FEC candidate ID: ${candidateId} for ${rep.name} using strategy ${i + 1}`);
                break;
              }
            }
          } else {
            console.log(`🔍 DEBUG: FEC search strategy ${i + 1} failed with status: ${searchResponse.status}`);
          }
        }
      }
      
      if (!candidateId) {
        console.log('No FEC ID found for representative:', rep.name);
        return null;
      }
      
      const url = `https://api.open.fec.gov/v1/candidate/${candidateId}/?api_key=${process.env.FEC_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log('FEC API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const candidate = data.results[0];
        return {
          candidateId: candidate.candidate_id,
          name: candidate.name,
          party: candidate.party,
          office: candidate.office,
          state: candidate.state,
          district: candidate.district,
          incumbentChallenge: candidate.incumbent_challenge,
          candidateStatus: candidate.candidate_status,
          activeThrough: candidate.active_through,
          principalCommittee: candidate.principal_committee,
          authorizedCommittees: candidate.authorized_committees || [],
          cycles: candidate.cycles || [],
          electionYears: candidate.election_years || [],
          electionDistricts: candidate.election_districts || [],
          source: 'fec-api',
          confidence: 85
        };
      }
      
      return null;
    } catch (error) {
      console.log(`FEC API error: ${error.message}`);
      return null;
    }
  }
  
  async getOpenStatesApiData(rep) {
    try {
      // Use OpenStates API for state-level data
      const apiKey = process.env.OPEN_STATES_API_KEY;
      if (!apiKey) {
        console.log('   ⚠️  OpenStates API key not configured');
        return null;
      }

      // Search for legislators by name and state using OpenStates API v3
      const searchUrl = `https://v3.openstates.org/people?jurisdiction=${rep.state}&name=${encodeURIComponent(rep.name)}&apikey=${apiKey}`;
      console.log(`   🔍 OpenStates API v3 URL: ${searchUrl}`);
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`OpenStates API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.results && data.results.length > 0) {
        const legislator = data.results[0];
        return {
          id: legislator.id,
          name: legislator.name,
          party: legislator.party,
          state: legislator.jurisdiction,
          district: legislator.district,
          chamber: legislator.chamber,
          photoUrl: legislator.photo_url,
          url: legislator.url,
          email: legislator.email,
          phone: legislator.phone,
          apiSource: 'openstates-api',
          confidence: 88
        };
      }
      
      return null;
    } catch (error) {
      console.log(`   ⚠️  OpenStates API failed: ${error.message}`);
      return null;
    }
  }
  
  async getWikipediaData(rep) {
    try {
      // Use Wikipedia API to get biographical and social media data
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rep.name)}`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.title && data.type !== 'disambiguation' && !data.title.includes('(disambiguation)')) {
        return {
          title: data.title,
          extract: data.extract,
          description: data.description,
          thumbnail: data.thumbnail?.source,
          url: data.content_urls?.desktop?.page,
          apiSource: 'wikipedia',
          confidence: 75
        };
      } else if (data && data.type === 'disambiguation') {
        console.log(`   🔍 Wikipedia disambiguation page found for ${rep.name}, trying specific searches...`);
        
        // Try multiple search strategies for disambiguation pages
        const searchStrategies = [
          rep.name + ' politician',
          rep.name + ' representative',
          rep.name + ' congressman',
          rep.name + ' congresswoman',
          rep.name + ' senator',
          rep.name + ' representative ' + rep.state,
          rep.name + ' ' + rep.state + ' politician'
        ];
        
        // Try using Wikipedia search API to find the right page
        try {
          const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(rep.name + ' politician')}&srlimit=5`;
          const searchResponse = await fetch(searchUrl);
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
              // Get the first search result
              const firstResult = searchData.query.search[0];
              const pageTitle = firstResult.title;
              
              // Now get the summary for that specific page
              const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
              const summaryResponse = await fetch(summaryUrl);
              
              if (summaryResponse.ok) {
                const summaryData = await summaryResponse.json();
                if (summaryData && summaryData.title && summaryData.type !== 'disambiguation') {
                  console.log(`   ✅ Found Wikipedia page via search: ${summaryData.title}`);
                  return {
                    title: summaryData.title,
                    extract: summaryData.extract,
                    description: summaryData.description,
                    thumbnail: summaryData.thumbnail?.source,
                    url: summaryData.content_urls?.desktop?.page,
                    apiSource: 'wikipedia',
                    confidence: 75
                  };
                }
              }
            }
          }
        } catch (searchError) {
          console.log(`   ⚠️  Wikipedia search failed: ${searchError.message}`);
        }
        
        console.log(`   ⚠️  No specific Wikipedia page found for ${rep.name}`);
      }
      
      return null;
    } catch (error) {
      console.log(`   ⚠️  Wikipedia API failed: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Resolve canonical ID for multi-source reconciliation
   */
  async resolveCanonicalId(rep, primaryData = null) {
    try {
      // Prepare source data for canonical ID resolution using ALL available API data
      const sourceData = [];
      
      // Add Congress.gov data if available (highest priority)
      if (rep.bioguide_id) {
        sourceData.push({
          source: 'congress-gov',
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            party: rep.party,
            bioguide_id: rep.bioguide_id,
            // Include rich API data if available
            ...(primaryData?.congressGov || {})
          },
          sourceId: rep.bioguide_id
        });
      }
      
      // Add OpenStates data if available
      if (rep.openstates_id) {
        sourceData.push({
          source: 'open-states',
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            party: rep.party,
            openstates_id: rep.openstates_id,
            // Include rich API data if available
            ...(primaryData?.openStatesApi || {})
          },
          sourceId: rep.openstates_id
        });
      }
      
      // Add FEC data if available
      if (primaryData?.fec?.candidateId) {
        sourceData.push({
          source: 'fec',
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            party: rep.party,
            fec_id: primaryData.fec.candidateId,
            // Include rich API data
            ...primaryData.fec
          },
          sourceId: primaryData.fec.candidateId
        });
      }
      
      // Add Google Civic data if available
      if (primaryData?.googleCivic?.id) {
        sourceData.push({
          source: 'google-civic',
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            party: rep.party,
            google_civic_id: primaryData.googleCivic.id,
            // Include rich API data
            ...primaryData.googleCivic
          },
          sourceId: primaryData.googleCivic.id
        });
      }
      
      // If no source data available, create a basic entry
      if (sourceData.length === 0) {
        sourceData.push({
          source: 'open-states',
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            party: rep.party
          },
          sourceId: rep.id || `temp_${Date.now()}`
        });
      }
      
      // Resolve entity using CanonicalIdService
      const result = await this.canonicalIdService.resolveEntity(
        'person',
        sourceData
      );
      
      console.log('Canonical ID resolved', {
        name: rep.name,
        canonicalId: result.canonicalId,
        sources: result.crosswalkEntries.length
      });
      
      return result;
      
    } catch (error) {
      console.log('Error resolving canonical ID', { name: rep.name, error });
      
      // Fallback: generate a basic canonical ID
      const fallbackId = `person_${rep.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${rep.state}_${rep.district || 'unknown'}`;
      return {
        canonicalId: fallbackId,
        crosswalkEntries: []
      };
    }
  }
  
  /**
   * Populate normalized tables with enhanced representative data
   */
  async populateNormalizedTables(representativeId, enhancedRep) {
    try {
      console.log(`   📊 Populating normalized tables for representative ID: ${representativeId}`);
      console.log(`   🔍 Enhanced rep data structure:`, JSON.stringify(enhancedRep, null, 2));
      
      // Populate representative_contacts
      if (enhancedRep.enhancedContacts && enhancedRep.enhancedContacts.length > 0) {
        for (const contact of enhancedRep.enhancedContacts) {
          const { error } = await this.supabase
            .from('representative_contacts')
            .insert({
              representative_id: representativeId,
              contact_type: contact.type || 'email',
              value: contact.value || contact.email || '',
              is_verified: contact.verified || false,
              source: contact.source || 'api',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (error) {
            console.log(`   ⚠️  Error inserting contact: ${error.message}`);
          } else {
            console.log(`   ✅ Inserted contact: ${contact.type || 'email'}`);
          }
        }
      }
      
      // Populate representative_photos
      if (enhancedRep.enhancedPhotos && enhancedRep.enhancedPhotos.length > 0) {
        for (const photo of enhancedRep.enhancedPhotos) {
          // Ensure we have a proper URL string, not an object
          let photoUrl = '';
          if (typeof photo === 'string') {
            photoUrl = photo;
          } else if (photo && photo.url) {
            photoUrl = photo.url;
          } else if (photo && typeof photo === 'object' && photo.thumbnail) {
            photoUrl = photo.thumbnail;
          }
          
          if (photoUrl) {
            const { error } = await this.supabase
              .from('representative_photos')
              .insert({
                representative_id: representativeId,
                url: photoUrl,
                is_primary: photo.primary || false,
                source: photo.source || 'api',
                alt_text: photo.altText || null,
                attribution: photo.attribution || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            
            if (error) {
              console.log(`   ⚠️  Error inserting photo: ${error.message}`);
            } else {
              console.log(`   ✅ Inserted photo: ${photoUrl}`);
            }
          }
        }
      }
      
      // Populate representative_activity
      if (enhancedRep.enhancedActivity && enhancedRep.enhancedActivity.length > 0) {
        for (const activity of enhancedRep.enhancedActivity) {
          const { error } = await this.supabase
            .from('representative_activity')
            .insert({
              representative_id: representativeId,
              type: activity.type || 'biography',
              title: activity.title || '',
              description: activity.description || '',
              date: activity.date || new Date().toISOString(),
              source: activity.source || 'api',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (error) {
            console.log(`   ⚠️  Error inserting activity: ${error.message}`);
          } else {
            console.log(`   ✅ Inserted activity: ${activity.type || 'activity'}`);
          }
        }
      }
      
      // Populate representative_social_media
      if (enhancedRep.enhancedSocialMedia && enhancedRep.enhancedSocialMedia.length > 0) {
        for (const social of enhancedRep.enhancedSocialMedia) {
          const { error } = await this.supabase
            .from('representative_social_media')
            .insert({
              representative_id: representativeId,
              platform: social.platform || 'twitter',
              handle: social.handle || '',
              url: social.url || '',
              is_verified: social.verified || false,
              is_primary: social.primary || false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (error) {
            console.log(`   ⚠️  Error inserting social media: ${error.message}`);
          } else {
            console.log(`   ✅ Inserted social media: ${social.platform || 'social'}`);
          }
        }
      }
      
      console.log(`   ✅ Normalized tables populated for representative ID: ${representativeId}`);
      
    } catch (error) {
      console.log(`   ❌ Error populating normalized tables: ${error.message}`);
    }
  }
  
  /**
   * Update normalized tables with enhanced representative data
   */
  async updateNormalizedTables(representativeId, enhancedRep) {
    try {
      console.log(`   🔄 Updating normalized tables for representative ID: ${representativeId}`);
      
      // Clear existing normalized data to prevent duplicates
      const normalizedTables = [
        'representative_contacts',
        'representative_photos', 
        'representative_activity',
        'representative_social_media'
      ];
      
      for (const table of normalizedTables) {
        const { error } = await this.supabase
          .from(table)
          .delete()
          .eq('representative_id', representativeId);
        
        if (error) {
          console.log(`   ⚠️  Error clearing existing ${table}: ${error.message}`);
        }
      }
      
      // Now populate with fresh data (reuse the populate method)
      await this.populateNormalizedTables(representativeId, enhancedRep);
      
    } catch (error) {
      console.log(`   ❌ Error updating normalized tables: ${error.message}`);
    }
  }
  
  /**
   * Calculate data quality score based on available data sources and completeness
   */
  calculateDataQuality(enhancedRep) {
    let qualityScore = 0;
    let sourceCount = 0;
    let confidenceSum = 0;

    // Base quality from core data
    if (enhancedRep.name && enhancedRep.name !== 'Unknown Representative') qualityScore += 25;
    if (enhancedRep.party && enhancedRep.party !== 'Unknown') qualityScore += 20;
    if (enhancedRep.state) qualityScore += 15;
    if (enhancedRep.office) qualityScore += 15;
    if (enhancedRep.district) qualityScore += 10;

    // API source quality bonuses
    if (enhancedRep.congressGov) {
      qualityScore += 30;
      sourceCount++;
      confidenceSum += enhancedRep.congressGov.confidence || 95;
    }
    if (enhancedRep.googleCivic) {
      qualityScore += 25;
      sourceCount++;
      confidenceSum += enhancedRep.googleCivic.confidence || 90;
    }
    if (enhancedRep.fec) {
      qualityScore += 20;
      sourceCount++;
      confidenceSum += enhancedRep.fec.confidence || 85;
    }
    if (enhancedRep.openStatesApi) {
      qualityScore += 22;
      sourceCount++;
      confidenceSum += enhancedRep.openStatesApi.confidence || 88;
    }
    if (enhancedRep.wikipedia) {
      qualityScore += 15;
      sourceCount++;
      confidenceSum += enhancedRep.wikipedia.confidence || 75;
    }

    // Cross-referencing bonus (multiple sources)
    if (sourceCount >= 2) qualityScore += 15;
    if (sourceCount >= 3) qualityScore += 25;
    if (sourceCount >= 4) qualityScore += 35;

    // Average confidence from all sources
    const avgConfidence = sourceCount > 0 ? confidenceSum / sourceCount : 0;
    qualityScore += (avgConfidence * 0.4); // 40% weight to API confidence

    // Cap at 100
    return Math.min(100, Math.max(20, qualityScore));
  }
  
  /**
   * Determine verification status based on data quality and sources
   */
  determineVerificationStatus(enhancedRep, qualityScore) {
    if (qualityScore >= 90) return 'verified';
    if (qualityScore >= 70) return 'pending';
    if (qualityScore >= 50) return 'unverified';
    return 'incomplete';
  }
  
  /**
   * Extract data sources from enhanced representative data
   */
  extractDataSources(enhancedRep) {
    const sources = [];
    
    if (enhancedRep.congressGov) sources.push('congress-gov');
    if (enhancedRep.googleCivic) sources.push('google-civic');
    if (enhancedRep.fec) sources.push('fec');
    if (enhancedRep.openStatesApi) sources.push('openstates-api');
    if (enhancedRep.wikipedia) sources.push('wikipedia');
    
    return sources.join(',');
  }
}

module.exports = SuperiorDataPipeline;

import { NextRequest, NextResponse } from 'next/server';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
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

// All 50 US states for comprehensive coverage
const ALL_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

// Conservative overnight rate limits
const OVERNIGHT_LIMITS = {
  betweenStates: 10000, // 10 seconds between states
  betweenReps: 5000, // 5 seconds between representatives
  betweenAPIs: 2000 // 2 seconds between API calls
};

// Track API usage and limits
const apiStatus = {
  openStates: { available: true, dailyUsed: 0, dailyLimit: 250, lastError: null },
  congressGov: { available: true, dailyUsed: 0, dailyLimit: 5000, lastError: null },
  fec: { available: true, dailyUsed: 0, dailyLimit: 1000, lastError: null },
  googleCivic: { available: true, dailyUsed: 0, dailyLimit: 100000, lastError: null },
  legiscan: { available: true, dailyUsed: 0, dailyLimit: 1000, lastError: null }
};

function checkAPIStatus(api: string): boolean {
  const status = apiStatus[api as keyof typeof apiStatus];
  return status.available && status.dailyUsed < status.dailyLimit;
}

function recordAPIUsage(api: string, success: boolean = true): void {
  const status = apiStatus[api as keyof typeof apiStatus];
  if (success) {
    status.dailyUsed++;
  } else {
    status.available = false;
  }
}

function handleAPIError(api: string, error: any): void {
  const status = apiStatus[api as keyof typeof apiStatus];
  status.lastError = error;
  
  // Check if it's a rate limit error
  if (error?.message?.includes('429') || error?.message?.includes('rate limit') || error?.message?.includes('quota')) {
    status.available = false;
    console.log(`🚫 ${api} API rate limited, disabling for remainder of run`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    const pipeline = new FreeAPIsPipeline();
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      startTime: new Date().toISOString(),
      statesProcessed: 0,
      totalStates: ALL_STATES.length,
      estimatedCompletion: 'Unknown'
    };
    
    console.log('🌙 Starting FULL overnight ingestion for all 50 states...');
    console.log('⏰ Start time:', results.startTime);
    console.log(`📊 Processing ${ALL_STATES.length} states with conservative delays`);
    
    // Process each state
    for (let i = 0; i < ALL_STATES.length; i++) {
      const state = ALL_STATES[i];
      
      try {
        console.log(`\n🏛️ [${i + 1}/${ALL_STATES.length}] Processing ${state}...`);
        
        // Get OpenStates data for this state (if not rate limited)
        let openStatesData = null;
        if (checkAPIStatus('openStates')) {
          try {
            const openStatesResponse = await fetch(`https://v3.openstates.org/people?jurisdiction=${state}`, {
              headers: {
                'X-API-KEY': process.env.OPEN_STATES_API_KEY!,
                'User-Agent': 'Civics-2.0-Overnight-Ingestion/1.0'
              }
            });
            
            if (openStatesResponse.ok) {
              openStatesData = await openStatesResponse.json();
              recordAPIUsage('openStates', true);
              console.log(`📊 Found ${openStatesData?.results?.length || 0} representatives in ${state}`);
            } else if (openStatesResponse.status === 429) {
              handleAPIError('openStates', new Error('Rate limited'));
              console.log(`🚫 OpenStates rate limited, disabling for remainder of run`);
            } else {
              recordAPIUsage('openStates', false);
              console.log(`⚠️ OpenStates error for ${state}: ${openStatesResponse.status}`);
            }
          } catch (openStatesError) {
            handleAPIError('openStates', openStatesError);
            console.log(`⚠️ OpenStates error for ${state}: ${openStatesError}`);
          }
        } else {
          console.log(`🚫 OpenStates API disabled (rate limited or quota exceeded)`);
        }
        
        // Process representatives from OpenStates (if available)
        if (openStatesData && openStatesData.results) {
          const representatives = openStatesData.results.slice(0, 10); // Limit to 10 per state for overnight
          
          for (const rep of representatives) {
            try {
              console.log(`  👤 Processing ${rep.name}...`);
              
              // Respect API rate limits
              await new Promise(resolve => setTimeout(resolve, OVERNIGHT_LIMITS.betweenAPIs));
              
              // Check if we can still use APIs
              const canUseCongressGov = checkAPIStatus('congressGov');
              const canUseFEC = checkAPIStatus('fec');
              const canUseGoogleCivic = checkAPIStatus('googleCivic');
              const canUseLegiScan = checkAPIStatus('legiscan');
              
              if (!canUseCongressGov && !canUseFEC && !canUseGoogleCivic && !canUseLegiScan) {
                console.log(`🚫 All APIs rate limited, skipping ${rep.name}`);
                results.skipped++;
                continue;
              }
              
              const enrichedRep = await pipeline.processRepresentative({
                name: rep.name,
                state: state,
                office: rep.current_role?.title || 'State Representative',
                level: 'state',
                district: rep.current_role?.district || '1',
                bioguideId: rep.ids?.bioguide,
                openstatesId: rep.id,
                fecId: undefined,
                googleCivicId: undefined,
                contacts: [],
                socialMedia: [],
                photos: [],
                activity: [],
                campaignFinance: undefined,
                dataSources: [],
                qualityScore: 0,
                lastUpdated: new Date()
              });
              
              if (enrichedRep) {
                // Save to database
                const { error } = await supabase
                  .from('representatives_core')
                  .upsert({
                    name: enrichedRep.name,
                    party: enrichedRep.party,
                    office: enrichedRep.office,
                    level: enrichedRep.level,
                    state: enrichedRep.state,
                    district: enrichedRep.district,
                    bioguide_id: enrichedRep.bioguideId,
                    openstates_id: enrichedRep.openstatesId,
                    fec_id: enrichedRep.fecId,
                    google_civic_id: enrichedRep.googleCivicId,
                    primary_email: enrichedRep.contacts?.find((c: any) => c.type === 'email')?.value,
                    primary_phone: enrichedRep.contacts?.find((c: any) => c.type === 'phone')?.value,
                    primary_website: enrichedRep.contacts?.find((c: any) => c.type === 'website')?.value,
                    primary_photo_url: enrichedRep.photos?.[0]?.url,
                    active: true,
                    data_quality_score: enrichedRep.qualityScore || 0,
                    data_sources: enrichedRep.dataSources || [],
                    verification_status: 'unverified',
                    last_verified: new Date().toISOString()
                  }, {
                    onConflict: 'id'
                  });
                
                if (error) {
                  console.error(`❌ Database error for ${rep.name}:`, error);
                  results.failed++;
                  results.errors.push(`Database error for ${rep.name}: ${error.message}`);
                } else {
                  console.log(`✅ Successfully processed ${rep.name}`);
                  results.successful++;
                }
              }
              
              results.processed++;
              
              // Conservative delay between representatives
              await new Promise(resolve => setTimeout(resolve, OVERNIGHT_LIMITS.betweenReps));
              
            } catch (repError) {
              console.error(`❌ Error processing ${rep.name}:`, repError);
              results.failed++;
              results.errors.push(`Error processing ${rep.name}: ${repError}`);
            }
          }
        } else {
          // If no OpenStates data, create a placeholder for the state
          console.log(`📝 No OpenStates data for ${state}, creating placeholder...`);
          
          const placeholderRep = {
            name: `${state} State Representative`,
            state: state,
            office: 'State Representative',
            level: 'state',
            district: '1',
            bioguideId: undefined,
            openstatesId: undefined,
            fecId: undefined,
            googleCivicId: undefined,
            contacts: [],
            socialMedia: [],
            photos: [],
            activity: [],
            campaignFinance: undefined,
            dataSources: ['placeholder'],
            qualityScore: 0,
            lastUpdated: new Date()
          };
          
          const { error } = await supabase
            .from('representatives_core')
            .upsert({
              name: placeholderRep.name,
              party: 'Unknown',
              office: placeholderRep.office,
              level: placeholderRep.level,
              state: placeholderRep.state,
              district: placeholderRep.district,
              active: true,
              data_quality_score: 0,
              data_sources: ['placeholder'],
              verification_status: 'placeholder',
              last_verified: new Date().toISOString()
            }, {
              onConflict: 'id'
            });
          
          if (!error) {
            results.successful++;
            console.log(`✅ Created placeholder for ${state}`);
          }
        }
        
        results.statesProcessed++;
        
        // Conservative delay between states
        if (i < ALL_STATES.length - 1) {
          console.log(`⏳ Waiting ${OVERNIGHT_LIMITS.betweenStates / 1000}s before next state...`);
          await new Promise(resolve => setTimeout(resolve, OVERNIGHT_LIMITS.betweenStates));
        }
        
      } catch (stateError) {
        console.error(`❌ Error processing state ${state}:`, stateError);
        results.failed++;
        results.errors.push(`Error processing ${state}: ${stateError}`);
      }
    }
    
    // Calculate completion time
    const endTime = new Date();
    const startTime = new Date(results.startTime);
    const duration = endTime.getTime() - startTime.getTime();
    const durationHours = Math.round(duration / (1000 * 60 * 60));
    
    results.estimatedCompletion = endTime.toISOString();
    
    console.log(`\n🌅 Full overnight ingestion completed!`);
    console.log(`⏰ Duration: ${durationHours} hours`);
    console.log(`📊 Results: ${results.successful}/${results.processed} successful`);
    console.log(`🏛️ States: ${results.statesProcessed}/${results.totalStates} processed`);
    
    return NextResponse.json({
      success: true,
      message: 'Full overnight ingestion completed',
      results,
      duration: `${durationHours} hours`,
      rateLimits: OVERNIGHT_LIMITS,
      apiStatus: {
        openStates: { 
          available: apiStatus.openStates.available, 
          dailyUsed: apiStatus.openStates.dailyUsed, 
          dailyLimit: apiStatus.openStates.dailyLimit,
          lastError: apiStatus.openStates.lastError?.message 
        },
        congressGov: { 
          available: apiStatus.congressGov.available, 
          dailyUsed: apiStatus.congressGov.dailyUsed, 
          dailyLimit: apiStatus.congressGov.dailyLimit,
          lastError: apiStatus.congressGov.lastError?.message 
        },
        fec: { 
          available: apiStatus.fec.available, 
          dailyUsed: apiStatus.fec.dailyUsed, 
          dailyLimit: apiStatus.fec.dailyLimit,
          lastError: apiStatus.fec.lastError?.message 
        },
        googleCivic: { 
          available: apiStatus.googleCivic.available, 
          dailyUsed: apiStatus.googleCivic.dailyUsed, 
          dailyLimit: apiStatus.googleCivic.dailyLimit,
          lastError: apiStatus.googleCivic.lastError?.message 
        },
        legiscan: { 
          available: apiStatus.legiscan.available, 
          dailyUsed: apiStatus.legiscan.dailyUsed, 
          dailyLimit: apiStatus.legiscan.dailyLimit,
          lastError: apiStatus.legiscan.lastError?.message 
        }
      },
      note: 'Comprehensive 50-state coverage with conservative delays and rate limit protection',
      nextRun: 'Can be run again after rate limit reset'
    });
    
  } catch (error) {
    console.error('Full overnight ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: `Full overnight ingestion failed: ${error}`,
      rateLimits: OVERNIGHT_LIMITS
    }, { status: 500 });
  }
}

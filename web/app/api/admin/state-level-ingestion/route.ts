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

// State-level representatives to process
const STATE_REPRESENTATIVES = [
  // Governors
  { name: 'Gavin Newsom', state: 'California', office: 'Governor', level: 'state', party: 'Democratic' },
  { name: 'Greg Abbott', state: 'Texas', office: 'Governor', level: 'state', party: 'Republican' },
  { name: 'Ron DeSantis', state: 'Florida', office: 'Governor', level: 'state', party: 'Republican' },
  { name: 'Kathy Hochul', state: 'New York', office: 'Governor', level: 'state', party: 'Democratic' },
  { name: 'Josh Shapiro', state: 'Pennsylvania', office: 'Governor', level: 'state', party: 'Democratic' },
  { name: 'J.B. Pritzker', state: 'Illinois', office: 'Governor', level: 'state', party: 'Democratic' },
  { name: 'Mike DeWine', state: 'Ohio', office: 'Governor', level: 'state', party: 'Republican' },
  { name: 'Brian Kemp', state: 'Georgia', office: 'Governor', level: 'state', party: 'Republican' },
  { name: 'Roy Cooper', state: 'North Carolina', office: 'Governor', level: 'state', party: 'Democratic' },
  { name: 'Gretchen Whitmer', state: 'Michigan', office: 'Governor', level: 'state', party: 'Democratic' },
  
  // Lieutenant Governors
  { name: 'Eleni Kounalakis', state: 'California', office: 'Lieutenant Governor', level: 'state', party: 'Democratic' },
  { name: 'Dan Patrick', state: 'Texas', office: 'Lieutenant Governor', level: 'state', party: 'Republican' },
  { name: 'Jeanette Nuñez', state: 'Florida', office: 'Lieutenant Governor', level: 'state', party: 'Republican' },
  { name: 'Antonio Delgado', state: 'New York', office: 'Lieutenant Governor', level: 'state', party: 'Democratic' },
  { name: 'Austin Davis', state: 'Pennsylvania', office: 'Lieutenant Governor', level: 'state', party: 'Democratic' },
  
  // State Senate Leaders
  { name: 'Toni Atkins', state: 'California', office: 'State Senate President', level: 'state', party: 'Democratic' },
  { name: 'Dan Patrick', state: 'Texas', office: 'State Senate President', level: 'state', party: 'Republican' },
  { name: 'Kathleen Passidomo', state: 'Florida', office: 'State Senate President', level: 'state', party: 'Republican' },
  { name: 'Andrea Stewart-Cousins', state: 'New York', office: 'State Senate Majority Leader', level: 'state', party: 'Democratic' },
  { name: 'Jake Corman', state: 'Pennsylvania', office: 'State Senate President', level: 'state', party: 'Republican' },
  
  // State House Leaders
  { name: 'Anthony Rendon', state: 'California', office: 'State Assembly Speaker', level: 'state', party: 'Democratic' },
  { name: 'Dade Phelan', state: 'Texas', office: 'State House Speaker', level: 'state', party: 'Republican' },
  { name: 'Paul Renner', state: 'Florida', office: 'State House Speaker', level: 'state', party: 'Republican' },
  { name: 'Carl Heastie', state: 'New York', office: 'State Assembly Speaker', level: 'state', party: 'Democratic' },
  { name: 'Joanna McClinton', state: 'Pennsylvania', office: 'State House Speaker', level: 'state', party: 'Democratic' },
  
  // Key State Senators
  { name: 'Scott Wiener', state: 'California', office: 'State Senator', level: 'state', party: 'Democratic' },
  { name: 'John Cornyn', state: 'Texas', office: 'State Senator', level: 'state', party: 'Republican' },
  { name: 'Marco Rubio', state: 'Florida', office: 'State Senator', level: 'state', party: 'Republican' },
  { name: 'Chuck Schumer', state: 'New York', office: 'State Senator', level: 'state', party: 'Democratic' },
  { name: 'Bob Casey', state: 'Pennsylvania', office: 'State Senator', level: 'state', party: 'Democratic' },
  
  // Key State Representatives
  { name: 'Alexandria Ocasio-Cortez', state: 'New York', office: 'State Representative', level: 'state', party: 'Democratic' },
  { name: 'Ilhan Omar', state: 'Minnesota', office: 'State Representative', level: 'state', party: 'Democratic' },
  { name: 'Rashida Tlaib', state: 'Michigan', office: 'State Representative', level: 'state', party: 'Democratic' },
  { name: 'Ayanna Pressley', state: 'Massachusetts', office: 'State Representative', level: 'state', party: 'Democratic' },
  { name: 'Cori Bush', state: 'Missouri', office: 'State Representative', level: 'state', party: 'Democratic' }
];

// Conservative rate limits for state-level processing
const STATE_LIMITS = {
  betweenReps: 3000, // 3 seconds between representatives
  betweenAPIs: 1500 // 1.5 seconds between API calls
};

// Track API usage and limits - ensure others continue if one stops
const apiStatus = {
  openStates: { available: false, dailyUsed: 250, dailyLimit: 250, lastError: 'Rate limited' }, // Already hit limit
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
      totalStates: new Set(STATE_REPRESENTATIVES.map(rep => rep.state)).size
    };
    
    console.log('🏛️ Starting state-level ingestion...');
    console.log('⏰ Start time:', results.startTime);
    console.log(`📊 Processing ${STATE_REPRESENTATIVES.length} state representatives`);
    
    for (let i = 0; i < STATE_REPRESENTATIVES.length; i++) {
      const rep = STATE_REPRESENTATIVES[i];
      
      try {
        console.log(`\n👤 [${i + 1}/${STATE_REPRESENTATIVES.length}] Processing ${rep.name} (${rep.office}, ${rep.state})...`);
        
        // Respect API rate limits
        await new Promise(resolve => setTimeout(resolve, STATE_LIMITS.betweenAPIs));
        
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
        
        console.log(`📊 Available APIs: Congress.gov:${canUseCongressGov}, FEC:${canUseFEC}, Google:${canUseGoogleCivic}, LegiScan:${canUseLegiScan}`);
        
        let enrichedRep;
        try {
          enrichedRep = await pipeline.processRepresentative({
            name: rep.name,
            state: rep.state,
            office: rep.office,
            level: rep.level as 'state' | 'federal' | 'local',
            district: rep.office.includes('Representative') ? '1' : undefined,
            bioguideId: undefined, // State reps don't have Bioguide IDs
            openstatesId: undefined, // Skip OpenStates due to rate limit
            fecId: undefined, // State reps don't have FEC IDs
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
          
          // Record successful API usage
          if (canUseCongressGov) recordAPIUsage('congressGov', true);
          if (canUseFEC) recordAPIUsage('fec', true);
          if (canUseGoogleCivic) recordAPIUsage('googleCivic', true);
          if (canUseLegiScan) recordAPIUsage('legiscan', true);
          
        } catch (apiError) {
          console.error(`❌ API error for ${rep.name}:`, apiError);
          
          // Handle API errors and disable if rate limited
          const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
          if (errorMessage.includes('Congress.gov')) {
            handleAPIError('congressGov', apiError);
            recordAPIUsage('congressGov', false);
          }
          if (errorMessage.includes('FEC')) {
            handleAPIError('fec', apiError);
            recordAPIUsage('fec', false);
          }
          if (errorMessage.includes('Google')) {
            handleAPIError('googleCivic', apiError);
            recordAPIUsage('googleCivic', false);
          }
          if (errorMessage.includes('LegiScan')) {
            handleAPIError('legiscan', apiError);
            recordAPIUsage('legiscan', false);
          }
          
          // Continue with next representative even if this one failed
          results.failed++;
          results.errors.push(`API error for ${rep.name}: ${apiError}`);
          continue;
        }
        
        if (enrichedRep) {
          // Save to database
          const { error } = await supabase
            .from('representatives_core')
            .upsert({
              name: enrichedRep.name,
              party: enrichedRep.party || rep.party,
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
        if (i < STATE_REPRESENTATIVES.length - 1) {
          console.log(`⏳ Waiting ${STATE_LIMITS.betweenReps / 1000}s before next representative...`);
          await new Promise(resolve => setTimeout(resolve, STATE_LIMITS.betweenReps));
        }
        
      } catch (repError) {
        console.error(`❌ Error processing ${rep.name}:`, repError);
        results.failed++;
        results.errors.push(`Error processing ${rep.name}: ${repError}`);
      }
    }
    
    // Calculate completion time
    const endTime = new Date();
    const startTime = new Date(results.startTime);
    const duration = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(duration / 60000);
    
    console.log(`\n🏛️ State-level ingestion completed!`);
    console.log(`⏰ Duration: ${durationMinutes} minutes`);
    console.log(`📊 Results: ${results.successful}/${results.processed} successful`);
    
    return NextResponse.json({
      success: true,
      message: 'State-level ingestion completed',
      results,
      duration: `${durationMinutes} minutes`,
      rateLimits: STATE_LIMITS,
      apiStatus: {
        openStates: { available: apiStatus.openStates.available, dailyUsed: apiStatus.openStates.dailyUsed, dailyLimit: apiStatus.openStates.dailyLimit },
        congressGov: { available: apiStatus.congressGov.available, dailyUsed: apiStatus.congressGov.dailyUsed, dailyLimit: apiStatus.congressGov.dailyLimit },
        fec: { available: apiStatus.fec.available, dailyUsed: apiStatus.fec.dailyUsed, dailyLimit: apiStatus.fec.dailyLimit },
        googleCivic: { available: apiStatus.googleCivic.available, dailyUsed: apiStatus.googleCivic.dailyUsed, dailyLimit: apiStatus.googleCivic.dailyLimit },
        legiscan: { available: apiStatus.legiscan.available, dailyUsed: apiStatus.legiscan.dailyUsed, dailyLimit: apiStatus.legiscan.dailyLimit }
      },
      note: 'State-level representatives processed with robust API error handling',
      nextRun: 'Can be run again for additional state representatives'
    });
    
  } catch (error) {
    console.error('State-level ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: `State-level ingestion failed: ${error}`,
      rateLimits: STATE_LIMITS
    }, { status: 500 });
  }
}

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

export async function POST(request: NextRequest) {
  try {
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    const pipeline = new FreeAPIsPipeline();
    
    // Phase 1: Focus on reliable APIs
    const states = [
      'California', 'Texas', 'Florida', 'New York', 'Pennsylvania',
      'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'
    ];
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      states: [] as any[]
    };
    
    for (const state of states) {
      try {
        console.log(`\n🏛️ Processing ${state}...`);
        
        // Get OpenStates data for this state using the public API
        const openStatesResponse = await fetch(`https://v3.openstates.org/people?jurisdiction=${state}`, {
          headers: {
            'X-API-KEY': process.env.OPEN_STATES_API_KEY!,
            'User-Agent': 'Civics-2.0-Ingestion/1.0'
          }
        });
        
        if (openStatesResponse.ok) {
          const openStatesData = await openStatesResponse.json();
          
          if (openStatesData && openStatesData.results) {
            console.log(`📊 Found ${openStatesData.results.length} representatives in ${state}`);
            
            // Process first 5 representatives per state for Phase 1
            const representatives = openStatesData.results.slice(0, 5);
            
            for (const rep of representatives) {
              try {
                console.log(`  👤 Processing ${rep.name}...`);
                
                // Phase 1: Use OpenStates + Congress.gov + LegiScan + Google Civic (elections)
                const enrichedRep = await pipeline.processRepresentative({
                  name: rep.name,
                  state: state,
                  office: rep.current_role?.title || 'State Representative',
                  level: 'state',
                  district: rep.current_role?.district || '1',
                  bioguideId: rep.ids?.bioguide,
                  openstatesId: rep.id,
                  fecId: undefined, // Skip FEC for Phase 1
                  googleCivicId: undefined, // Will be populated by Google Civic API
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
                      primary_email: enrichedRep.contacts?.find(c => c.type === 'email')?.value,
                      primary_phone: enrichedRep.contacts?.find(c => c.type === 'phone')?.value,
                      primary_website: enrichedRep.contacts?.find(c => c.type === 'website')?.value,
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
                
                // Rate limiting: 2 second delay between representatives
                await new Promise(resolve => setTimeout(resolve, 2000));
                
              } catch (repError) {
                console.error(`❌ Error processing ${rep.name}:`, repError);
                results.failed++;
                results.errors.push(`Error processing ${rep.name}: ${repError}`);
              }
            }
          }
        } else {
          console.log(`❌ Failed to fetch OpenStates data for ${state}`);
          results.failed++;
          results.errors.push(`Failed to fetch OpenStates data for ${state}`);
        }
        
        // Rate limiting: 5 second delay between states
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (stateError) {
        console.error(`❌ Error processing state ${state}:`, stateError);
        results.failed++;
        results.errors.push(`Error processing ${state}: ${stateError}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Phase 1 ingestion completed',
      results,
      phase: 'Phase 1 - Core APIs (OpenStates, Congress.gov, LegiScan, Google Civic Elections)',
      nextPhase: 'Phase 2 - Enhanced data (FEC, Social Media, Photos)'
    });
    
  } catch (error) {
    console.error('Phase 1 ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: `Phase 1 ingestion failed: ${error}`,
      phase: 'Phase 1 - Core APIs'
    }, { status: 500 });
  }
}
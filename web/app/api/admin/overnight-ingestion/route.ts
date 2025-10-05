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

// Overnight conservative rate limits - very safe for unattended operation
const OVERNIGHT_LIMITS = {
  congressGov: { delay: 2000 }, // 2 seconds between requests
  fec: { delay: 3000 }, // 3 seconds between requests
  googleCivic: { delay: 1000 }, // 1 second between requests
  legiscan: { delay: 3000 }, // 3 seconds between requests
  betweenReps: 5000 // 5 seconds between representatives
};

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
      estimatedCompletion: 'Unknown'
    };
    
    console.log('🌙 Starting conservative overnight ingestion...');
    console.log('⏰ Start time:', results.startTime);
    
    // Extended list of federal representatives for overnight processing
    const federalReps = [
      // Executive Branch
      { name: 'Joe Biden', state: 'Delaware', office: 'President', level: 'federal', bioguideId: 'B000490', fecId: 'P80000722' },
      { name: 'Kamala Harris', state: 'California', office: 'Vice President', level: 'federal', bioguideId: 'H001075', fecId: 'P00009621' },
      
      // Senate Leadership
      { name: 'Chuck Schumer', state: 'New York', office: 'Senator', level: 'federal', bioguideId: 'S000148', fecId: 'S4NY00085' },
      { name: 'Mitch McConnell', state: 'Kentucky', office: 'Senator', level: 'federal', bioguideId: 'M000355', fecId: 'S4KY00012' },
      { name: 'Dick Durbin', state: 'Illinois', office: 'Senator', level: 'federal', bioguideId: 'D000563', fecId: 'S6IL00151' },
      { name: 'John Thune', state: 'South Dakota', office: 'Senator', level: 'federal', bioguideId: 'T000250', fecId: 'S2SD00016' },
      
      // House Leadership
      { name: 'Nancy Pelosi', state: 'California', office: 'Representative', level: 'federal', bioguideId: 'P000197', fecId: 'H8CA05035' },
      { name: 'Kevin McCarthy', state: 'California', office: 'Representative', level: 'federal', bioguideId: 'M001165', fecId: 'H6CA22125' },
      { name: 'Steny Hoyer', state: 'Maryland', office: 'Representative', level: 'federal', bioguideId: 'H000874', fecId: 'H2MD05155' },
      { name: 'Steve Scalise', state: 'Louisiana', office: 'Representative', level: 'federal', bioguideId: 'S001176', fecId: 'H8LA01087' },
      
      // Key Senators
      { name: 'Bernie Sanders', state: 'Vermont', office: 'Senator', level: 'federal', bioguideId: 'S000033', fecId: 'S4VT00033' },
      { name: 'Elizabeth Warren', state: 'Massachusetts', office: 'Senator', level: 'federal', bioguideId: 'W000817', fecId: 'S2MA00170' },
      { name: 'Ted Cruz', state: 'Texas', office: 'Senator', level: 'federal', bioguideId: 'C001098', fecId: 'S2TX00312' },
      { name: 'Marco Rubio', state: 'Florida', office: 'Senator', level: 'federal', bioguideId: 'R000595', fecId: 'S0FL00238' },
      
      // Key Representatives
      { name: 'Alexandria Ocasio-Cortez', state: 'New York', office: 'Representative', level: 'federal', bioguideId: 'O000172', fecId: 'H8NY15148' },
      { name: 'Ilhan Omar', state: 'Minnesota', office: 'Representative', level: 'federal', bioguideId: 'O000173', fecId: 'H8MN05243' },
      { name: 'Rashida Tlaib', state: 'Michigan', office: 'Representative', level: 'federal', bioguideId: 'T000278', fecId: 'H8MI13250' },
      { name: 'Ayanna Pressley', state: 'Massachusetts', office: 'Representative', level: 'federal', bioguideId: 'P000617', fecId: 'H8MA07032' }
    ];
    
    console.log(`📊 Processing ${federalReps.length} federal representatives overnight...`);
    
    for (let i = 0; i < federalReps.length; i++) {
      const rep = federalReps[i];
      
      try {
        console.log(`\n👤 [${i + 1}/${federalReps.length}] Processing ${rep.name} (${rep.office})...`);
        
        // Respect Congress.gov rate limits
        await new Promise(resolve => setTimeout(resolve, OVERNIGHT_LIMITS.congressGov.delay));
        
        const enrichedRep = await pipeline.processRepresentative({
          name: rep.name,
          state: rep.state,
          office: rep.office,
          level: rep.level,
          district: rep.office === 'Representative' ? '1' : undefined,
          bioguideId: rep.bioguideId,
          openstatesId: undefined, // Skip OpenStates due to rate limit
          fecId: rep.fecId,
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
        if (i < federalReps.length - 1) {
          console.log(`⏳ Waiting ${OVERNIGHT_LIMITS.betweenReps / 1000}s before next representative...`);
          await new Promise(resolve => setTimeout(resolve, OVERNIGHT_LIMITS.betweenReps));
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
    
    results.estimatedCompletion = endTime.toISOString();
    
    console.log(`\n🌅 Overnight ingestion completed!`);
    console.log(`⏰ Duration: ${durationMinutes} minutes`);
    console.log(`📊 Results: ${results.successful}/${results.processed} successful`);
    
    return NextResponse.json({
      success: true,
      message: 'Conservative overnight ingestion completed',
      results,
      duration: `${durationMinutes} minutes`,
      rateLimits: OVERNIGHT_LIMITS,
      note: 'Very conservative delays used for safe overnight operation',
      nextRun: 'Can be run again after rate limit reset'
    });
    
  } catch (error) {
    console.error('Overnight ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: `Overnight ingestion failed: ${error}`,
      rateLimits: OVERNIGHT_LIMITS
    }, { status: 500 });
  }
}

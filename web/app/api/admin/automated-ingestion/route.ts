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

// Rate limiting configuration - RESPECT ALL API LIMITS
const RATE_LIMITS = {
  openStates: { daily: 250, perMinute: 10, delay: 6000 }, // 6 second delay
  congressGov: { daily: 5000, perMinute: 100, delay: 600 }, // 1 second delay
  fec: { daily: 1000, perMinute: 60, delay: 1000 }, // 1 second delay
  googleCivic: { daily: 100000, perMinute: 1000, delay: 60 }, // 60ms delay
  legiscan: { daily: 1000, perMinute: 60, delay: 1000 } // 1 second delay
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
      rateLimitRespected: true,
      estimatedCompletionTime: 'Unknown'
    };
    
    console.log('🤖 Starting automated ingestion with rate limit respect...');
    
    // Phase 1: Federal representatives (Congress.gov - high limit)
    console.log('\n📊 Phase 1: Federal Representatives (Congress.gov)');
    const federalReps = [
      { name: 'Joe Biden', state: 'Delaware', office: 'President', level: 'federal', bioguideId: 'B000490', fecId: 'P80000722' },
      { name: 'Kamala Harris', state: 'California', office: 'Vice President', level: 'federal', bioguideId: 'H001075', fecId: 'P00009621' },
      { name: 'Chuck Schumer', state: 'New York', office: 'Senator', level: 'federal', bioguideId: 'S000148', fecId: 'S4NY00085' },
      { name: 'Mitch McConnell', state: 'Kentucky', office: 'Senator', level: 'federal', bioguideId: 'M000355', fecId: 'S4KY00012' },
      { name: 'Nancy Pelosi', state: 'California', office: 'Representative', level: 'federal', bioguideId: 'P000197', fecId: 'H8CA05035' }
    ];
    
    for (const rep of federalReps) {
      try {
        console.log(`  👤 Processing ${rep.name} (${rep.office})...`);
        
        // Respect Congress.gov rate limits
        await new Promise(resolve => setTimeout(resolve, RATE_LIMITS.congressGov.delay));
        
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
        
        // Additional delay between representatives
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (repError) {
        console.error(`❌ Error processing ${rep.name}:`, repError);
        results.failed++;
        results.errors.push(`Error processing ${rep.name}: ${repError}`);
      }
    }
    
    // Phase 2: Enhanced data collection (FEC, Google Civic)
    console.log('\n🔍 Phase 2: Enhanced Data Collection');
    
    // Get existing representatives for enhancement
    const { data: existingReps } = await supabase
      .from('representatives_core')
      .select('*')
      .limit(10);
    
    if (existingReps && existingReps.length > 0) {
      for (const rep of existingReps) {
        try {
          console.log(`  🔄 Enhancing ${rep.name}...`);
          
          // Respect FEC rate limits
          await new Promise(resolve => setTimeout(resolve, RATE_LIMITS.fec.delay));
          
          // Enhanced processing with FEC data
          const enrichedRep = await pipeline.processRepresentative({
            name: rep.name,
            state: rep.state,
            office: rep.office,
            level: rep.level,
            district: rep.district,
            bioguideId: rep.bioguide_id,
            openstatesId: rep.openstates_id,
            fecId: rep.fec_id,
            googleCivicId: rep.google_civic_id,
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
            // Update with enhanced data
            const { error } = await supabase
              .from('representatives_core')
              .update({
                primary_email: enrichedRep.contacts?.find((c: any) => c.type === 'email')?.value || rep.primary_email,
                primary_phone: enrichedRep.contacts?.find((c: any) => c.type === 'phone')?.value || rep.primary_phone,
                primary_website: enrichedRep.contacts?.find((c: any) => c.type === 'website')?.value || rep.primary_website,
                primary_photo_url: enrichedRep.photos?.[0]?.url || rep.primary_photo_url,
                fec_id: enrichedRep.fecId || rep.fec_id,
                google_civic_id: enrichedRep.googleCivicId || rep.google_civic_id,
                data_quality_score: enrichedRep.qualityScore || rep.data_quality_score,
                data_sources: [...(rep.data_sources || []), ...(enrichedRep.dataSources || [])],
                last_updated: new Date().toISOString(),
                verification_status: 'enhanced'
              })
              .eq('id', rep.id);
            
            if (error) {
              console.error(`❌ Enhancement error for ${rep.name}:`, error);
              results.failed++;
            } else {
              console.log(`✅ Enhanced ${rep.name}`);
              results.successful++;
            }
          }
          
          // Additional delay between enhancements
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (enhanceError) {
          console.error(`❌ Error enhancing ${rep.name}:`, enhanceError);
          results.failed++;
          results.errors.push(`Error enhancing ${rep.name}: ${enhanceError}`);
        }
      }
    }
    
    // Calculate estimated completion time
    const totalDelays = (RATE_LIMITS.congressGov.delay * federalReps.length) + 
                       (RATE_LIMITS.fec.delay * (existingReps?.length || 0)) +
                       (2000 * federalReps.length) + 
                       (3000 * (existingReps?.length || 0));
    const estimatedMinutes = Math.ceil(totalDelays / 60000);
    results.estimatedCompletionTime = `${estimatedMinutes} minutes`;
    
    return NextResponse.json({
      success: true,
      message: 'Automated ingestion completed with rate limit respect',
      results,
      rateLimits: RATE_LIMITS,
      note: 'All API rate limits respected - safe for production use',
      nextRun: 'Can be run again after rate limit reset'
    });
    
  } catch (error) {
    console.error('Automated ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: `Automated ingestion failed: ${error}`,
      rateLimits: RATE_LIMITS
    }, { status: 500 });
  }
}

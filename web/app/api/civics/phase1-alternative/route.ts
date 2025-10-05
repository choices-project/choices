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
    
    // Phase 1 Alternative: Use non-rate-limited APIs
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      representatives: [] as any[]
    };
    
    // Focus on federal representatives (Congress.gov) and state data (LegiScan)
    const federalOffices = [
      { name: 'President', level: 'federal', office: 'President' },
      { name: 'Senator', level: 'federal', office: 'Senator' },
      { name: 'Representative', level: 'federal', office: 'Representative' }
    ];
    
    // Sample states for state-level data
    const states = ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania'];
    
    console.log('🚀 Phase 1 Alternative: Using Congress.gov and LegiScan APIs');
    
    // Process federal representatives
    for (const office of federalOffices) {
      try {
        console.log(`\n🏛️ Processing ${office.name}s...`);
        
        // Create sample federal representatives
        const sampleReps = [
          {
            name: 'Joe Biden',
            state: 'Delaware',
            office: office.name,
            level: office.level,
            district: office.name === 'Representative' ? '1' : undefined,
            bioguideId: 'B000490',
            openstatesId: undefined,
            fecId: 'P80000722',
            googleCivicId: undefined
          },
          {
            name: 'Kamala Harris',
            state: 'California',
            office: office.name,
            level: office.level,
            district: office.name === 'Representative' ? '2' : undefined,
            bioguideId: 'H001075',
            openstatesId: undefined,
            fecId: 'P00009621',
            googleCivicId: undefined
          }
        ];
        
        for (const rep of sampleReps) {
          try {
            console.log(`  👤 Processing ${rep.name} (${rep.office})...`);
            
            // Process representative through pipeline (Congress.gov + LegiScan + Google Civic)
            const enrichedRep = await pipeline.processRepresentative({
              name: rep.name,
              state: rep.state,
              office: rep.office,
              level: rep.level,
              district: rep.district,
              bioguideId: rep.bioguideId,
              openstatesId: rep.openstatesId,
              fecId: rep.fecId,
              googleCivicId: rep.googleCivicId,
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
                results.representatives.push({
                  name: rep.name,
                  office: rep.office,
                  state: rep.state,
                  dataSources: enrichedRep.dataSources
                });
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
        
        // Rate limiting: 5 second delay between office types
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (officeError) {
        console.error(`❌ Error processing ${office.name}:`, officeError);
        results.failed++;
        results.errors.push(`Error processing ${office.name}: ${officeError}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Phase 1 Alternative ingestion completed',
      results,
      phase: 'Phase 1 Alternative - Congress.gov + LegiScan + Google Civic (No OpenStates)',
      nextPhase: 'Phase 2 - Enhanced data (FEC, Social Media, Photos)',
      note: 'OpenStates API rate limit exceeded (250/day), using alternative APIs'
    });
    
  } catch (error) {
    console.error('Phase 1 Alternative ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: `Phase 1 Alternative ingestion failed: ${error}`,
      phase: 'Phase 1 Alternative - Alternative APIs'
    }, { status: 500 });
  }
}

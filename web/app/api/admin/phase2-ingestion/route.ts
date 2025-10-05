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
    const authError = await requireServiceKey();
    if (authError) {
      return authError;
    }
    const pipeline = new FreeAPIsPipeline();
    
    // Phase 2: Enhanced data collection for existing representatives
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      enhanced: [] as any[]
    };
    
    // Get all existing representatives from database
    const { data: existingReps, error: fetchError } = await supabase
      .from('representatives_core')
      .select('*')
      .limit(50); // Process in batches
    
    if (fetchError) {
      throw new Error(`Failed to fetch existing representatives: ${fetchError.message}`);
    }
    
    if (!existingReps || existingReps.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No existing representatives found. Run Phase 1 first.',
        phase: 'Phase 2 - Enhanced Data'
      });
    }
    
    console.log(`\n🚀 Phase 2: Enhancing ${existingReps.length} existing representatives...`);
    
    for (const rep of existingReps) {
      try {
        console.log(`\n🔍 Enhancing ${rep.name} (${rep.state})...`);
        
        // Phase 2: Add FEC data, social media, photos, and enhanced fields
        const enrichedRep = await pipeline.processRepresentative({
          name: rep.name,
          state: rep.state,
          office: rep.office,
          level: rep.level,
          district: rep.district,
          bioguideId: rep.bioguide_id,
          openstatesId: rep.openstates_id,
          fecId: rep.fec_id, // Will be populated by FEC API
          googleCivicId: rep.google_civic_id
        });
        
        if (enrichedRep) {
          // Update with enhanced data
          const { error } = await supabase
            .from('representatives_core')
            .update({
              // Enhanced contact info
              primary_email: enrichedRep.contacts?.find(c => c.type === 'email')?.value || rep.primary_email,
              primary_phone: enrichedRep.contacts?.find(c => c.type === 'phone')?.value || rep.primary_phone,
              primary_website: enrichedRep.contacts?.find(c => c.type === 'website')?.value || rep.primary_website,
              primary_photo_url: enrichedRep.photos?.[0]?.url || rep.primary_photo_url,
              
              // Enhanced IDs
              fec_id: enrichedRep.fecId || rep.fec_id,
              google_civic_id: enrichedRep.googleCivicId || rep.google_civic_id,
              legiscan_id: enrichedRep.legiscanId,
              
              // Enhanced data
              twitter_handle: enrichedRep.twitterHandle,
              last_election_date: enrichedRep.lastElectionDate,
              committee_memberships: enrichedRep.committeeMemberships,
              floor_speeches: enrichedRep.floorSpeeches,
              accountability_score: enrichedRep.accountabilityScore,
              
              // Campaign finance (if FEC data available)
              total_receipts: enrichedRep.campaignFinance?.totalReceipts,
              total_disbursements: enrichedRep.campaignFinance?.totalDisbursements,
              cash_on_hand: enrichedRep.campaignFinance?.cashOnHand,
              debt: enrichedRep.campaignFinance?.debt,
              
              // Update metadata
              data_quality_score: enrichedRep.dataQualityScore || rep.data_quality_score,
              data_sources: [...(rep.data_sources || []), ...(enrichedRep.dataSources || [])],
              last_updated: new Date().toISOString(),
              verification_status: 'enhanced'
            })
            .eq('id', rep.id);
          
          if (error) {
            console.error(`❌ Database error for ${rep.name}:`, error);
            results.failed++;
            results.errors.push(`Database error for ${rep.name}: ${error.message}`);
          } else {
            console.log(`✅ Enhanced ${rep.name} with FEC, social media, and accountability data`);
            results.successful++;
            results.enhanced.push({
              name: rep.name,
              state: rep.state,
              newDataSources: enrichedRep.dataSources,
              accountabilityScore: enrichedRep.accountabilityScore
            });
          }
        }
        
        results.processed++;
        
        // Rate limiting: 3 second delay between enhancements
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (repError) {
        console.error(`❌ Error enhancing ${rep.name}:`, repError);
        results.failed++;
        results.errors.push(`Error enhancing ${rep.name}: ${repError}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Phase 2 enhanced data collection completed',
      results,
      phase: 'Phase 2 - Enhanced Data (FEC, Social Media, Photos, Accountability)',
      summary: {
        totalProcessed: results.processed,
        successfullyEnhanced: results.successful,
        failed: results.failed,
        newDataSources: results.enhanced.map(e => e.newDataSources).flat(),
        accountabilityScores: results.enhanced.map(e => e.accountabilityScore).filter(Boolean)
      }
    });
    
  } catch (error) {
    console.error('Phase 2 ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: `Phase 2 ingestion failed: ${error}`,
      phase: 'Phase 2 - Enhanced Data'
    }, { status: 500 });
  }
}

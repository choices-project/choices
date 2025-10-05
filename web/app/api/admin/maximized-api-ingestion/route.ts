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
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      apiStats: {
        openStates: { called: 0, successful: 0, rateLimited: false },
        congressGov: { called: 0, successful: 0, rateLimited: false },
        fec: { called: 0, successful: 0, rateLimited: false },
        googleCivic: { called: 0, successful: 0, rateLimited: false },
        legiscan: { called: 0, successful: 0, rateLimited: false }
      },
      dataCollected: {
        contacts: 0,
        socialMedia: 0,
        photos: 0,
        activity: 0,
        committees: 0,
        bills: 0,
        campaignFinance: 0
      },
      errors: [] as string[],
      startTime: new Date().toISOString()
    };
    
    console.log('🚀 Starting MAXIMIZED API ingestion...');
    console.log('⏰ Start time:', results.startTime);
    console.log('🎯 Goal: Maximize data collection from all functional APIs');
    
    // Get representatives to process (mix of federal and state)
    const { data: representatives, error: fetchError } = await supabase
      .from('representatives_core')
      .select('id, name, state, office, level, district, bioguide_id, openstates_id, fec_id, google_civic_id')
      .limit(10); // Process 10 representatives for comprehensive testing
    
    if (fetchError) {
      throw new Error(`Failed to fetch representatives: ${fetchError.message}`);
    }
    
    if (!representatives || representatives.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No representatives found to process'
      });
    }
    
    console.log(`📊 Processing ${representatives.length} representatives with MAXIMIZED API approach`);
    
    for (const rep of representatives) {
      try {
        console.log(`\n👤 Processing ${rep.name} (${rep.office}, ${rep.state})...`);
        
        // Track API usage for this representative
        const repApiStats = {
          openStates: false,
          congressGov: false,
          fec: false,
          googleCivic: false,
          legiscan: false
        };
        
        // Process representative through pipeline with comprehensive data collection
        const enrichedRep = await pipeline.processRepresentative({
          name: rep.name,
          state: rep.state,
          office: rep.office,
          level: rep.level as 'federal' | 'state' | 'local',
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
          // Track which APIs were used
          if (enrichedRep.dataSources?.includes('openstates')) {
            repApiStats.openStates = true;
            results.apiStats.openStates.called++;
            results.apiStats.openStates.successful++;
          }
          if (enrichedRep.dataSources?.includes('congress-gov')) {
            repApiStats.congressGov = true;
            results.apiStats.congressGov.called++;
            results.apiStats.congressGov.successful++;
          }
          if (enrichedRep.dataSources?.includes('fec')) {
            repApiStats.fec = true;
            results.apiStats.fec.called++;
            results.apiStats.fec.successful++;
          }
          if (enrichedRep.dataSources?.includes('google-civic')) {
            repApiStats.googleCivic = true;
            results.apiStats.googleCivic.called++;
            results.apiStats.googleCivic.successful++;
          }
          if (enrichedRep.dataSources?.includes('legiscan')) {
            repApiStats.legiscan = true;
            results.apiStats.legiscan.called++;
            results.apiStats.legiscan.successful++;
          }
          
          // Extract primary contact information
          const primaryEmail = enrichedRep.contacts?.find((c: any) => c.type === 'email' && c.isVerified)?.value;
          const primaryPhone = enrichedRep.contacts?.find((c: any) => c.type === 'phone' && c.isVerified)?.value;
          const primaryWebsite = enrichedRep.contacts?.find((c: any) => c.type === 'website' && c.isVerified)?.value;
          const primaryPhoto = enrichedRep.photos?.[0]?.url;
          
          // 1. Update primary data in representatives_core
          const { error: coreError } = await supabase
            .from('representatives_core')
            .update({
              primary_email: primaryEmail,
              primary_phone: primaryPhone,
              primary_website: primaryWebsite,
              primary_photo_url: primaryPhoto,
              data_quality_score: enrichedRep.qualityScore || 0,
              data_sources: enrichedRep.dataSources || [],
              last_verified: new Date().toISOString(),
              verification_status: 'verified',
              // Enhanced fields
              twitter_handle: enrichedRep.twitterHandle,
              facebook_url: enrichedRep.facebookUrl,
              instagram_handle: enrichedRep.instagramHandle,
              linkedin_url: enrichedRep.linkedinUrl,
              youtube_channel: enrichedRep.youtubeChannel,
              legiscan_id: enrichedRep.legiscanId,
              wikipedia_url: enrichedRep.wikipediaUrl,
              ballotpedia_url: enrichedRep.ballotpediaUrl,
              congress_gov_id: enrichedRep.congressGovId,
              govinfo_id: enrichedRep.govInfoId,
              last_election_date: enrichedRep.lastElectionDate?.toISOString(),
              next_election_date: enrichedRep.nextElectionDate?.toISOString(),
              term_start_date: enrichedRep.termStartDate?.toISOString(),
              term_end_date: enrichedRep.termEndDate?.toISOString(),
              upcoming_elections: enrichedRep.upcomingElections,
              committee_memberships: enrichedRep.committeeMemberships,
              caucus_memberships: enrichedRep.caucusMemberships,
              leadership_positions: enrichedRep.leadershipPositions,
              official_website: enrichedRep.officialWebsite,
              campaign_website: enrichedRep.campaignWebsite,
              office_locations: enrichedRep.officeLocations,
              recent_activity: enrichedRep.recentActivity,
              recent_votes: enrichedRep.recentVotes,
              recent_bills: enrichedRep.recentBills,
              floor_speeches: enrichedRep.floorSpeeches,
              committee_statements: enrichedRep.committeeStatements,
              official_press_releases: enrichedRep.officialPressReleases,
              voting_explanations: enrichedRep.votingExplanations,
              social_media_statements: enrichedRep.socialMediaStatements,
              recent_tweets: enrichedRep.recentTweets,
              facebook_posts: enrichedRep.facebookPosts,
              instagram_posts: enrichedRep.instagramPosts,
              statement_vs_vote_analysis: enrichedRep.statementVsVoteAnalysis,
              campaign_promises_vs_actions: enrichedRep.campaignPromisesVsActions,
              constituent_feedback_alignment: enrichedRep.constituentFeedbackAlignment,
              accountability_score: enrichedRep.accountabilityScore,
              // Campaign finance data
              total_receipts: enrichedRep.campaignFinance?.totalReceipts,
              total_disbursements: enrichedRep.campaignFinance?.totalDisbursements,
              cash_on_hand: enrichedRep.campaignFinance?.cashOnHand,
              debt: enrichedRep.campaignFinance?.debt,
              individual_contributions: enrichedRep.campaignFinance?.individualContributions,
              pac_contributions: enrichedRep.campaignFinance?.pacContributions,
              party_contributions: enrichedRep.campaignFinance?.partyContributions,
              self_financing: enrichedRep.campaignFinance?.selfFinancing,
              total_contributions: enrichedRep.campaignFinance?.totalContributions,
              fec_last_updated: enrichedRep.campaignFinance?.lastUpdated?.toISOString()
            })
            .eq('id', rep.id);
          
          if (coreError) {
            console.error(`❌ Core update error for ${rep.name}:`, coreError);
            results.failed++;
            results.errors.push(`Core update error for ${rep.name}: ${coreError.message}`);
            continue;
          }
          
          // 2. Store detailed contacts (hybrid approach)
          if (enrichedRep.contacts && enrichedRep.contacts.length > 0) {
            const contactInserts = enrichedRep.contacts.map((contact: any) => ({
              representative_id: rep.id,
              type: contact.type,
              value: contact.value,
              label: contact.label || null,
              is_primary: contact.isPrimary || false,
              is_verified: contact.isVerified || false,
              source: contact.source || 'pipeline',
              last_verified: contact.isVerified ? new Date().toISOString() : null
            }));
            
            const { error: contactsError } = await supabase
              .from('representative_contacts')
              .upsert(contactInserts, { onConflict: 'representative_id,type,value' });
            
            if (!contactsError) {
              results.dataCollected.contacts += contactInserts.length;
            }
          }
          
          // 3. Store detailed social media
          if (enrichedRep.socialMedia && enrichedRep.socialMedia.length > 0) {
            const socialInserts = enrichedRep.socialMedia.map((social: any) => ({
              representative_id: rep.id,
              platform: social.platform,
              handle: social.handle,
              url: social.url || null,
              followers_count: social.followersCount || 0,
              is_verified: social.isVerified || false,
              source: social.source || 'pipeline'
            }));
            
            const { error: socialError } = await supabase
              .from('representative_social_media')
              .upsert(socialInserts, { onConflict: 'representative_id,platform,handle' });
            
            if (!socialError) {
              results.dataCollected.socialMedia += socialInserts.length;
            }
          }
          
          // 4. Store detailed photos (max 2 per person)
          if (enrichedRep.photos && enrichedRep.photos.length > 0) {
            const topPhotos = enrichedRep.photos.slice(0, 2);
            const photoInserts = topPhotos.map((photo: any, index: number) => ({
              representative_id: rep.id,
              url: photo.url,
              source: photo.source || 'pipeline',
              quality: photo.quality || 'medium',
              is_primary: index === 0,
              width: photo.width || null,
              height: photo.height || null,
              alt_text: null
            }));
            
            const { error: photosError } = await supabase
              .from('representative_photos')
              .upsert(photoInserts, { onConflict: 'representative_id' });
            
            if (!photosError) {
              results.dataCollected.photos += photoInserts.length;
            }
          }
          
          // 5. Store activity data
          if (enrichedRep.activity && enrichedRep.activity.length > 0) {
            const activityInserts = enrichedRep.activity.map((activity: any) => ({
              representative_id: rep.id,
              type: activity.type,
              title: activity.title,
              description: activity.description || null,
              date: activity.date,
              source: activity.source || 'pipeline',
              url: activity.url || null,
              metadata: activity.metadata || null
            }));
            
            const { error: activityError } = await supabase
              .from('representative_activity')
              .upsert(activityInserts, { onConflict: 'representative_id,type,title,date' });
            
            if (!activityError) {
              results.dataCollected.activity += activityInserts.length;
            }
          }
          
          console.log(`✅ Successfully processed ${rep.name} with APIs:`, Object.keys(repApiStats).filter(api => repApiStats[api as keyof typeof repApiStats]));
          results.successful++;
        }
        
        results.processed++;
        
        // Conservative delay between representatives
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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
    
    console.log(`\n🚀 MAXIMIZED API ingestion completed!`);
    console.log(`⏰ Duration: ${durationMinutes} minutes`);
    console.log(`📊 Results: ${results.successful}/${results.processed} successful`);
    console.log(`📈 API Usage:`, results.apiStats);
    console.log(`📋 Data Collected:`, results.dataCollected);
    
    return NextResponse.json({
      success: true,
      message: 'MAXIMIZED API ingestion completed',
      results,
      duration: `${durationMinutes} minutes`,
      approach: 'Comprehensive - All functional APIs maximized for maximum data collection',
      benefits: [
        'Single Congress.gov call per representative (no over-collection)',
        'FEC data for federal representatives only',
        'OpenStates for state representatives when available',
        'Google Civic for election data',
        'LegiScan for legislation data',
        'Hybrid storage - primary data in main table, detailed data in separate tables',
        'Top 2 photos per person',
        'Comprehensive contact and social media data',
        'Activity and campaign finance tracking'
      ],
      apiEfficiency: {
        congressGov: `${results.apiStats.congressGov.successful}/${results.apiStats.congressGov.called} calls successful`,
        fec: `${results.apiStats.fec.successful}/${results.apiStats.fec.called} calls successful`,
        openStates: `${results.apiStats.openStates.successful}/${results.apiStats.openStates.called} calls successful`,
        googleCivic: `${results.apiStats.googleCivic.successful}/${results.apiStats.googleCivic.called} calls successful`,
        legiscan: `${results.apiStats.legiscan.successful}/${results.apiStats.legiscan.called} calls successful`
      }
    });
    
  } catch (error) {
    console.error('MAXIMIZED API ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: `MAXIMIZED API ingestion failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

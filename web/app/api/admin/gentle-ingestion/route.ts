import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { state } = await request.json();
    
    if (!state) {
      return NextResponse.json({ error: 'State parameter required' }, { status: 400 });
    }

    console.log(`🐌 Starting gentle ingestion for ${state}...`);
    
    // Get OpenStates data for the specific state
    const openStatesApiKey = process.env.OPEN_STATES_API_KEY;
    if (!openStatesApiKey) {
      return NextResponse.json({ error: 'OpenStates API key not configured' }, { status: 500 });
    }
    
    console.log(`📊 Fetching data for ${state}...`);
    
    // Wait 60 seconds before making the API call to respect rate limits
    console.log('⏳ Waiting 60 seconds to respect rate limits...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    const response = await fetch(
      `https://v3.openstates.org/people?jurisdiction=${state}`,
      {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Choices-Civics-Platform/1.0',
          'X-API-KEY': openStatesApiKey
        }
      }
    );
    
    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limited - please wait before trying again',
          status: 429,
          retryAfter: 60
        }, { status: 429 });
      }
      return NextResponse.json({ 
        error: `OpenStates API request failed: ${response.status}` 
      }, { status: response.status });
    }
    
    const openStatesData = await response.json();
    const legislators = openStatesData.results || [];
    
    console.log(`📊 Found ${legislators.length} legislators for ${state}`);
    
    if (legislators.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: `No legislators found for ${state}`,
        representatives: 0
      });
    }
    
    // Process each legislator with delays
    let processedCount = 0;
    let successCount = 0;
    
    for (const legislator of legislators) { // Process ALL legislators
      try {
        console.log(`🔄 Processing ${legislator.name}...`);
        
        // Wait 30 seconds between each legislator
        if (processedCount > 0) {
          console.log('⏳ Waiting 30 seconds before next legislator...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
        
        // Use full pipeline for comprehensive data enrichment
        const pipeline = new FreeAPIsPipeline();
        
        const representativeData = {
          name: legislator.name,
          party: legislator.party,
          office: legislator.chamber || 'legislator',
          level: 'state' as const,
          state: state,
          district: legislator.district,
          openstatesId: legislator.id,
          contacts: [],
          socialMedia: [],
          photos: [],
          activity: [],
          dataSources: ['openstates'],
          qualityScore: 0,
          lastUpdated: new Date()
        };
        
        console.log(`🔄 Processing ${legislator.name} with full pipeline...`);
        const enrichedRep = await pipeline.processRepresentative(representativeData);
        
        // Extract primary contact information
        const primaryEmail = enrichedRep.contacts?.find(c => c.type === 'email' && c.isVerified)?.value ||
                            enrichedRep.contacts?.find(c => c.type === 'email')?.value;
        const primaryPhone = enrichedRep.contacts?.find(c => c.type === 'phone' && c.isVerified)?.value ||
                            enrichedRep.contacts?.find(c => c.type === 'phone')?.value;
        const primaryWebsite = enrichedRep.contacts?.find(c => c.type === 'website' && c.isVerified)?.value ||
                              enrichedRep.contacts?.find(c => c.type === 'website')?.value;
        const primaryPhoto = enrichedRep.photos?.find(p => p.isPrimary)?.url ||
                            enrichedRep.photos?.[0]?.url;
        
        const finalData = {
          // Basic fields
          name: enrichedRep.name || legislator.name,
          party: enrichedRep.party || legislator.party,
          office: legislator.chamber || 'legislator',
          level: 'state',
          state: state,
          district: legislator.district,
          
          // Primary identifiers
          bioguide_id: enrichedRep.bioguideId,
          openstates_id: enrichedRep.openstatesId || legislator.id,
          fec_id: enrichedRep.fecId,
          google_civic_id: enrichedRep.googleCivicId,
          legiscan_id: enrichedRep.legiscanId,
          congress_gov_id: enrichedRep.congressGovId,
          govinfo_id: enrichedRep.govinfoId,
          wikipedia_url: enrichedRep.wikipediaUrl,
          ballotpedia_url: enrichedRep.ballotpediaUrl,
          
          // Social media handles
          twitter_handle: enrichedRep.twitterHandle,
          facebook_url: enrichedRep.facebookUrl,
          instagram_handle: enrichedRep.instagramHandle,
          linkedin_url: enrichedRep.linkedinUrl,
          youtube_channel: enrichedRep.youtubeChannel,
          
          // Primary contact information
          primary_email: primaryEmail,
          primary_phone: primaryPhone,
          primary_website: primaryWebsite,
          primary_photo_url: primaryPhoto,
          
          // Election data
          last_election_date: enrichedRep.lastElectionDate?.toISOString(),
          next_election_date: enrichedRep.nextElectionDate?.toISOString(),
          term_start_date: enrichedRep.termStartDate?.toISOString(),
          term_end_date: enrichedRep.termEndDate?.toISOString(),
          upcoming_elections: enrichedRep.upcomingElections,
          
          // Committee and leadership data
          committee_memberships: enrichedRep.committeeMemberships,
          caucus_memberships: enrichedRep.caucusMemberships,
          leadership_positions: enrichedRep.leadershipPositions,
          
          // Enhanced contact information
          official_website: enrichedRep.officialWebsite,
          campaign_website: enrichedRep.campaignWebsite,
          office_locations: enrichedRep.officeLocations,
          
          // Activity tracking
          recent_activity: enrichedRep.recentActivity,
          recent_votes: enrichedRep.recentVotes,
          recent_bills: enrichedRep.recentBills,
          
          // Accountability tracking
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
          
          // Metadata
          active: true,
          data_quality_score: enrichedRep.qualityScore || 50,
          last_updated: new Date(),
          created_at: new Date(),
          data_sources: enrichedRep.dataSources || ['openstates'],
          last_verified: new Date(),
          verification_status: 'unverified'
        };
        
        const { error } = await supabase
          .from('representatives_core')
          .upsert(finalData, { 
            onConflict: 'name,state,office' 
          });
        
        if (error) {
          console.error(`❌ Failed to save ${legislator.name}:`, error);
        } else {
          console.log(`✅ Saved ${legislator.name} with ${enrichedRep.contacts?.length || 0} contacts, ${enrichedRep.photos?.length || 0} photos`);
          successCount++;
        }
        
        processedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to process ${legislator.name}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      state,
      processed: processedCount,
      successful: successCount,
      message: `Gentle ingestion completed for ${state}`
    });
    
  } catch (error) {
    console.error('❌ Gentle ingestion failed:', error);
    return NextResponse.json({ 
      error: 'Gentle ingestion failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

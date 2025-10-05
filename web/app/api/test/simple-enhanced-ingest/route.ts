import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const pipeline = new FreeAPIsPipeline();
    
    // Create a simple test representative
    const testRep = {
      id: 'test-enhanced-1',
      name: 'Test Enhanced Representative',
      party: 'Democratic',
      office: 'Assembly',
      level: 'state' as const,
      state: 'California',
      district: '1',
      contacts: [],
      socialMedia: [],
      photos: [],
      activity: [],
      dataSources: ['test'],
      qualityScore: 0,
      lastUpdated: new Date()
    };

    console.log('🧪 Testing enhanced ingestion with simple data...');
    
    // Process with enhanced pipeline
    const enrichedRep = await pipeline.processRepresentative(testRep);
    
    // Extract enhanced fields
    const primaryEmail = enrichedRep.contacts?.find(c => c.type === 'email' && c.isVerified)?.value ||
                        enrichedRep.contacts?.find(c => c.type === 'email')?.value;
    const primaryPhone = enrichedRep.contacts?.find(c => c.type === 'phone' && c.isVerified)?.value ||
                        enrichedRep.contacts?.find(c => c.type === 'phone')?.value;
    const primaryWebsite = enrichedRep.contacts?.find(c => c.type === 'website' && c.isVerified)?.value ||
                          enrichedRep.contacts?.find(c => c.type === 'website')?.value;
    const primaryPhoto = enrichedRep.photos?.find(p => p.isPrimary)?.url ||
                        enrichedRep.photos?.[0]?.url;

    // Store with enhanced schema
    const { error } = await supabase
      .from('representatives_core')
      .upsert({
        // Basic fields
        name: enrichedRep.name,
        party: enrichedRep.party,
        office: enrichedRep.office,
        level: enrichedRep.level,
        state: enrichedRep.state,
        district: enrichedRep.district,
        
        // Primary identifiers
        openstates_id: enrichedRep.openstatesId,
        bioguide_id: enrichedRep.bioguideId,
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
        data_quality_score: enrichedRep.qualityScore,
        data_sources: enrichedRep.dataSources,
        last_updated: new Date().toISOString(),
        active: true
      }, {
        onConflict: 'id'
      });

    if (error) {
      return NextResponse.json({ 
        error: `Failed to save enhanced data: ${error.message}`,
        status: 'failed'
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Enhanced ingestion test completed',
      data: {
        enriched: {
          name: enrichedRep.name,
          primaryEmail,
          primaryPhone,
          primaryWebsite,
          primaryPhoto,
          twitterHandle: enrichedRep.twitterHandle,
          facebookUrl: enrichedRep.facebookUrl,
          accountabilityScore: enrichedRep.accountabilityScore,
          dataSources: enrichedRep.dataSources,
          qualityScore: enrichedRep.qualityScore
        },
        contacts: enrichedRep.contacts?.length || 0,
        socialMedia: enrichedRep.socialMedia?.length || 0,
        photos: enrichedRep.photos?.length || 0,
        activity: enrichedRep.activity?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `Enhanced ingestion test failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}

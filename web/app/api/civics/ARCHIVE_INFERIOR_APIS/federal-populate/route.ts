import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state') || 'all';
    const chamber = searchParams.get('chamber') || 'both'; // 'house', 'senate', or 'both'
    const clear = searchParams.get('clear') === 'true';

    console.log(`🚀 Starting federal representative population for ${state} (${chamber})...`);

    // Clear existing federal data if requested
    if (clear) {
      console.log('🗑️  Clearing existing federal representatives...');
      const { error: deleteError } = await supabase
        .from('representatives_core')
        .delete()
        .eq('level', 'federal');
      
      if (deleteError) {
        console.error('❌ Error clearing federal data:', deleteError);
        return NextResponse.json({ error: 'Failed to clear federal data' }, { status: 500 });
      }
      console.log('✅ Cleared existing federal representatives');
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      representatives: [] as any[]
    };

    // Get federal representatives from Congress.gov API
    const federalReps = await getFederalRepresentatives(state, chamber);
    console.log(`📊 Found ${federalReps.length} federal representatives`);

    for (const rep of federalReps) {
      try {
        results.processed++;
        console.log(`\n🔄 Processing federal representative ${results.processed}/${federalReps.length}: ${rep.name}`);

        // Prepare data for database storage
        const representativeData = {
          name: rep.name,
          party: rep.party,
          office: rep.office,
          level: 'federal',
          state: rep.state,
          district: rep.district,
          bioguide_id: rep.bioguideId,
          openstates_id: null, // Federal reps don't have OpenStates IDs
          fec_id: rep.fecId,
          google_civic_id: null,
          legiscan_id: null,
          congress_gov_id: rep.bioguideId,
          govinfo_id: rep.govinfoId,
          wikipedia_url: rep.wikipediaUrl,
          ballotpedia_url: rep.ballotpediaUrl,
          twitter_handle: rep.twitterHandle,
          facebook_url: rep.facebookUrl,
          instagram_handle: rep.instagramHandle,
          linkedin_url: rep.linkedinUrl,
          youtube_channel: rep.youtubeChannel,
          primary_email: rep.primaryEmail,
          primary_phone: rep.primaryPhone,
          primary_website: rep.primaryWebsite,
          primary_photo_url: rep.primaryPhotoUrl,
          data_quality_score: 85, // High quality for federal data
          data_sources: ['congress-gov'],
          last_verified: new Date().toISOString(),
          verification_status: 'verified',
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          // Enhanced data
          enhanced_contacts: rep.contacts || [],
          enhanced_photos: rep.photos || [],
          enhanced_activity: rep.activity || [],
          enhanced_social_media: rep.socialMedia || []
        };

        // Check if representative already exists
        const { data: existing } = await supabase
          .from('representatives_core')
          .select('id')
          .eq('bioguide_id', rep.bioguideId)
          .maybeSingle();

        if (existing) {
          // Update existing
          console.log(`      🔄 Updating existing federal representative: ${rep.name}`);
          const { error } = await supabase
            .from('representatives_core')
            .update(representativeData)
            .eq('id', existing.id);
          
          if (error) {
            console.error(`      ❌ DATABASE ERROR for ${rep.name}:`, error);
            throw error;
          }
          console.log(`      ✅ Updated ${rep.name} in database`);
        } else {
          // Insert new
          console.log(`      ➕ Inserting new federal representative: ${rep.name}`);
          const { error } = await supabase
            .from('representatives_core')
            .insert(representativeData);
          
          if (error) {
            console.error(`      ❌ DATABASE ERROR for ${rep.name}:`, error);
            throw error;
          }
          console.log(`      ✅ Inserted ${rep.name} into database`);
        }

        results.representatives.push({
          name: rep.name,
          office: rep.office,
          state: rep.state,
          district: rep.district,
          party: rep.party
        });

        results.successful++;
        console.log(`      ✅ Successfully processed ${rep.name} (${results.successful}/${results.processed} successful)`);

      } catch (error) {
        console.error(`      ❌ Error processing ${rep.name}:`, error);
        results.failed++;
      }
    }

    console.log(`\n🎉 Federal representative population completed!`);
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Successful: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);

    return NextResponse.json({
      success: true,
      message: `Federal representative population completed for ${state} (${chamber})`,
      results,
      state,
      chamber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in federal representative population:', error);
    return NextResponse.json(
      { error: 'Failed to populate federal representatives' },
      { status: 500 }
    );
  }
}

/**
 * Get federal representatives from Congress.gov API
 */
async function getFederalRepresentatives(state: string, chamber: string): Promise<any[]> {
  const representatives: any[] = [];
  
  try {
    const apiKey = process.env.CONGRESS_GOV_API_KEY;
    if (!apiKey) {
      throw new Error('Congress.gov API key not configured');
    }

    console.log(`🔍 Fetching federal representatives from Congress.gov API...`);
    console.log(`   State: ${state}`);
    console.log(`   Chamber: ${chamber}`);

    // Get current Congress (118th)
    const currentCongress = 118;
    
    // Get House representatives
    if (chamber === 'both' || chamber === 'house') {
      console.log(`📊 Fetching House representatives...`);
      const houseUrl = state === 'all' 
        ? `https://api.congress.gov/v3/member?chamber=house&congress=${currentCongress}&limit=500&api_key=${apiKey}`
        : `https://api.congress.gov/v3/member?chamber=house&congress=${currentCongress}&state=${state}&limit=500&api_key=${apiKey}`;
      
      const houseResponse = await fetch(houseUrl);
      if (houseResponse.ok) {
        const houseData = await houseResponse.json();
        console.log(`   Found ${houseData.members?.length || 0} House representatives`);
        
        for (const member of houseData.members || []) {
          representatives.push({
            name: member.fullName,
            party: member.party,
            office: 'U.S. House of Representatives',
            level: 'federal',
            state: member.state,
            district: member.district,
            bioguideId: member.bioguideId,
            fecId: member.fecCandidateId,
            govinfoId: member.govinfoId,
            wikipediaUrl: member.wikipediaUrl,
            ballotpediaUrl: member.ballotpediaUrl,
            twitterHandle: member.twitterAccount,
            facebookUrl: member.facebookAccount,
            instagramHandle: member.instagramAccount,
            linkedinUrl: member.linkedinAccount,
            youtubeChannel: member.youtubeAccount,
            primaryEmail: member.email,
            primaryPhone: member.phone,
            primaryWebsite: member.url,
            primaryPhotoUrl: member.depiction?.imageUrl,
            contacts: [
              ...(member.email ? [{ type: 'email', value: member.email, source: 'congress-gov' }] : []),
              ...(member.phone ? [{ type: 'phone', value: member.phone, source: 'congress-gov' }] : []),
              ...(member.url ? [{ type: 'website', value: member.url, source: 'congress-gov' }] : [])
            ],
            photos: member.depiction?.imageUrl ? [{
              url: member.depiction.imageUrl,
              source: 'congress-gov',
              altText: `Photo of ${member.fullName}`,
              attribution: 'Congress.gov'
            }] : [],
            activity: [
              ...(member.roles ? member.roles.map((role: any) => ({
                type: 'congressional_role',
                title: `${role.title} - ${role.chamber}`,
                description: `Congressional role: ${role.title}`,
                date: role.startDate,
                source: 'congress-gov'
              })) : [])
            ],
            socialMedia: [
              ...(member.twitterAccount ? [{ platform: 'twitter', handle: member.twitterAccount, url: `https://twitter.com/${member.twitterAccount}`, verified: true, source: 'congress-gov' }] : []),
              ...(member.facebookAccount ? [{ platform: 'facebook', handle: member.facebookAccount, url: `https://facebook.com/${member.facebookAccount}`, verified: true, source: 'congress-gov' }] : []),
              ...(member.instagramAccount ? [{ platform: 'instagram', handle: member.instagramAccount, url: `https://instagram.com/${member.instagramAccount}`, verified: true, source: 'congress-gov' }] : [])
            ]
          });
        }
      }
    }

    // Get Senate representatives
    if (chamber === 'both' || chamber === 'senate') {
      console.log(`📊 Fetching Senate representatives...`);
      const senateUrl = state === 'all' 
        ? `https://api.congress.gov/v3/member?chamber=senate&congress=${currentCongress}&limit=100&api_key=${apiKey}`
        : `https://api.congress.gov/v3/member?chamber=senate&congress=${currentCongress}&state=${state}&limit=100&api_key=${apiKey}`;
      
      const senateResponse = await fetch(senateUrl);
      if (senateResponse.ok) {
        const senateData = await senateResponse.json();
        console.log(`   Found ${senateData.members?.length || 0} Senate representatives`);
        
        for (const member of senateData.members || []) {
          representatives.push({
            name: member.fullName,
            party: member.party,
            office: 'U.S. Senate',
            level: 'federal',
            state: member.state,
            district: null, // Senators don't have districts
            bioguideId: member.bioguideId,
            fecId: member.fecCandidateId,
            govinfoId: member.govinfoId,
            wikipediaUrl: member.wikipediaUrl,
            ballotpediaUrl: member.ballotpediaUrl,
            twitterHandle: member.twitterAccount,
            facebookUrl: member.facebookAccount,
            instagramHandle: member.instagramAccount,
            linkedinUrl: member.linkedinAccount,
            youtubeChannel: member.youtubeAccount,
            primaryEmail: member.email,
            primaryPhone: member.phone,
            primaryWebsite: member.url,
            primaryPhotoUrl: member.depiction?.imageUrl,
            contacts: [
              ...(member.email ? [{ type: 'email', value: member.email, source: 'congress-gov' }] : []),
              ...(member.phone ? [{ type: 'phone', value: member.phone, source: 'congress-gov' }] : []),
              ...(member.url ? [{ type: 'website', value: member.url, source: 'congress-gov' }] : [])
            ],
            photos: member.depiction?.imageUrl ? [{
              url: member.depiction.imageUrl,
              source: 'congress-gov',
              altText: `Photo of ${member.fullName}`,
              attribution: 'Congress.gov'
            }] : [],
            activity: [
              ...(member.roles ? member.roles.map((role: any) => ({
                type: 'congressional_role',
                title: `${role.title} - ${role.chamber}`,
                description: `Congressional role: ${role.title}`,
                date: role.startDate,
                source: 'congress-gov'
              })) : [])
            ],
            socialMedia: [
              ...(member.twitterAccount ? [{ platform: 'twitter', handle: member.twitterAccount, url: `https://twitter.com/${member.twitterAccount}`, verified: true, source: 'congress-gov' }] : []),
              ...(member.facebookAccount ? [{ platform: 'facebook', handle: member.facebookAccount, url: `https://facebook.com/${member.facebookAccount}`, verified: true, source: 'congress-gov' }] : []),
              ...(member.instagramAccount ? [{ platform: 'instagram', handle: member.instagramAccount, url: `https://instagram.com/${member.instagramAccount}`, verified: true, source: 'congress-gov' }] : [])
            ]
          });
        }
      }
    }

    console.log(`✅ Successfully fetched ${representatives.length} federal representatives`);
    return representatives;

  } catch (error) {
    console.error('❌ Error fetching federal representatives:', error);
    throw error;
  }
}

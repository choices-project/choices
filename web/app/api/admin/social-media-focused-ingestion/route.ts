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
      socialMediaCollected: {
        twitter: 0,
        facebook: 0,
        instagram: 0,
        linkedin: 0,
        youtube: 0,
        other: 0
      },
      totalSocialLinks: 0,
      errors: [] as string[],
      startTime: new Date().toISOString()
    };
    
    console.log('📱 Starting SOCIAL MEDIA FOCUSED ingestion...');
    console.log('⏰ Start time:', results.startTime);
    console.log('🎯 Goal: Collect ALL available social media links for every candidate');
    
    // Get representatives to process
    const { data: representatives, error: fetchError } = await supabase
      .from('representatives_core')
      .select('id, name, state, office, level, district, bioguide_id, openstates_id, fec_id, google_civic_id')
      .limit(20); // Process 20 representatives for social media focus
    
    if (fetchError) {
      throw new Error(`Failed to fetch representatives: ${fetchError.message}`);
    }
    
    if (!representatives || representatives.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No representatives found to process'
      });
    }
    
    console.log(`📊 Processing ${representatives.length} representatives for SOCIAL MEDIA collection`);
    
    for (const rep of representatives) {
      try {
        console.log(`\n👤 Collecting social media for ${rep.name} (${rep.office}, ${rep.state})...`);
        
        // Process representative through pipeline with focus on social media
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
        
        if (enrichedRep && enrichedRep.socialMedia && enrichedRep.socialMedia.length > 0) {
          console.log(`📱 Found ${enrichedRep.socialMedia.length} social media links for ${rep.name}`);
          
          // Store detailed social media in representative_social_media table
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
          
          if (socialError) {
            console.error(`❌ Social media error for ${rep.name}:`, socialError);
            results.failed++;
            results.errors.push(`Social media error for ${rep.name}: ${socialError.message}`);
            continue;
          }
          
          // Count social media by platform
          enrichedRep.socialMedia.forEach((social: any) => {
            const platform = social.platform?.toLowerCase();
            if (platform === 'twitter') results.socialMediaCollected.twitter++;
            else if (platform === 'facebook') results.socialMediaCollected.facebook++;
            else if (platform === 'instagram') results.socialMediaCollected.instagram++;
            else if (platform === 'linkedin') results.socialMediaCollected.linkedin++;
            else if (platform === 'youtube') results.socialMediaCollected.youtube++;
            else results.socialMediaCollected.other++;
            
            results.totalSocialLinks++;
          });
          
          // Update primary social media fields in representatives_core
          const primaryTwitter = enrichedRep.socialMedia.find(s => s.platform?.toLowerCase() === 'twitter');
          const primaryFacebook = enrichedRep.socialMedia.find(s => s.platform?.toLowerCase() === 'facebook');
          const primaryInstagram = enrichedRep.socialMedia.find(s => s.platform?.toLowerCase() === 'instagram');
          const primaryLinkedIn = enrichedRep.socialMedia.find(s => s.platform?.toLowerCase() === 'linkedin');
          const primaryYouTube = enrichedRep.socialMedia.find(s => s.platform?.toLowerCase() === 'youtube');
          
          const { error: updateError } = await supabase
            .from('representatives_core')
            .update({
              twitter_handle: primaryTwitter?.handle || null,
              facebook_url: primaryFacebook?.url || null,
              instagram_handle: primaryInstagram?.handle || null,
              linkedin_url: primaryLinkedIn?.url || null,
              youtube_channel: primaryYouTube?.handle || null,
              data_sources: enrichedRep.dataSources || [],
              last_verified: new Date().toISOString()
            })
            .eq('id', rep.id);
          
          if (updateError) {
            console.error(`❌ Update error for ${rep.name}:`, updateError);
            results.errors.push(`Update error for ${rep.name}: ${updateError.message}`);
          } else {
            console.log(`✅ Successfully collected social media for ${rep.name}:`, 
              enrichedRep.socialMedia.map(s => `${s.platform}: ${s.handle || s.url}`).join(', '));
            results.successful++;
          }
        } else {
          console.log(`❌ No social media found for ${rep.name}`);
          results.failed++;
          results.errors.push(`No social media found for ${rep.name}`);
        }
        
        results.processed++;
        
        // Small delay between representatives
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
    
    console.log(`\n📱 SOCIAL MEDIA FOCUSED ingestion completed!`);
    console.log(`⏰ Duration: ${durationMinutes} minutes`);
    console.log(`📊 Results: ${results.successful}/${results.processed} successful`);
    console.log(`📱 Social Media Collected:`, results.socialMediaCollected);
    console.log(`🔗 Total Social Links: ${results.totalSocialLinks}`);
    
    return NextResponse.json({
      success: true,
      message: 'SOCIAL MEDIA FOCUSED ingestion completed',
      results,
      duration: `${durationMinutes} minutes`,
      approach: 'Social Media Focused - Collecting all available social media links for every candidate',
      socialMediaBreakdown: results.socialMediaCollected,
      totalSocialLinks: results.totalSocialLinks,
      benefits: [
        'Primary social media fields updated in main table',
        'Detailed social media stored in separate table',
        'All platforms collected: Twitter, Facebook, Instagram, LinkedIn, YouTube',
        'Verified and unverified social media links',
        'Source tracking for each social media link',
        'Ready for candidate social media engagement'
      ],
      nextSteps: [
        'Check representative_social_media table for detailed social media data',
        'Use primary social media fields for quick access',
        'Social media links ready for candidate engagement'
      ]
    });
    
  } catch (error) {
    console.error('SOCIAL MEDIA FOCUSED ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: `SOCIAL MEDIA FOCUSED ingestion failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

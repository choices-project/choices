import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  try {
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    console.log('🔍 Checking social media data collection...');
    
    // Check social media fields in representatives_core
    const { data: socialFields, error: socialError } = await supabase
      .from('representatives_core')
      .select('name, twitter_handle, facebook_url, instagram_handle, linkedin_url, youtube_channel')
      .not('twitter_handle', 'is', null)
      .or('facebook_url.not.is.null,instagram_handle.not.is.null,linkedin_url.not.is.null,youtube_channel.not.is.null')
      .limit(10);
    
    if (socialError) {
      return NextResponse.json({
        success: false,
        error: `Failed to check social media fields: ${socialError.message}`
      });
    }
    
    // Check detailed social media in representative_social_media table
    const { data: detailedSocial, error: detailedError } = await supabase
      .from('representative_social_media')
      .select('representative_id, platform, handle, url, is_verified, source')
      .limit(10);
    
    if (detailedError) {
      return NextResponse.json({
        success: false,
        error: `Failed to check detailed social media: ${detailedError.message}`
      });
    }
    
    // Get counts
    const { count: totalReps } = await supabase
      .from('representatives_core')
      .select('*', { count: 'exact', head: true });
    
    const { count: repsWithTwitter } = await supabase
      .from('representatives_core')
      .select('*', { count: 'exact', head: true })
      .not('twitter_handle', 'is', null);
    
    const { count: repsWithFacebook } = await supabase
      .from('representatives_core')
      .select('*', { count: 'exact', head: true })
      .not('facebook_url', 'is', null);
    
    const { count: repsWithInstagram } = await supabase
      .from('representatives_core')
      .select('*', { count: 'exact', head: true })
      .not('instagram_handle', 'is', null);
    
    const { count: repsWithLinkedIn } = await supabase
      .from('representatives_core')
      .select('*', { count: 'exact', head: true })
      .not('linkedin_url', 'is', null);
    
    const { count: repsWithYouTube } = await supabase
      .from('representatives_core')
      .select('*', { count: 'exact', head: true })
      .not('youtube_channel', 'is', null);
    
    const { count: totalDetailedSocial } = await supabase
      .from('representative_social_media')
      .select('*', { count: 'exact', head: true });
    
    const socialMediaStats = {
      totalRepresentatives: totalReps || 0,
      primaryTable: {
        twitter: repsWithTwitter || 0,
        facebook: repsWithFacebook || 0,
        instagram: repsWithInstagram || 0,
        linkedin: repsWithLinkedIn || 0,
        youtube: repsWithYouTube || 0
      },
      detailedTable: {
        totalRecords: totalDetailedSocial || 0
      },
      coverage: {
        twitter: totalReps ? Math.round(((repsWithTwitter || 0) / totalReps) * 100) : 0,
        facebook: totalReps ? Math.round(((repsWithFacebook || 0) / totalReps) * 100) : 0,
        instagram: totalReps ? Math.round(((repsWithInstagram || 0) / totalReps) * 100) : 0,
        linkedin: totalReps ? Math.round(((repsWithLinkedIn || 0) / totalReps) * 100) : 0,
        youtube: totalReps ? Math.round(((repsWithYouTube || 0) / totalReps) * 100) : 0
      }
    };
    
    // Check what platforms we have in detailed table
    const { data: platformBreakdown } = await supabase
      .from('representative_social_media')
      .select('platform')
      .not('platform', 'is', null);
    
    const platforms = platformBreakdown?.reduce((acc, record) => {
      acc[record.platform] = (acc[record.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return NextResponse.json({
      success: true,
      message: 'Social media data analysis completed',
      socialMediaStats,
      platforms,
      samplePrimarySocial: socialFields || [],
      sampleDetailedSocial: detailedSocial || [],
      analysis: {
        hasPrimarySocial: (repsWithTwitter || 0) > 0 || (repsWithFacebook || 0) > 0 || (repsWithInstagram || 0) > 0,
        hasDetailedSocial: (totalDetailedSocial || 0) > 0,
        bestCoverage: Object.entries(socialMediaStats.coverage).sort((a, b) => b[1] - a[1])[0],
        needsImprovement: Object.values(socialMediaStats.coverage).every(coverage => coverage < 50)
      },
      recommendations: [
        socialMediaStats.coverage.twitter < 20 ? 'Twitter collection needs improvement' : 'Twitter collection is good',
        socialMediaStats.coverage.facebook < 20 ? 'Facebook collection needs improvement' : 'Facebook collection is good',
        socialMediaStats.coverage.instagram < 20 ? 'Instagram collection needs improvement' : 'Instagram collection is good',
        socialMediaStats.coverage.linkedin < 20 ? 'LinkedIn collection needs improvement' : 'LinkedIn collection is good',
        socialMediaStats.coverage.youtube < 20 ? 'YouTube collection needs improvement' : 'YouTube collection is good',
        (totalDetailedSocial || 0) === 0 ? 'Detailed social media table is empty - run enhanced ingestion' : 'Detailed social media data is being collected'
      ]
    });
    
  } catch (error) {
    console.error('Social media check failed:', error);
    return NextResponse.json({
      success: false,
      error: `Social media check failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

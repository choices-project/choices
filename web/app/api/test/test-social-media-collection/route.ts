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

export async function GET(request: NextRequest) {
  try {
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    console.log('📱 Testing social media collection...');
    
    // Get one representative to test with
    const { data: representatives, error: fetchError } = await supabase
      .from('representatives_core')
      .select('id, name, state, office, level, district, bioguide_id, openstates_id, fec_id, google_civic_id')
      .limit(1);
    
    if (fetchError || !representatives || representatives.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No representatives found for testing'
      });
    }
    
    const rep = representatives[0];
    console.log(`👤 Testing social media collection for ${rep.name}`);
    
    const pipeline = new FreeAPIsPipeline();
    
    // Test the pipeline directly for social media
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
    
    if (!enrichedRep) {
      return NextResponse.json({
        success: false,
        error: 'Pipeline returned no data'
      });
    }
    
    // Analyze the social media data
    const socialMediaAnalysis = {
      totalSocialMedia: enrichedRep.socialMedia?.length || 0,
      socialMedia: enrichedRep.socialMedia || [],
      platforms: enrichedRep.socialMedia?.map(s => s.platform) || [],
      handles: enrichedRep.socialMedia?.map(s => s.handle) || [],
      urls: enrichedRep.socialMedia?.map(s => s.url) || [],
      verified: enrichedRep.socialMedia?.filter(s => s.isVerified).length || 0,
      sources: enrichedRep.socialMedia?.map(s => s.source) || [],
      dataSources: enrichedRep.dataSources || []
    };
    
    // Check what APIs provided social media data
    const apiAnalysis = {
      openStates: enrichedRep.dataSources?.includes('openstates') || false,
      congressGov: enrichedRep.dataSources?.includes('congress-gov') || false,
      fec: enrichedRep.dataSources?.includes('fec') || false,
      googleCivic: enrichedRep.dataSources?.includes('google-civic') || false,
      legiscan: enrichedRep.dataSources?.includes('legiscan') || false
    };
    
    return NextResponse.json({
      success: true,
      message: 'Social media collection test completed',
      representative: {
        name: rep.name,
        state: rep.state,
        office: rep.office,
        level: rep.level,
        bioguideId: rep.bioguide_id,
        openstatesId: rep.openstates_id,
        fecId: rep.fec_id
      },
      socialMediaAnalysis,
      apiAnalysis,
      diagnosis: {
        hasSocialMedia: socialMediaAnalysis.totalSocialMedia > 0,
        hasVerifiedSocial: socialMediaAnalysis.verified > 0,
        apisWorking: Object.values(apiAnalysis).some(status => status),
        issue: socialMediaAnalysis.totalSocialMedia === 0 ? 
          'No social media data collected from any API' : 
          socialMediaAnalysis.verified === 0 ? 
          'Social media collected but none verified' : 
          'Social media collection is working correctly'
      },
      recommendations: socialMediaAnalysis.totalSocialMedia === 0 ? [
        'APIs may not be providing social media data',
        'Check if social media extraction methods are working',
        'Verify API responses contain social media information',
        'Consider manual social media research for key representatives'
      ] : socialMediaAnalysis.verified === 0 ? [
        'Social media collected but not verified',
        'Consider manual verification of social media links',
        'APIs may not provide verification status'
      ] : [
        'Social media collection is working correctly',
        'Consider expanding to more representatives',
        'Social media links ready for use'
      ]
    });
    
  } catch (error) {
    console.error('Social media test failed:', error);
    return NextResponse.json({
      success: false,
      error: `Social media test failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

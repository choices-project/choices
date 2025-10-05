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
    
    console.log('🔍 Debugging photo collection...');
    
    // Get one representative to test with
    const { data: representatives, error: fetchError } = await supabase
      .from('representatives_core')
      .select('id, name, state, office, bioguide_id, openstates_id, fec_id')
      .limit(1);
    
    if (fetchError || !representatives || representatives.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No representatives found for testing'
      });
    }
    
    const rep = representatives[0];
    console.log(`👤 Testing photo collection for ${rep.name}`);
    
    const pipeline = new FreeAPIsPipeline();
    
    // Test the pipeline directly
    const enrichedRep = await pipeline.processRepresentative({
      name: rep.name,
      state: rep.state,
      office: rep.office,
      level: rep.level as 'federal' | 'state' | 'local',
      district: rep.district,
      bioguideId: rep.bioguide_id,
      openstatesId: rep.openstates_id,
      fecId: rep.fec_id,
      googleCivicId: null,
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
    
    // Analyze the photos
    const photoAnalysis = {
      totalPhotos: enrichedRep.photos?.length || 0,
      photos: enrichedRep.photos || [],
      photoSources: enrichedRep.photos?.map(p => p.source) || [],
      photoUrls: enrichedRep.photos?.map(p => p.url) || [],
      hasRealPhotos: enrichedRep.photos?.some(p => !p.url.includes('ui-avatars.com')) || false,
      hasFallbackPhotos: enrichedRep.photos?.some(p => p.url.includes('ui-avatars.com')) || false,
      dataSources: enrichedRep.dataSources || [],
      qualityScore: enrichedRep.qualityScore || 0
    };
    
    // Check what APIs were called
    const apiStatus = {
      openStates: enrichedRep.dataSources?.includes('openstates') || false,
      congressGov: enrichedRep.dataSources?.includes('congress-gov') || false,
      fec: enrichedRep.dataSources?.includes('fec') || false,
      googleCivic: enrichedRep.dataSources?.includes('google-civic') || false,
      legiscan: enrichedRep.dataSources?.includes('legiscan') || false
    };
    
    return NextResponse.json({
      success: true,
      message: 'Photo collection debug completed',
      representative: {
        name: rep.name,
        state: rep.state,
        office: rep.office,
        bioguideId: rep.bioguide_id,
        openstatesId: rep.openstates_id,
        fecId: rep.fec_id
      },
      photoAnalysis,
      apiStatus,
      diagnosis: {
        hasPhotos: photoAnalysis.totalPhotos > 0,
        hasRealPhotos: photoAnalysis.hasRealPhotos,
        hasFallbackPhotos: photoAnalysis.hasFallbackPhotos,
        apisWorking: Object.values(apiStatus).some(status => status),
        issue: photoAnalysis.hasFallbackPhotos && !photoAnalysis.hasRealPhotos ? 
          'APIs not returning real photos, using fallback initials' : 
          photoAnalysis.totalPhotos === 0 ? 
          'No photos collected at all' : 
          'Photos are being collected correctly'
      },
      recommendations: photoAnalysis.hasFallbackPhotos && !photoAnalysis.hasRealPhotos ? [
        'APIs may be rate limited',
        'Check if OpenStates API is working',
        'Check if Congress.gov API is working',
        'Wait for rate limits to reset'
      ] : photoAnalysis.totalPhotos === 0 ? [
        'Pipeline not collecting photos',
        'Check API keys',
        'Check network connectivity'
      ] : [
        'Photo collection is working correctly'
      ]
    });
    
  } catch (error) {
    console.error('Photo debug failed:', error);
    return NextResponse.json({
      success: false,
      error: `Photo debug failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

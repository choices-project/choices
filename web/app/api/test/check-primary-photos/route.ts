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
    
    // Check primary photos in representatives_core
    const { data: primaryPhotos, error: primaryError } = await supabase
      .from('representatives_core')
      .select('id, name, primary_photo_url, data_sources')
      .not('primary_photo_url', 'is', null)
      .limit(10);
    
    if (primaryError) {
      return NextResponse.json({
        success: false,
        error: `Failed to check primary photos: ${primaryError.message}`
      });
    }
    
    // Check detailed photos in representative_photos
    const { data: detailedPhotos, error: detailedError } = await supabase
      .from('representative_photos')
      .select('representative_id, url, source, quality, is_primary')
      .limit(10);
    
    if (detailedError) {
      return NextResponse.json({
        success: false,
        error: `Failed to check detailed photos: ${detailedError.message}`
      });
    }
    
    // Get total counts
    const { count: totalReps } = await supabase
      .from('representatives_core')
      .select('*', { count: 'exact', head: true });
    
    const { count: repsWithPrimaryPhotos } = await supabase
      .from('representatives_core')
      .select('*', { count: 'exact', head: true })
      .not('primary_photo_url', 'is', null);
    
    const { count: totalDetailedPhotos } = await supabase
      .from('representative_photos')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      message: 'Photo status check completed',
      summary: {
        totalRepresentatives: totalReps || 0,
        representativesWithPrimaryPhotos: repsWithPrimaryPhotos || 0,
        totalDetailedPhotos: totalDetailedPhotos || 0,
        primaryPhotoPercentage: totalReps ? Math.round(((repsWithPrimaryPhotos || 0) / totalReps) * 100) : 0
      },
      samplePrimaryPhotos: primaryPhotos || [],
      sampleDetailedPhotos: detailedPhotos || [],
      analysis: {
        hasPrimaryPhotos: (repsWithPrimaryPhotos || 0) > 0,
        hasDetailedPhotos: (totalDetailedPhotos || 0) > 0,
        hybridWorking: (repsWithPrimaryPhotos || 0) > 0 && (totalDetailedPhotos || 0) > 0
      }
    });
    
  } catch (error) {
    console.error('Photo check failed:', error);
    return NextResponse.json({
      success: false,
      error: `Photo check failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
